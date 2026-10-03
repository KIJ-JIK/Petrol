import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { ShiftCalculator } from '../../core/domain/shift-calculator.js';
import { ReconciliationEngine } from '../../core/domain/reconciliation.js';
import { JournalEngine } from '../../core/domain/journal-engine.js';
import { StockLedgerEngine } from '../../core/domain/stock-ledger.js';
import { v4 as uuidv4 } from 'uuid';

export const shiftRouter = Router();

// GET /api/v1/shifts/active
shiftRouter.get('/active', (req: Request, res: Response) => {
  try {
    const shift = db.prepare(`
      SELECT s.*, u.name as opened_by_name
      FROM shifts s
      JOIN users u ON s.opened_by_user_id = u.id
      WHERE s.status IN ('OPEN', 'CLOSE_REQUESTED')
      ORDER BY s.opened_at DESC
      LIMIT 1
    `).get() as any;

    if (!shift) {
      return res.json({ shift: null });
    }

    // Fetch nozzles with product info and pricing
    const nozzles = db.prepare(`
      SELECT n.*, p.name as product_name, p.code as product_code, p.current_price_paise,
             d.dispenser_number, d.make as dispenser_make
      FROM nozzles n
      JOIN products p ON n.product_id = p.id
      JOIN dispensers d ON n.dispenser_id = d.id
      ORDER BY d.dispenser_number, n.nozzle_number
    `).all();

    // Fetch any saved draft/submitted readings
    const readings = db.prepare(`
      SELECT * FROM meter_readings WHERE shift_id = ?
    `).all(shift.id);

    // Fetch tender record if exists
    const tenders = db.prepare(`
      SELECT * FROM shift_tenders WHERE shift_id = ?
    `).get(shift.id);

    res.json({
      shift,
      nozzles,
      readings,
      tenders: tenders ? { ...tenders, denomination_counts: JSON.parse((tenders as any).denomination_json || '{}') } : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/shifts/history
shiftRouter.get('/history', (req: Request, res: Response) => {
  try {
    const shifts = db.prepare(`
      SELECT s.*, u1.name as opened_by_name, u2.name as approved_by_name,
             t.cash_actual_paise, t.cash_expected_paise, t.cash_variance_paise
      FROM shifts s
      LEFT JOIN users u1 ON s.opened_by_user_id = u1.id
      LEFT JOIN users u2 ON s.approved_by_user_id = u2.id
      LEFT JOIN shift_tenders t ON s.id = t.shift_id
      ORDER BY s.business_date DESC, s.shift_number DESC
      LIMIT 20
    `).all();

    res.json({ shifts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/shifts/open
shiftRouter.post('/open', (req: Request, res: Response) => {
  try {
    const { outlet_id, shift_number, business_date, user_id, notes } = req.body;

    const existingOpen = db.prepare(`
      SELECT id FROM shifts WHERE outlet_id = ? AND status IN ('OPEN', 'CLOSE_REQUESTED')
    `).get(outlet_id);

    if (existingOpen) {
      return res.status(400).json({ error: 'A shift is already open or awaiting approval. Please close it first.' });
    }

    const shiftId = uuidv4();
    const openedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO shifts (id, outlet_id, shift_number, business_date, status, opened_by_user_id, opened_at, notes)
      VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)
    `).run(shiftId, outlet_id, shift_number || 1, business_date || openedAt.split('T')[0], user_id || 'usr_manager', openedAt, notes || '');

    // Record audit event
    db.prepare(`
      INSERT INTO audit_events (id, tenant_id, outlet_id, actor_user_id, actor_name, action, entity_type, entity_id, after_state)
      VALUES (?, ?, ?, ?, ?, 'SHIFT_OPEN', 'SHIFT', ?, ?)
    `).run(uuidv4(), 'ten_skp_group', outlet_id, user_id || 'usr_manager', 'Manager', shiftId, JSON.stringify({ shift_number, business_date }));

    res.json({ success: true, shift_id: shiftId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/shifts/:id/calculate
shiftRouter.post('/:id/calculate', (req: Request, res: Response) => {
  try {
    const { nozzles_data, tender_data } = req.body;

    const calculatedNozzles = nozzles_data.map((n: any) =>
      ShiftCalculator.calculateNozzle({
        nozzle_id: n.nozzle_id,
        opening_reading: Number(n.opening_reading),
        closing_reading: Number(n.closing_reading),
        testing_litres: Number(n.testing_litres || 0),
        is_rollover: Boolean(n.is_rollover),
        meter_max: Number(n.meter_max || 9999999.99),
        price_paise: Number(n.price_paise),
      })
    );

    const shiftTotals = ShiftCalculator.calculateShiftTotals(calculatedNozzles);

    const reconciliation = ReconciliationEngine.reconcile({
      total_meter_sales_paise: shiftTotals.total_sales_paise,
      upi_amount_paise: Number(tender_data?.upi_amount_paise || 0),
      card_amount_paise: Number(tender_data?.card_amount_paise || 0),
      credit_sales_amount_paise: Number(tender_data?.credit_sales_amount_paise || 0),
      fleet_amount_paise: Number(tender_data?.fleet_amount_paise || 0),
      coupon_amount_paise: Number(tender_data?.coupon_amount_paise || 0),
      expense_from_cash_paise: Number(tender_data?.expense_from_cash_paise || 0),
      cash_drop_paise: Number(tender_data?.cash_drop_paise || 0),
      denominations: tender_data?.denominations || {},
    });

    res.json({
      nozzles: calculatedNozzles,
      totals: shiftTotals,
      reconciliation,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/shifts/:id/submit-close
shiftRouter.post('/:id/submit-close', (req: Request, res: Response) => {
  const shiftId = req.params.id;
  const { user_id, nozzles_data, tender_data, variance_reason, notes } = req.body;

  const tx = db.transaction(() => {
    // 1. Verify shift status
    const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId) as any;
    if (!shift) {
      throw new Error('Shift not found');
    }
    if (shift.status !== 'OPEN' && shift.status !== 'RETURNED') {
      throw new Error(`Cannot submit close for shift in status ${shift.status}`);
    }

    // 2. Calculate nozzle sales
    const calculatedNozzles = nozzles_data.map((n: any) =>
      ShiftCalculator.calculateNozzle({
        nozzle_id: n.nozzle_id,
        opening_reading: Number(n.opening_reading),
        closing_reading: Number(n.closing_reading),
        testing_litres: Number(n.testing_litres || 0),
        is_rollover: Boolean(n.is_rollover),
        meter_max: Number(n.meter_max || 9999999.99),
        price_paise: Number(n.price_paise),
      })
    );

    const shiftTotals = ShiftCalculator.calculateShiftTotals(calculatedNozzles);

    // 3. Reconcile tenders
    const recon = ReconciliationEngine.reconcile({
      total_meter_sales_paise: shiftTotals.total_sales_paise,
      upi_amount_paise: Number(tender_data.upi_amount_paise || 0),
      card_amount_paise: Number(tender_data.card_amount_paise || 0),
      credit_sales_amount_paise: Number(tender_data.credit_sales_amount_paise || 0),
      fleet_amount_paise: Number(tender_data.fleet_amount_paise || 0),
      coupon_amount_paise: Number(tender_data.coupon_amount_paise || 0),
      expense_from_cash_paise: Number(tender_data.expense_from_cash_paise || 0),
      cash_drop_paise: Number(tender_data.cash_drop_paise || 0),
      denominations: tender_data.denominations || {},
    });

    // 4. Save meter readings
    db.prepare('DELETE FROM meter_readings WHERE shift_id = ?').run(shiftId);
    const insertReading = db.prepare(`
      INSERT INTO meter_readings (id, shift_id, nozzle_id, opening_reading, closing_reading, testing_litres, is_rollover, meter_max, gross_litres_sold, net_litres_sold, price_paise, total_amount_paise)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const n of calculatedNozzles) {
      insertReading.run(
        uuidv4(),
        shiftId,
        n.nozzle_id,
        n.opening_reading,
        n.closing_reading,
        n.testing_litres,
        n.is_rollover ? 1 : 0,
        n.meter_max,
        n.gross_litres_sold,
        n.net_litres_sold,
        n.price_paise,
        n.total_amount_paise
      );
    }

    // 5. Save shift tenders
    db.prepare('DELETE FROM shift_tenders WHERE shift_id = ?').run(shiftId);
    db.prepare(`
      INSERT INTO shift_tenders (id, shift_id, cash_actual_paise, cash_expected_paise, cash_variance_paise, upi_amount_paise, card_amount_paise, credit_sales_amount_paise, fleet_amount_paise, coupon_amount_paise, expense_from_cash_paise, cash_drop_paise, denomination_json, variance_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      shiftId,
      recon.actual_cash_paise,
      recon.expected_cash_paise,
      recon.variance_paise,
      tender_data.upi_amount_paise || 0,
      tender_data.card_amount_paise || 0,
      tender_data.credit_sales_amount_paise || 0,
      tender_data.fleet_amount_paise || 0,
      tender_data.coupon_amount_paise || 0,
      tender_data.expense_from_cash_paise || 0,
      tender_data.cash_drop_paise || 0,
      JSON.stringify(tender_data.denominations || {}),
      variance_reason || null
    );

    // 6. Update shift status to CLOSE_REQUESTED
    const closedAt = new Date().toISOString();
    db.prepare(`
      UPDATE shifts
      SET status = 'CLOSE_REQUESTED', closed_by_user_id = ?, closed_at = ?, notes = ?
      WHERE id = ?
    `).run(user_id || 'usr_attendant_1', closedAt, notes || '', shiftId);

    // 7. Audit log
    db.prepare(`
      INSERT INTO audit_events (id, tenant_id, outlet_id, actor_user_id, actor_name, action, entity_type, entity_id, after_state)
      VALUES (?, ?, ?, ?, ?, 'SHIFT_SUBMIT_CLOSE', 'SHIFT', ?, ?)
    `).run(uuidv4(), 'ten_skp_group', shift.outlet_id, user_id || 'usr_attendant_1', 'Attendant', shiftId, JSON.stringify({ totals: shiftTotals, recon }));

    return { totals: shiftTotals, recon };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/shifts/:id/approve
shiftRouter.post('/:id/approve', (req: Request, res: Response) => {
  const shiftId = req.params.id;
  const { user_id, notes } = req.body;

  const tx = db.transaction(() => {
    const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId) as any;
    if (!shift) {
      throw new Error('Shift not found');
    }
    if (shift.status !== 'CLOSE_REQUESTED') {
      throw new Error(`Only shifts in CLOSE_REQUESTED state can be approved (current: ${shift.status})`);
    }

    const readings = db.prepare(`
      SELECT r.*, n.tank_id, n.product_id
      FROM meter_readings r
      JOIN nozzles n ON r.nozzle_id = n.id
      WHERE r.shift_id = ?
    `).all(shiftId) as any[];

    const tenders = db.prepare('SELECT * FROM shift_tenders WHERE shift_id = ?').get(shiftId) as any;
    if (!tenders) {
      throw new Error('Shift tender record missing');
    }

    // 1. Post stock movements for each tank
    const tankSales: { [tankId: string]: { productId: string; litres: number } } = {};
    for (const r of readings) {
      if (!tankSales[r.tank_id]) {
        tankSales[r.tank_id] = { productId: r.product_id, litres: 0 };
      }
      tankSales[r.tank_id].litres += r.net_litres_sold;
    }

    for (const [tankId, sale] of Object.entries(tankSales)) {
      const tank = db.prepare('SELECT * FROM tanks WHERE id = ?').get(tankId) as any;
      const { movement, new_balance_litres } = StockLedgerEngine.recordMovement({
        outlet_id: shift.outlet_id,
        tank_id: tankId,
        product_id: sale.productId,
        movement_type: 'SALE',
        quantity_litres: -sale.litres, // Sales reduce tank stock
        current_balance_litres: tank.current_book_litres,
        reference_type: 'SHIFT',
        reference_id: shiftId,
        notes: `Metered sales from Shift #${shift.shift_number}`,
      });

      // Insert stock movement
      db.prepare(`
        INSERT INTO stock_movements (id, outlet_id, tank_id, product_id, movement_type, quantity_litres, balance_litres, reference_type, reference_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movement.id,
        movement.outlet_id,
        movement.tank_id,
        movement.product_id,
        movement.movement_type,
        movement.quantity_litres,
        movement.balance_litres,
        movement.reference_type,
        movement.reference_id,
        movement.notes
      );

      // Update current book balance on tank
      db.prepare('UPDATE tanks SET current_book_litres = ? WHERE id = ?').run(new_balance_litres, tankId);
    }

    // 2. Update last_reading on nozzles
    for (const r of readings) {
      db.prepare('UPDATE nozzles SET last_reading = ? WHERE id = ?').run(r.closing_reading, r.nozzle_id);
    }

    // 3. Post double-entry journal voucher
    const totalSalesPaise = readings.reduce((acc, r) => acc + r.total_amount_paise, 0);

    const { entry, lines } = JournalEngine.createShiftCloseJournal({
      outlet_id: shift.outlet_id,
      shift_id: shiftId,
      voucher_date: shift.business_date,
      shift_number: shift.shift_number,
      total_sales_paise: totalSalesPaise,
      cash_actual_paise: tenders.cash_actual_paise,
      upi_amount_paise: tenders.upi_amount_paise,
      card_amount_paise: tenders.card_amount_paise,
      fleet_amount_paise: tenders.fleet_amount_paise,
      credit_sales_paise: tenders.credit_sales_amount_paise,
      expense_from_cash_paise: tenders.expense_from_cash_paise,
      variance_paise: tenders.cash_variance_paise,
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

    // 4. Update shift status to APPROVED & POSTED
    const approvedAt = new Date().toISOString();
    db.prepare(`
      UPDATE shifts
      SET status = 'POSTED', approved_by_user_id = ?, approved_at = ?, notes = notes || ' ' || ?
      WHERE id = ?
    `).run(user_id || 'usr_manager', approvedAt, notes || '', shiftId);

    // 5. Audit event
    db.prepare(`
      INSERT INTO audit_events (id, tenant_id, outlet_id, actor_user_id, actor_name, action, entity_type, entity_id, after_state)
      VALUES (?, ?, ?, ?, ?, 'SHIFT_APPROVE_POST', 'SHIFT', ?, ?)
    `).run(uuidv4(), 'ten_skp_group', shift.outlet_id, user_id || 'usr_manager', 'Manager', shiftId, JSON.stringify({ voucher: entry.voucher_number }));

    return { voucher_number: entry.voucher_number };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/shifts/:id/return
shiftRouter.post('/:id/return', (req: Request, res: Response) => {
  const shiftId = req.params.id;
  const { user_id, return_reason } = req.body;

  try {
    if (!return_reason) {
      return res.status(400).json({ error: 'Return reason is required' });
    }

    db.prepare(`
      UPDATE shifts
      SET status = 'RETURNED', return_reason = ?
      WHERE id = ? AND status = 'CLOSE_REQUESTED'
    `).run(return_reason, shiftId);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
