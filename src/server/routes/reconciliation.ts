import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { v4 as uuidv4 } from 'uuid';

export const reconciliationRouter = Router();

// GET /api/v1/reconciliation/statement - List bank statement lines
reconciliationRouter.get('/statement', (req: Request, res: Response) => {
  try {
    const lines = db.prepare(`
      SELECT * FROM bank_statement_lines
      ORDER BY transaction_date DESC, created_at DESC
      LIMIT 100
    `).all();

    const stats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN match_status = 'MATCHED' THEN 1 END) as matched_count,
        COUNT(CASE WHEN match_status = 'UNMATCHED' THEN 1 END) as unmatched_count,
        COUNT(CASE WHEN match_status = 'PENDING_REVIEW' THEN 1 END) as pending_count,
        COALESCE(SUM(credit_paise), 0) as total_credits_paise,
        COALESCE(SUM(debit_paise), 0) as total_debits_paise
      FROM bank_statement_lines
    `).get();

    res.json({ lines, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/reconciliation/import - Import simulated or parsed statement lines
reconciliationRouter.post('/import', (req: Request, res: Response) => {
  const { outlet_id, bank_name, transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'transactions array is required' });
  }

  const tx = db.transaction(() => {
    const insertStmt = db.prepare(`
      INSERT INTO bank_statement_lines (id, outlet_id, bank_name, transaction_date, description, reference_no, credit_paise, debit_paise, match_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNMATCHED', ?)
    `);

    let importedCount = 0;
    for (const t of transactions) {
      insertStmt.run(
        uuidv4(),
        outlet_id || 'out_skp_gadhiya',
        bank_name || 'SBI IOCL Current Account (Gadhiya)',
        t.transaction_date || new Date().toISOString().split('T')[0],
        t.description || 'Bank Credit Entry',
        t.reference_no || null,
        Number(t.credit_paise || 0),
        Number(t.debit_paise || 0),
        t.notes || null
      );
      importedCount++;
    }

    return { importedCount };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/reconciliation/match - Match bank statement line with forecourt transaction
reconciliationRouter.post('/match', (req: Request, res: Response) => {
  const { statement_line_id, matched_entity_type, matched_entity_id, notes } = req.body;

  if (!statement_line_id || !matched_entity_type) {
    return res.status(400).json({ error: 'statement_line_id and matched_entity_type are required' });
  }

  try {
    db.prepare(`
      UPDATE bank_statement_lines
      SET match_status = 'MATCHED', matched_entity_type = ?, matched_entity_id = ?, notes = ?
      WHERE id = ?
    `).run(matched_entity_type, matched_entity_id || null, notes || 'Reconciled to forecourt book', statement_line_id);

    res.json({ success: true, statement_line_id, status: 'MATCHED' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
