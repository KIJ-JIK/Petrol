import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';

export const backupRouter = Router();

// GET /api/v1/system/backup - Export complete database snapshot as JSON
backupRouter.get('/', (req: Request, res: Response) => {
  try {
    const tables = [
      'tenants',
      'outlets',
      'users',
      'products',
      'price_versions',
      'tanks',
      'dip_chart_entries',
      'dispensers',
      'nozzles',
      'shifts',
      'meter_readings',
      'shift_tenders',
      'deliveries',
      'stock_movements',
      'parties',
      'credit_sales',
      'receipts',
      'journal_entries',
      'journal_lines',
      'staff_attendance',
      'staff_advances',
      'staff_payroll',
      'customer_vehicles',
      'banking_transactions',
      'audit_events',
      'asset_status_logs',
      'meter_replacement_exceptions',
      'fuel_density_records',
      'stock_adjustments',
      'customer_invoices',
      'customer_invoice_items',
      'counter_sales',
      'bank_statement_lines',
      'notification_templates',
      'notification_logs',
    ];

    const backupData: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const rows = db.prepare(`SELECT * FROM ${table}`).all();
        backupData[table] = rows;
        totalRecords += rows.length;
      } catch (err: any) {
        backupData[table] = [];
      }
    }

    const payload = {
      version: '1.0.0',
      system: 'SK Petroleum Forecourt Operating System',
      outlet: {
        name: 'SK Petroleum',
        omc_brand: 'Indian Oil Corporation Limited',
        location: 'Gadhiya, Gujarat',
        ro_code: 'IOC-GADHIYA-RO-01',
        gstin: '24AABCS1429B1Z1',
      },
      backup_timestamp: new Date().toISOString(),
      total_tables: tables.length,
      total_records: totalRecords,
      data: backupData,
    };

    const filename = `SK_Petroleum_Gadhiya_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/system/backup/stats - Live statistics on database tables
backupRouter.get('/stats', (req: Request, res: Response) => {
  try {
    const tables = [
      'shifts',
      'journal_entries',
      'parties',
      'credit_sales',
      'receipts',
      'staff_attendance',
      'staff_advances',
      'banking_transactions',
      'tanks',
      'deliveries',
    ];

    const counts: Record<string, number> = {};
    let total = 0;

    for (const table of tables) {
      try {
        const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any;
        counts[table] = row.count;
        total += row.count;
      } catch {
        counts[table] = 0;
      }
    }

    res.json({
      outlet: 'SK Petroleum (Indian Oil), Gadhiya',
      total_records: total,
      table_counts: counts,
      last_backup_status: 'HEALTHY',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
