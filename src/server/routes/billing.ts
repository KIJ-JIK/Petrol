import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { JournalEngine } from '../../core/domain/journal-engine.js';
import { v4 as uuidv4 } from 'uuid';

export const billingRouter = Router();

// GET /api/v1/billing/unbilled-sales - List unbilled credit sales eligible for periodic billing
billingRouter.get('/unbilled-sales', (req: Request, res: Response) => {
  const { party_id } = req.query;

  try {
    let query = `
      SELECT cs.*, p.name as party_name, p2.name as product_name
      FROM credit_sales cs
      JOIN parties p ON cs.party_id = p.id
      JOIN products p2 ON cs.product_id = p2.id
      WHERE cs.is_billed = 0
    `;
    const params: any[] = [];

    if (party_id) {
      query += ' AND cs.party_id = ?';
      params.push(party_id);
    }

    query += ' ORDER BY cs.created_at ASC';

    const unbilledSales = db.prepare(query).all(...params);
    res.json({ unbilledSales });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/billing/generate-invoice - Batch periodic billing for unbilled sales
billingRouter.post('/generate-invoice', (req: Request, res: Response) => {
  const { outlet_id, party_id, billing_cycle, from_date, to_date, sale_ids } = req.body;

  if (!party_id || !Array.isArray(sale_ids) || sale_ids.length === 0) {
    return res.status(400).json({ error: 'party_id and non-empty sale_ids array are required' });
  }

  const tx = db.transaction(() => {
    const party = db.prepare('SELECT name, code FROM parties WHERE id = ?').get(party_id) as any;
    if (!party) throw new Error('Party not found');

    const invoiceId = uuidv4();
    const invoiceNumber = `INV-${party.code || 'CUST'}-${Date.now().toString().slice(-6)}`;

    let totalLitres = 0;
    let subtotalPaise = 0;

    const insertItem = db.prepare(`
      INSERT INTO customer_invoice_items (id, invoice_id, credit_sale_id, vehicle_no, product_name, litres, rate_paise, amount_paise)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateSale = db.prepare(`
      UPDATE credit_sales
      SET is_billed = 1, invoice_id = ?
      WHERE id = ? AND is_billed = 0
    `);

    for (const saleId of sale_ids) {
      const sale = db.prepare(`
        SELECT cs.*, p.name as product_name
        FROM credit_sales cs
        JOIN products p ON cs.product_id = p.id
        WHERE cs.id = ? AND cs.is_billed = 0
      `).get(saleId) as any;

      if (!sale) continue;

      totalLitres += Number(sale.litres);
      subtotalPaise += Number(sale.total_amount_paise);

      insertItem.run(
        uuidv4(),
        invoiceId,
        sale.id,
        sale.vehicle_no || 'Unspecified',
        sale.product_name,
        Number(sale.litres),
        Number(sale.rate_paise),
        Number(sale.total_amount_paise)
      );

      updateSale.run(invoiceId, sale.id);
    }

    if (subtotalPaise === 0) {
      throw new Error('No valid unbilled credit sales selected');
    }

    db.prepare(`
      INSERT INTO customer_invoices (id, outlet_id, party_id, invoice_number, billing_cycle, from_date, to_date, total_litres, subtotal_paise, tax_paise, grand_total_paise, status, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'ISSUED', 'usr_manager')
    `).run(
      invoiceId,
      outlet_id || 'out_skp_gadhiya',
      party_id,
      invoiceNumber,
      billing_cycle || 'FORTNIGHTLY',
      from_date || new Date().toISOString().split('T')[0],
      to_date || new Date().toISOString().split('T')[0],
      totalLitres,
      subtotalPaise,
      subtotalPaise
    );

    return { invoiceId, invoiceNumber, totalLitres, grandTotalPaise: subtotalPaise };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/billing/invoices - Query customer invoices
billingRouter.get('/invoices', (req: Request, res: Response) => {
  try {
    const invoices = db.prepare(`
      SELECT ci.*, p.name as party_name, p.code as party_code, p.phone as party_phone
      FROM customer_invoices ci
      JOIN parties p ON ci.party_id = p.id
      ORDER BY ci.created_at DESC
      LIMIT 100
    `).all() as any[];

    const result = invoices.map((inv) => {
      const items = db.prepare('SELECT * FROM customer_invoice_items WHERE invoice_id = ?').all(inv.id);
      return {
        ...inv,
        items,
      };
    });

    res.json({ invoices: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/billing/counter-sale - Spot counter billing for packaged lubricants & DEF
billingRouter.post('/counter-sale', (req: Request, res: Response) => {
  const { outlet_id, customer_name, customer_phone, product_category, product_name, quantity, unit_price_paise, tender_mode, cash_tendered_paise, digital_tendered_paise } = req.body;

  if (!product_name || !quantity || !unit_price_paise) {
    return res.status(400).json({ error: 'product_name, quantity, and unit_price_paise are required' });
  }

  const tx = db.transaction(() => {
    const totalAmountPaise = Math.round(Number(quantity) * Number(unit_price_paise));
    const billId = uuidv4();
    const billNumber = `POS-LUBE-${Date.now().toString().slice(-6)}`;

    db.prepare(`
      INSERT INTO counter_sales (id, outlet_id, bill_number, customer_name, customer_phone, product_category, product_name, quantity, unit_price_paise, total_amount_paise, tender_mode, cash_tendered_paise, digital_tendered_paise, sold_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      billId,
      outlet_id || 'out_skp_gadhiya',
      billNumber,
      customer_name || 'Retail Forecourt Customer',
      customer_phone || null,
      product_category || 'LUBRICANT',
      product_name,
      Number(quantity),
      Number(unit_price_paise),
      totalAmountPaise,
      tender_mode || 'CASH',
      cash_tendered_paise || (tender_mode === 'CASH' ? totalAmountPaise : 0),
      digital_tendered_paise || (tender_mode === 'UPI' ? totalAmountPaise : 0),
      'usr_manager'
    );

    // Double-entry voucher for lube sales:
    // Debit Cash / Bank Clearing, Credit Lubricant Sales Revenue (4020)
    const entryId = uuidv4();
    const debitAccount = tender_mode === 'CASH'
      ? { code: '1010', name: 'Cash in Hand (Forecourt)' }
      : { code: '1020', name: 'UPI / Digital Settlement Clearing' };

    db.prepare(`
      INSERT INTO journal_entries (id, outlet_id, voucher_number, voucher_date, reference_type, reference_id, narration, total_debit_paise, total_credit_paise)
      VALUES (?, ?, ?, ?, 'COUNTER_SALE', ?, ?, ?, ?)
    `).run(
      entryId,
      outlet_id || 'out_skp_gadhiya',
      `JV-${billNumber}`,
      new Date().toISOString().split('T')[0],
      billId,
      `Counter retail sale: ${quantity}x ${product_name}`,
      totalAmountPaise,
      totalAmountPaise
    );

    const insertLine = db.prepare(`
      INSERT INTO journal_lines (id, journal_entry_id, account_code, account_name, debit_paise, credit_paise)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Debit Tender
    insertLine.run(uuidv4(), entryId, debitAccount.code, debitAccount.name, totalAmountPaise, 0);
    // Credit Lube Revenue
    insertLine.run(uuidv4(), entryId, '4020', 'Packaged Lubricants & DEF Sales Revenue', 0, totalAmountPaise);

    return { billId, billNumber, totalAmountPaise, voucherNumber: `JV-${billNumber}` };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
