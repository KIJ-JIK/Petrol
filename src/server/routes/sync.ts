import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { v4 as uuidv4 } from 'uuid';

export const syncRouter = Router();

// POST /api/v1/sync
syncRouter.post('/', (req: Request, res: Response) => {
  const { outlet_id, events } = req.body;

  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Events array is required' });
  }

  const results: any[] = [];

  const tx = db.transaction(() => {
    for (const event of events) {
      const { idempotency_key, action, device_event_time, payload } = event;

      // Check if already processed
      const existing = db.prepare('SELECT * FROM sync_queue WHERE idempotency_key = ?').get(idempotency_key) as any;
      if (existing) {
        results.push({
          idempotency_key,
          status: existing.status,
          message: 'Already processed',
        });
        continue;
      }

      // Record in sync queue
      const queueId = uuidv4();
      db.prepare(`
        INSERT INTO sync_queue (id, outlet_id, device_event_time, idempotency_key, action, payload_json, status, processed_at)
        VALUES (?, ?, ?, ?, ?, ?, 'PROCESSED', ?)
      `).run(
        queueId,
        outlet_id || 'out_skp_mumbai',
        device_event_time || new Date().toISOString(),
        idempotency_key,
        action,
        JSON.stringify(payload || {}),
        new Date().toISOString()
      );

      // Record audit event
      db.prepare(`
        INSERT INTO audit_events (id, tenant_id, outlet_id, actor_user_id, actor_name, action, entity_type, entity_id, after_state)
        VALUES (?, ?, ?, ?, ?, 'OFFLINE_SYNC_REPLAY', 'QUEUE', ?, ?)
      `).run(
        uuidv4(),
        'ten_skp_group',
        outlet_id || 'out_skp_mumbai',
        payload.user_id || 'usr_attendant_1',
        'Attendant (Offline Sync)',
        idempotency_key,
        JSON.stringify({ action, device_event_time })
      );

      results.push({
        idempotency_key,
        status: 'SYNCED',
        action,
      });
    }
  });

  try {
    tx();
    res.json({ success: true, processed_count: results.length, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
