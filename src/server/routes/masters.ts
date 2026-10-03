import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { v4 as uuidv4 } from 'uuid';

export const mastersRouter = Router();

// GET /api/v1/masters/assets - List all forecourt tanks, dispensers and nozzles with operational status
mastersRouter.get('/assets', (req: Request, res: Response) => {
  try {
    const tanks = db.prepare(`
      SELECT t.*, p.name as product_name, p.code as product_code
      FROM tanks t
      JOIN products p ON t.product_id = p.id
      ORDER BY t.tank_number ASC
    `).all();

    const nozzles = db.prepare(`
      SELECT n.*, d.dispenser_number, d.make as dispenser_make, p.name as product_name, t.name as tank_name
      FROM nozzles n
      JOIN dispensers d ON n.dispenser_id = d.id
      JOIN products p ON n.product_id = p.id
      JOIN tanks t ON n.tank_id = t.id
      ORDER BY d.dispenser_number ASC, n.nozzle_number ASC
    `).all();

    const recentLogs = db.prepare(`
      SELECT l.*, u.name as changed_by_name
      FROM asset_status_logs l
      JOIN users u ON l.changed_by_user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 20
    `).all();

    res.json({ tanks, nozzles, recentLogs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/masters/assets/status - Administrative Open/Stop asset status update
mastersRouter.post('/assets/status', (req: Request, res: Response) => {
  const { outlet_id, asset_type, asset_id, new_status, reason, changed_by_user_id } = req.body;

  if (!asset_type || !asset_id || !new_status || !reason) {
    return res.status(400).json({ error: 'asset_type, asset_id, new_status, and reason are required' });
  }

  const tx = db.transaction(() => {
    let prevStatus = 'ACTIVE';

    if (asset_type === 'NOZZLE') {
      const nozzle = db.prepare('SELECT active FROM nozzles WHERE id = ?').get(asset_id) as any;
      if (!nozzle) throw new Error('Nozzle not found');
      prevStatus = nozzle.active ? 'ACTIVE' : 'INACTIVE';
      const isActiveNum = new_status === 'ACTIVE' ? 1 : 0;
      db.prepare('UPDATE nozzles SET active = ? WHERE id = ?').run(isActiveNum, asset_id);
    } else if (asset_type === 'TANK') {
      const tank = db.prepare('SELECT id FROM tanks WHERE id = ?').get(asset_id) as any;
      if (!tank) throw new Error('Tank not found');
    }

    const logId = uuidv4();
    db.prepare(`
      INSERT INTO asset_status_logs (id, outlet_id, asset_type, asset_id, previous_status, new_status, reason, changed_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      outlet_id || 'out_skp_gadhiya',
      asset_type,
      asset_id,
      prevStatus,
      new_status,
      reason,
      changed_by_user_id || 'usr_manager'
    );

    // Audit event log
    db.prepare(`
      INSERT INTO audit_events (id, tenant_id, outlet_id, actor_user_id, actor_name, action, entity_type, entity_id, before_state, after_state, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'ten_sk_petroleum',
      outlet_id || 'out_skp_gadhiya',
      changed_by_user_id || 'usr_manager',
      'Forecourt Manager',
      `ASSET_STATUS_CHANGE_${new_status}`,
      asset_type,
      asset_id,
      prevStatus,
      new_status,
      reason
    );

    return { logId, previousStatus: prevStatus, newStatus: new_status };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/masters/meters/replace - Meter replacement / baseline reset exception flow
mastersRouter.post('/meters/replace', (req: Request, res: Response) => {
  const { outlet_id, nozzle_id, old_meter_id, new_meter_id, new_baseline_reading, reason, evidence_notes, approved_by_user_id } = req.body;

  if (!nozzle_id || new_baseline_reading === undefined || !reason) {
    return res.status(400).json({ error: 'nozzle_id, new_baseline_reading, and reason are required' });
  }

  const tx = db.transaction(() => {
    const nozzle = db.prepare('SELECT last_reading FROM nozzles WHERE id = ?').get(nozzle_id) as any;
    if (!nozzle) throw new Error('Nozzle not found');

    const oldFinalReading = nozzle.last_reading;
    const exceptionId = uuidv4();

    // 1. Record immutable exception record
    db.prepare(`
      INSERT INTO meter_replacement_exceptions (id, outlet_id, nozzle_id, old_meter_id, old_final_reading, new_meter_id, new_baseline_reading, reason, evidence_notes, approved_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      exceptionId,
      outlet_id || 'out_skp_gadhiya',
      nozzle_id,
      old_meter_id || null,
      oldFinalReading,
      new_meter_id || `MTR-${Date.now().toString().slice(-4)}`,
      Number(new_baseline_reading),
      reason,
      evidence_notes || null,
      approved_by_user_id || 'usr_manager'
    );

    // 2. Set new baseline on nozzle without rewriting historical meter_readings
    db.prepare(`
      UPDATE nozzles
      SET last_reading = ?
      WHERE id = ?
    `).run(Number(new_baseline_reading), nozzle_id);

    // 3. Create Audit Event
    db.prepare(`
      INSERT INTO audit_events (id, tenant_id, outlet_id, actor_user_id, actor_name, action, entity_type, entity_id, before_state, after_state, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'ten_sk_petroleum',
      outlet_id || 'out_skp_gadhiya',
      approved_by_user_id || 'usr_manager',
      'Forecourt Manager',
      'METER_REPLACEMENT_BASELINE',
      'NOZZLE',
      nozzle_id,
      String(oldFinalReading),
      String(new_baseline_reading),
      reason
    );

    return { exceptionId, oldFinalReading, newBaselineReading: Number(new_baseline_reading) };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/masters/prices/history - List price revision history
mastersRouter.get('/prices/history', (req: Request, res: Response) => {
  try {
    const history = db.prepare(`
      SELECT pv.*, p.name as product_name, p.code as product_code
      FROM price_versions pv
      JOIN products p ON pv.product_id = p.id
      ORDER BY pv.effective_from DESC, pv.created_at DESC
      LIMIT 50
    `).all();

    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/masters/prices - Submit new daily price revision
mastersRouter.post('/prices', (req: Request, res: Response) => {
  const { outlet_id, product_id, price_paise, effective_from, source, reason } = req.body;

  if (!product_id || !price_paise || price_paise <= 0) {
    return res.status(400).json({ error: 'product_id and positive price_paise are required' });
  }

  const tx = db.transaction(() => {
    const versionId = uuidv4();
    const effectiveTime = effective_from || new Date().toISOString();

    db.prepare(`
      INSERT INTO price_versions (id, outlet_id, product_id, price_paise, effective_from, source, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      outlet_id || 'out_skp_gadhiya',
      product_id,
      Number(price_paise),
      effectiveTime,
      source || 'Indian Oil Daily Rate Notification',
      reason || 'Daily OMC rate revision'
    );

    // Update current price on product table
    db.prepare('UPDATE products SET current_price_paise = ? WHERE id = ?').run(Number(price_paise), product_id);

    return { versionId, price_paise: Number(price_paise), effectiveTime };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
