import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { JournalEngine } from '../../core/domain/journal-engine.js';
import { JournalEntry, JournalLine } from '../../core/types/domain.js';

export const financeRouter = Router();

// GET /api/v1/finance/journals
financeRouter.get('/journals', (req: Request, res: Response) => {
  try {
    const entries = db.prepare(`
      SELECT * FROM journal_entries ORDER BY voucher_date DESC, created_at DESC LIMIT 50
    `).all() as JournalEntry[];

    const result = entries.map((e) => {
      const lines = db.prepare(`
        SELECT * FROM journal_lines WHERE journal_entry_id = ?
      `).all(e.id) as JournalLine[];
      return {
        ...e,
        lines,
      };
    });

    res.json({ entries: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/finance/journals/:id/reverse
financeRouter.post('/journals/:id/reverse', (req: Request, res: Response) => {
  const journalId = req.params.id;
  const { reason, user_id } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Reversal reason is required' });
  }

  const tx = db.transaction(() => {
    const originalEntry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(journalId) as JournalEntry;
    if (!originalEntry) {
      throw new Error('Journal entry not found');
    }
    if (originalEntry.is_reversed) {
      throw new Error('Journal entry is already reversed');
    }

    const lines = db.prepare('SELECT * FROM journal_lines WHERE journal_entry_id = ?').all(journalId) as JournalLine[];

    // Create balanced reversal
    const { entry: revEntry, lines: revLines } = JournalEngine.createReversalJournal(originalEntry, lines, reason);

    db.prepare(`
      INSERT INTO journal_entries (id, outlet_id, voucher_number, voucher_date, reference_type, reference_id, narration, total_debit_paise, total_credit_paise)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      revEntry.id,
      revEntry.outlet_id,
      revEntry.voucher_number,
      revEntry.voucher_date,
      revEntry.reference_type,
      revEntry.reference_id,
      revEntry.narration,
      revEntry.total_debit_paise,
      revEntry.total_credit_paise
    );

    const insertLine = db.prepare(`
      INSERT INTO journal_lines (id, journal_entry_id, account_code, account_name, debit_paise, credit_paise)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const l of revLines) {
      insertLine.run(l.id, l.journal_entry_id, l.account_code, l.account_name, l.debit_paise, l.credit_paise);
    }

    // Mark original entry as reversed
    db.prepare(`
      UPDATE journal_entries
      SET is_reversed = 1, reversed_by_id = ?
      WHERE id = ?
    `).run(revEntry.id, originalEntry.id);

    return { reversalVoucher: revEntry.voucher_number };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/finance/trial-balance
financeRouter.get('/trial-balance', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT 
        l.account_code,
        l.account_name,
        SUM(l.debit_paise) as total_debits_paise,
        SUM(l.credit_paise) as total_credits_paise
      FROM journal_lines l
      JOIN journal_entries e ON l.journal_entry_id = e.id
      GROUP BY l.account_code, l.account_name
      ORDER BY l.account_code ASC
    `).all() as any[];

    let grandTotalDebits = 0;
    let grandTotalCredits = 0;

    const accounts = rows.map((r) => {
      grandTotalDebits += r.total_debits_paise;
      grandTotalCredits += r.total_credits_paise;
      const net = r.total_debits_paise - r.total_credits_paise;
      return {
        ...r,
        net_balance_paise: net,
        type: net >= 0 ? 'DEBIT' : 'CREDIT',
      };
    });

    res.json({
      accounts,
      grand_total_debits_paise: grandTotalDebits,
      grand_total_credits_paise: grandTotalCredits,
      is_balanced: grandTotalDebits === grandTotalCredits,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
