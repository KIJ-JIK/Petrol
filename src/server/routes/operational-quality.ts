import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { JournalEngine } from '../../core/domain/journal-engine.js';
import { DipChartEngine } from '../../core/domain/dip-chart.js';
import { v4 as uuidv4 } from 'uuid';

export const operationalQualityRouter = Router();

// GET /api/v1/quality/density - List density & temperature records
operationalQualityRouter.get('/density', (req: Request, res: Response) => {
  try {
    const records = db.prepare(`
      SELECT d.*, t.name as tank_name, p.name as product_name, p.code as product_code, u.name as reviewer_name
      FROM fuel_density_records d
      JOIN tanks t ON d.tank_id = t.id
      JOIN products p ON d.product_id = p.id
      JOIN users u ON d.reviewed_by_user_id = u.id
      ORDER BY d.sample_timestamp DESC
      LIMIT 100
    `).all();

    res.json({ records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/quality/density - Record daily observed density & ASTM 15°C calibrated value
operationalQualityRouter.post('/density', (req: Request, res: Response) => {
  const { outlet_id, tank_id, product_id, temperature_celsius, observed_density, sampling_method, sample_result, reviewed_by_user_id, notes } = req.body;

  if (!tank_id || !product_id || observed_density === undefined || temperature_celsius === undefined) {
    return res.status(400).json({ error: 'tank_id, product_id, observed_density, and temperature_celsius are required' });
  }

  // ASTM 53B approximation for Motor Spirit & High Speed Diesel:
  // Density correction: ~0.65 to 0.70 kg/m³ per °C difference from 15°C
  const tempDiff = Number(temperature_celsius) - 15.0;
  const coeff = 0.67;
  const calibratedDensityAt15C = Number((Number(observed_density) + (tempDiff * coeff)).toFixed(2));

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO fuel_density_records (id, outlet_id, tank_id, product_id, sample_timestamp, temperature_celsius, observed_density, density_at_15c, sampling_method, sample_result, reviewed_by_user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      outlet_id || 'out_skp_gadhiya',
      tank_id,
      product_id,
      new Date().toISOString(),
      Number(temperature_celsius),
      Number(observed_density),
      calibratedDensityAt15C,
      sampling_method || 'HYDROMETER_MANUAL',
      sample_result || 'NORMAL',
      reviewed_by_user_id || 'usr_manager',
      notes || null
    );

    res.json({
      success: true,
      id,
      observed_density: Number(observed_density),
      density_at_15c: calibratedDensityAt15C,
      sample_result: sample_result || 'NORMAL',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/quality/adjustments - List controlled stock adjustments
operationalQualityRouter.get('/adjustments', (req: Request, res: Response) => {
  try {
    const adjustments = db.prepare(`
      SELECT sa.*, t.name as tank_name, p.name as product_name, u.name as approver_name
      FROM stock_adjustments sa
      JOIN tanks t ON sa.tank_id = t.id
      JOIN products p ON sa.product_id = p.id
      JOIN users u ON sa.approved_by_user_id = u.id
      ORDER BY sa.created_at DESC
      LIMIT 100
    `).all();

    res.json({ adjustments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/quality/adjustments - Submit controlled evidence-backed stock adjustment
operationalQualityRouter.post('/adjustments', (req: Request, res: Response) => {
  const { outlet_id, tank_id, product_id, adjustment_type, quantity_litres, reason, source_measurement, approved_by_user_id } = req.body;

  if (!tank_id || !product_id || !adjustment_type || quantity_litres === undefined || !reason) {
    return res.status(400).json({ error: 'tank_id, product_id, adjustment_type, quantity_litres, and reason are required' });
  }

  const tx = db.transaction(() => {
    const tank = db.prepare('SELECT * FROM tanks WHERE id = ?').get(tank_id) as any;
    if (!tank) throw new Error('Tank not found');

    const qty = Number(quantity_litres);
    const newBookStock = tank.current_book_litres + qty;
    if (newBookStock < 0) throw new Error('Stock adjustment would result in negative tank balance');

    const adjId = uuidv4();

    // 1. Create Stock Adjustment Record
    db.prepare(`
      INSERT INTO stock_adjustments (id, outlet_id, tank_id, product_id, adjustment_type, quantity_litres, unit, reason, source_measurement, approved_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, 'Litre', ?, ?, ?)
    `).run(
      adjId,
      outlet_id || 'out_skp_gadhiya',
      tank_id,
      product_id,
      adjustment_type,
      qty,
      reason,
      source_measurement || null,
      approved_by_user_id || 'usr_manager'
    );

    // 2. Update tank book balance
    db.prepare('UPDATE tanks SET current_book_litres = ? WHERE id = ?').run(newBookStock, tank_id);

    // 3. Record in stock_movements ledger
    db.prepare(`
      INSERT INTO stock_movements (id, outlet_id, tank_id, product_id, movement_type, quantity_litres, balance_litres, reference_type, reference_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ADJUSTMENT', ?, ?)
    `).run(
      uuidv4(),
      outlet_id || 'out_skp_gadhiya',
      tank_id,
      product_id,
      qty >= 0 ? 'ADJUSTMENT_GAIN' : 'ADJUSTMENT_LOSS',
      qty,
      newBookStock,
      adjId,
      `Controlled ${adjustment_type}: ${reason}`
    );

    // 4. Record Audit Event
    db.prepare(`
      INSERT INTO audit_events (id, tenant_id, outlet_id, actor_user_id, actor_name, action, entity_type, entity_id, before_state, after_state, reason)
      VALUES (?, ?, ?, ?, ?, ?, 'TANK_STOCK', ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'ten_sk_petroleum',
      outlet_id || 'out_skp_gadhiya',
      approved_by_user_id || 'usr_manager',
      'Forecourt Manager',
      `CONTROLLED_STOCK_ADJUSTMENT_${adjustment_type}`,
      tank_id,
      String(tank.current_book_litres),
      String(newBookStock),
      reason
    );

    return { adjId, previousBookStock: tank.current_book_litres, newBookStock };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/quality/quick-dip - Fast mobile dip inspection tool
operationalQualityRouter.post('/quick-dip', (req: Request, res: Response) => {
  const { tank_id, dip_mm } = req.body;

  if (!tank_id || dip_mm === undefined) {
    return res.status(400).json({ error: 'tank_id and dip_mm are required' });
  }

  try {
    const tank = db.prepare(`
      SELECT t.*, p.name as product_name
      FROM tanks t
      JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `).get(tank_id) as any;

    if (!tank) return res.status(404).json({ error: 'Tank not found' });

    // Fetch dip chart calibration entries for this tank
    const chartEntries = db.prepare(`
      SELECT dip_mm, volume_litres
      FROM dip_chart_entries
      WHERE tank_id = ?
      ORDER BY dip_mm ASC
    `).all(tank_id) as any[];

    const convertedLitres = DipChartEngine.interpolateVolume(Number(dip_mm), chartEntries);
    const varianceLitres = convertedLitres - tank.current_book_litres;
    const isVarianceBreached = Math.abs(varianceLitres) > 200; // > 200 Litres threshold

    res.json({
      tank_id,
      tank_name: tank.name,
      product_name: tank.product_name,
      dip_mm: Number(dip_mm),
      converted_litres: convertedLitres,
      current_book_litres: tank.current_book_litres,
      variance_litres: varianceLitres,
      is_breached: isVarianceBreached,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
