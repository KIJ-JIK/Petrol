import express from 'express';
import cors from 'cors';
import { shiftRouter } from './routes/shifts.js';
import { tankRouter } from './routes/tanks.js';
import { khataRouter } from './routes/khata.js';
import { financeRouter } from './routes/finance.js';
import { reportRouter } from './routes/reports.js';
import { syncRouter } from './routes/sync.js';
import { vouchersRouter } from './routes/vouchers.js';
import { payrollRouter } from './routes/payroll.js';
import { reportsHubRouter } from './routes/reports-hub.js';
import { backupRouter } from './routes/backup.js';
import { mastersRouter } from './routes/masters.js';
import { operationalQualityRouter } from './routes/operational-quality.js';
import { billingRouter } from './routes/billing.js';
import { reconciliationRouter } from './routes/reconciliation.js';
import { communicationsRouter } from './routes/communications.js';
import { db } from '../core/database/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/shifts', shiftRouter);
app.use('/api/v1/tanks', tankRouter);
app.use('/api/v1/parties', khataRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/vouchers', vouchersRouter);
app.use('/api/v1/payroll', payrollRouter);
app.use('/api/v1/reports-hub', reportsHubRouter);
app.use('/api/v1/backup', backupRouter);
app.use('/api/v1/masters', mastersRouter);
app.use('/api/v1/quality', operationalQualityRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/reconciliation', reconciliationRouter);
app.use('/api/v1/communications', communicationsRouter);

// Health & System status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    outlet: 'SK Petroleum (Indian Oil), Gadhiya',
    timestamp: new Date().toISOString(),
  });
});

// Outlets & Users list for quick role switching in prototype
app.get('/api/v1/metadata', (req, res) => {
  const users = db.prepare('SELECT id, name, phone, role FROM users WHERE active = 1').all();
  const outlet = db.prepare('SELECT * FROM outlets LIMIT 1').get();
  res.json({ outlet, users });
});

import path from 'path';
import fs from 'fs';

// Serve frontend static build in production if available
const distPath = path.resolve(import.meta.dirname, '../../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Petrol Pump Management API Server running at http://localhost:${PORT}`);
});
