import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { JournalEngine } from '../../core/domain/journal-engine.js';
import { v4 as uuidv4 } from 'uuid';

export const khataRouter = Router();

// GET /api/v1/parties
khataRouter.get('/', (req: Request, res: Response) => {
  try {
    const parties = db.prepare(`
      SELECT * FROM parties ORDER BY name ASC
    `).all() as any[];

    const parsed = parties.map((p) => ({
      ...p,
      vehicles: JSON.parse(p.vehicles_json || '[]'),
      is_over_limit: p.current_balance_paise > p.credit_limit_paise,
    }));

    res.json({ parties: parsed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/parties
khataRouter.post('/', (req: Request, res: Response) => {
  const { outlet_id, name, code, phone, credit_limit_paise, payment_terms_days, vehicles } = req.body;

  try {
    const partyId = uuidv4();
    db.prepare(`
      INSERT INTO parties (id, outlet_id, name, code, phone, credit_limit_paise, current_balance_paise, payment_terms_days, vehicles_json)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      partyId,
      outlet_id || 'out_skp_mumbai',
      name,
      code,
      phone,
      credit_limit_paise || 5000000,
      payment_terms_days || 15,
      JSON.stringify(vehicles || [])
    );

    res.json({ success: true, party_id: partyId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/parties/credit-sales
khataRouter.post('/credit-sales', (req: Request, res: Response) => {
  const { outlet_id, shift_id, party_id, vehicle_no, product_id, litres, rate_paise, slip_no } = req.body;

  const tx = db.transaction(() => {
    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(party_id) as any;
    if (!party) {
      throw new Error('Party not found');
    }

    const totalAmountPaise = Math.round(Number(litres) * Number(rate_paise));
    const saleId = uuidv4();

    db.prepare(`
      INSERT INTO credit_sales (id, outlet_id, shift_id, party_id, vehicle_no, product_id, litres, rate_paise, total_amount_paise, slip_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saleId,
      outlet_id || party.outlet_id,
      shift_id || null,
      party_id,
      vehicle_no || null,
      product_id,
      litres,
      rate_paise,
      totalAmountPaise,
      slip_no || `SL-${Date.now().toString().slice(-5)}`
    );

    // Update customer outstanding balance
    db.prepare(`
      UPDATE parties
      SET current_balance_paise = current_balance_paise + ?
      WHERE id = ?
    `).run(totalAmountPaise, party_id);

    return { saleId, totalAmountPaise, newBalancePaise: party.current_balance_paise + totalAmountPaise };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/parties/receipts
khataRouter.post('/receipts', (req: Request, res: Response) => {
  const { outlet_id, party_id, amount_paise, payment_mode, reference_no, notes } = req.body;

  const tx = db.transaction(() => {
    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(party_id) as any;
    if (!party) {
      throw new Error('Party not found');
    }

    const receiptId = uuidv4();
    const voucherDate = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO receipts (id, outlet_id, party_id, amount_paise, payment_mode, reference_no, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      receiptId,
      outlet_id || party.outlet_id,
      party_id,
      amount_paise,
      payment_mode || 'BANK_TRANSFER',
      reference_no || null,
      notes || null
    );

    // Reduce customer balance
    db.prepare(`
      UPDATE parties
      SET current_balance_paise = current_balance_paise - ?
      WHERE id = ?
    `).run(amount_paise, party_id);

    // Post balanced double-entry voucher
    const { entry, lines } = JournalEngine.createReceiptJournal({
      outlet_id: outlet_id || party.outlet_id,
      receipt_id: receiptId,
      party_name: party.name,
      voucher_date: voucherDate,
      amount_paise,
      payment_mode: payment_mode || 'BANK_TRANSFER',
    });

    db.prepare(`
      INSERT INTO journal_entries (id, outlet_id, voucher_number, voucher_date, reference_type, reference_id, narration, total_debit_paise, total_credit_paise)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.outlet_id,
      entry.voucher_number,
      entry.voucher_date,
      entry.reference_type,
      entry.reference_id,
      entry.narration,
      entry.total_debit_paise,
      entry.total_credit_paise
    );

    const insertLine = db.prepare(`
      INSERT INTO journal_lines (id, journal_entry_id, account_code, account_name, debit_paise, credit_paise)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const l of lines) {
      insertLine.run(l.id, l.journal_entry_id, l.account_code, l.account_name, l.debit_paise, l.credit_paise);
    }

    return { receiptId, voucherNumber: entry.voucher_number };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/parties/:id/statement
khataRouter.get('/:id/statement', (req: Request, res: Response) => {
  const partyId = req.params.id;

  try {
    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(partyId) as any;
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const sales = db.prepare(`
      SELECT cs.*, p.name as product_name
      FROM credit_sales cs
      JOIN products p ON cs.product_id = p.id
      WHERE cs.party_id = ?
      ORDER BY cs.created_at ASC
    `).all(partyId) as any[];

    const receipts = db.prepare(`
      SELECT * FROM receipts WHERE party_id = ? ORDER BY created_at ASC
    `).all(partyId) as any[];

    // Calculate Ageing buckets (0-15, 16-30, 31-60, 60+ days)
    const now = new Date().getTime();
    const ageing = {
      bucket_0_15_paise: 0,
      bucket_16_30_paise: 0,
      bucket_31_60_paise: 0,
      bucket_60_plus_paise: 0,
    };

    for (const s of sales) {
      const saleDate = new Date(s.created_at).getTime();
      const diffDays = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
      const outstanding = s.total_amount_paise - s.allocated_paise;

      if (outstanding > 0) {
        if (diffDays <= 15) ageing.bucket_0_15_paise += outstanding;
        else if (diffDays <= 30) ageing.bucket_16_30_paise += outstanding;
        else if (diffDays <= 60) ageing.bucket_31_60_paise += outstanding;
        else ageing.bucket_60_plus_paise += outstanding;
      }
    }

    res.json({
      party: {
        ...party,
        vehicles: JSON.parse(party.vehicles_json || '[]'),
      },
      sales,
      receipts,
      ageing,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
