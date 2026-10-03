import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { DipChartEngine } from '../../core/domain/dip-chart.js';
import { StockLedgerEngine } from '../../core/domain/stock-ledger.js';
import { JournalEngine } from '../../core/domain/journal-engine.js';
import { DipChartEntry } from '../../core/types/domain.js';
import { v4 as uuidv4 } from 'uuid';

export const tankRouter = Router();

// GET /api/v1/tanks
tankRouter.get('/', (req: Request, res: Response) => {
  try {
    const tanks = db.prepare(`
      SELECT t.*, p.name as product_name, p.code as product_code, p.current_price_paise
      FROM tanks t
      JOIN products p ON t.product_id = p.id
      ORDER BY t.tank_number
    `).all() as any[];

    const enriched = tanks.map((t) => {
      const variance = StockLedgerEngine.calculateVariance(t.current_dip_litres, t.current_book_litres);
      return {
        ...t,
        variance,
      };
    });

    res.json({ tanks: enriched });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/tanks/:id/dip
tankRouter.post('/:id/dip', (req: Request, res: Response) => {
  const tankId = req.params.id;
  const { dip_mm } = req.body;

  try {
    const chartEntries = db.prepare(`
      SELECT * FROM dip_chart_entries WHERE tank_id = ? ORDER BY dip_mm ASC
    `).all(tankId) as DipChartEntry[];

    if (!chartEntries || chartEntries.length === 0) {
      return res.status(400).json({ error: 'No dip chart calibration found for this tank' });
    }

    const calculatedVolume = DipChartEngine.interpolateVolume(Number(dip_mm), chartEntries);

    const tank = db.prepare('SELECT * FROM tanks WHERE id = ?').get(tankId) as any;
    if (!tank) {
      return res.status(404).json({ error: 'Tank not found' });
    }

    db.prepare(`
      UPDATE tanks
      SET current_dip_mm = ?, current_dip_litres = ?
      WHERE id = ?
    `).run(dip_mm, calculatedVolume, tankId);

    const variance = StockLedgerEngine.calculateVariance(calculatedVolume, tank.current_book_litres);

    // Record audit event
    db.prepare(`
      INSERT INTO audit_events (id, tenant_id, outlet_id, actor_user_id, actor_name, action, entity_type, entity_id, after_state)
      VALUES (?, ?, ?, ?, ?, 'RECORD_DIP', 'TANK', ?, ?)
    `).run(
      uuidv4(),
      'ten_skp_group',
      tank.outlet_id,
      'usr_manager',
      'Manager',
      tankId,
      JSON.stringify({ dip_mm, volume: calculatedVolume, variance })
    );

    res.json({
      success: true,
      tank_id: tankId,
      dip_mm,
      dip_litres: calculatedVolume,
      variance,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/tanks/movements
tankRouter.get('/movements', (req: Request, res: Response) => {
  try {
    const movements = db.prepare(`
      SELECT m.*, t.name as tank_name, p.name as product_name
      FROM stock_movements m
      JOIN tanks t ON m.tank_id = t.id
      JOIN products p ON m.product_id = p.id
      ORDER BY m.created_at DESC
      LIMIT 50
    `).all();

    res.json({ movements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/tanks/deliveries
tankRouter.get('/deliveries', (req: Request, res: Response) => {
  try {
    const deliveries = db.prepare(`
      SELECT d.*, t.name as tank_name, p.name as product_name
      FROM deliveries d
      JOIN tanks t ON d.tank_id = t.id
      JOIN products p ON t.product_id = p.id
      ORDER BY d.created_at DESC
      LIMIT 20
    `).all();

    res.json({ deliveries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/tanks/deliveries
tankRouter.post('/deliveries', (req: Request, res: Response) => {
  const {
    tank_id,
    invoice_number,
    invoice_date,
    supplier_name,
    tanker_truck_no,
    invoice_litres,
    opening_dip_mm,
    closing_dip_mm,
    density_observed,
    temperature_celsius,
    total_cost_paise,
  } = req.body;

  const tx = db.transaction(() => {
    const tank = db.prepare('SELECT * FROM tanks WHERE id = ?').get(tank_id) as any;
    if (!tank) {
      throw new Error('Tank not found');
    }

    const chart = db.prepare(`
      SELECT * FROM dip_chart_entries WHERE tank_id = ? ORDER BY dip_mm ASC
    `).all(tank_id) as DipChartEntry[];

    const openingDipLitres = DipChartEngine.interpolateVolume(Number(opening_dip_mm), chart);
    const closingDipLitres = DipChartEngine.interpolateVolume(Number(closing_dip_mm), chart);

    // Variance between dip volume rise and invoiced volume
    const receivedFromDip = closingDipLitres - openingDipLitres;
    const varianceLitres = Math.round((receivedFromDip - Number(invoice_litres)) * 100) / 100;

    const deliveryId = uuidv4();

    // 1. Record delivery
    db.prepare(`
      INSERT INTO deliveries (
        id, outlet_id, tank_id, invoice_number, invoice_date, supplier_name,
        tanker_truck_no, invoice_litres, received_litres, opening_dip_mm,
        opening_dip_litres, closing_dip_mm, closing_dip_litres, variance_litres,
        density_observed, temperature_celsius, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
    `).run(
      deliveryId,
      tank.outlet_id,
      tank.id,
      invoice_number,
      invoice_date || new Date().toISOString().split('T')[0],
      supplier_name || 'Hindustan Petroleum Corp Ltd',
      tanker_truck_no,
      invoice_litres,
      receivedFromDip,
      opening_dip_mm,
      openingDipLitres,
      closing_dip_mm,
      closingDipLitres,
      varianceLitres,
      density_observed || 745.0,
      temperature_celsius || 28.5
    );

    // 2. Post stock movement (positive for receipt)
    const { movement, new_balance_litres } = StockLedgerEngine.recordMovement({
      outlet_id: tank.outlet_id,
      tank_id: tank.id,
      product_id: tank.product_id,
      movement_type: 'DELIVERY',
      quantity_litres: Number(invoice_litres),
      current_balance_litres: tank.current_book_litres,
      reference_type: 'DELIVERY',
      reference_id: deliveryId,
      notes: `Invoice ${invoice_number} from ${supplier_name}. Tanker ${tanker_truck_no}`,
    });

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

    // 3. Update tank book balance and dip values
    db.prepare(`
      UPDATE tanks
      SET current_book_litres = ?, current_dip_mm = ?, current_dip_litres = ?
      WHERE id = ?
    `).run(new_balance_litres, closing_dip_mm, closingDipLitres, tank.id);

    // 4. Post double-entry journal voucher for delivery
    const { entry, lines } = JournalEngine.createDeliveryJournal({
      outlet_id: tank.outlet_id,
      delivery_id: deliveryId,
      voucher_date: invoice_date || new Date().toISOString().split('T')[0],
      invoice_number,
      supplier_name: supplier_name || 'Hindustan Petroleum Corp Ltd',
      total_cost_paise: Number(total_cost_paise) || Math.round(invoice_litres * 8500), // Default wholesale estimate if not given
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

    return { deliveryId, varianceLitres, voucherNumber: entry.voucher_number };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
