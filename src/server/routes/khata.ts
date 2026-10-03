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

    const parsed = parties.map((p) => {
      // Also fetch vehicles from customer_vehicles table
      const dbVehicles = db.prepare('SELECT * FROM customer_vehicles WHERE party_id = ?').all(p.id) as any[];
      const jsonVehicles = JSON.parse(p.vehicles_json || '[]');
      const combinedVehicles = dbVehicles.length > 0 ? dbVehicles.map(v => v.vehicle_no) : jsonVehicles;

      return {
        ...p,
        vehicles: combinedVehicles,
        is_over_limit: p.current_balance_paise > p.credit_limit_paise,
      };
    });

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
    const vehicleList = Array.isArray(vehicles) ? vehicles : [];

    db.prepare(`
      INSERT INTO parties (id, outlet_id, name, code, phone, credit_limit_paise, current_balance_paise, payment_terms_days, vehicles_json)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      partyId,
      outlet_id || 'out_skp_gadhiya',
      name,
      code,
      phone,
      credit_limit_paise || 5000000,
      payment_terms_days || 15,
      JSON.stringify(vehicleList)
    );

    // Also populate customer_vehicles table
    for (const v of vehicleList) {
      db.prepare(`
        INSERT INTO customer_vehicles (id, party_id, vehicle_no)
        VALUES (?, ?, ?)
      `).run(uuidv4(), partyId, String(v).trim().toUpperCase());
    }

    res.json({ success: true, party_id: partyId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/parties/consumption-report - Vehicle and Customer fuel consumption
khataRouter.get('/consumption-report', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT 
        cs.party_id,
        p.name as party_name,
        COALESCE(cs.vehicle_no, 'Unspecified') as vehicle_no,
        p2.name as product_name,
        SUM(cs.litres) as total_litres,
        SUM(cs.total_amount_paise) as total_amount_paise,
        COUNT(cs.id) as fill_count,
        MAX(cs.created_at) as last_fill_date
      FROM credit_sales cs
      JOIN parties p ON cs.party_id = p.id
      JOIN products p2 ON cs.product_id = p2.id
      GROUP BY cs.party_id, p.name, cs.vehicle_no, p2.name
      ORDER BY total_amount_paise DESC
    `).all();

    res.json({ report: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/parties/ageing-summary - Outstanding ageing across all accounts
khataRouter.get('/ageing-summary', (req: Request, res: Response) => {
  try {
    const parties = db.prepare('SELECT id, name, credit_limit_paise, current_balance_paise FROM parties WHERE active = 1').all() as any[];

    const now = new Date().getTime();
    let totalOutstanding = 0;
    let totalBucket0_15 = 0;
    let totalBucket16_30 = 0;
    let totalBucket31_60 = 0;
    let totalBucket60Plus = 0;

    const partyAgeing = parties.map((p) => {
      totalOutstanding += p.current_balance_paise;
      const sales = db.prepare(`
        SELECT total_amount_paise, allocated_paise, created_at
        FROM credit_sales
        WHERE party_id = ? AND total_amount_paise > allocated_paise
      `).all(p.id) as any[];

      const ageing = {
        bucket_0_15: 0,
        bucket_16_30: 0,
        bucket_31_60: 0,
        bucket_60_plus: 0,
      };

      for (const s of sales) {
        const saleDate = new Date(s.created_at).getTime();
        const diffDays = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
        const rem = s.total_amount_paise - s.allocated_paise;
        if (diffDays <= 15) ageing.bucket_0_15 += rem;
        else if (diffDays <= 30) ageing.bucket_16_30 += rem;
        else if (diffDays <= 60) ageing.bucket_31_60 += rem;
        else ageing.bucket_60_plus += rem;
      }

      totalBucket0_15 += ageing.bucket_0_15;
      totalBucket16_30 += ageing.bucket_16_30;
      totalBucket31_60 += ageing.bucket_31_60;
      totalBucket60Plus += ageing.bucket_60_plus;

      return {
        ...p,
        ageing,
      };
    });

    res.json({
      summary: {
        total_outstanding_paise: totalOutstanding,
        bucket_0_15_paise: totalBucket0_15,
        bucket_16_30_paise: totalBucket16_30,
        bucket_31_60_paise: totalBucket31_60,
        bucket_60_plus_paise: totalBucket60Plus,
      },
      party_breakdown: partyAgeing,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/parties/:id/vehicles - Get vehicles for a customer
khataRouter.get('/:id/vehicles', (req: Request, res: Response) => {
  const partyId = req.params.id;
  try {
    const vehicles = db.prepare('SELECT * FROM customer_vehicles WHERE party_id = ? ORDER BY vehicle_no ASC').all(partyId);
    res.json({ vehicles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/parties/:id/vehicles - Add customer vehicle
khataRouter.post('/:id/vehicles', (req: Request, res: Response) => {
  const partyId = req.params.id;
  const { vehicle_no, make_model, driver_name, driver_phone } = req.body;

  if (!vehicle_no) {
    return res.status(400).json({ error: 'Vehicle number is required' });
  }

  try {
    const id = uuidv4();
    const cleanNo = String(vehicle_no).trim().toUpperCase();
    db.prepare(`
      INSERT INTO customer_vehicles (id, party_id, vehicle_no, make_model, driver_name, driver_phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, partyId, cleanNo, make_model || null, driver_name || null, driver_phone || null);

    // Sync to parties.vehicles_json
    const party = db.prepare('SELECT vehicles_json FROM parties WHERE id = ?').get(partyId) as any;
    if (party) {
      const vList = JSON.parse(party.vehicles_json || '[]');
      if (!vList.includes(cleanNo)) {
        vList.push(cleanNo);
        db.prepare('UPDATE parties SET vehicles_json = ? WHERE id = ?').run(JSON.stringify(vList), partyId);
      }
    }

    res.json({ success: true, vehicle: { id, party_id: partyId, vehicle_no: cleanNo } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
