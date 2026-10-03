import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { JournalEngine } from '../../core/domain/journal-engine.js';
import { JournalEntry, JournalLine } from '../../core/types/domain.js';
import { v4 as uuidv4 } from 'uuid';

export const vouchersRouter = Router();

// GET /api/v1/vouchers - List all 6 voucher types with line items
vouchersRouter.get('/', (req: Request, res: Response) => {
  try {
    const { type, from_date, to_date, limit } = req.query;

    let query = 'SELECT * FROM journal_entries WHERE 1=1';
    const params: any[] = [];

    if (type) {
      query += ' AND reference_type = ?';
      params.push(type);
    }
    if (from_date) {
      query += ' AND voucher_date >= ?';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND voucher_date <= ?';
      params.push(to_date);
    }

    query += ' ORDER BY voucher_date DESC, created_at DESC';
    query += ` LIMIT ${Number(limit) || 100}`;

    const entries = db.prepare(query).all(...params) as JournalEntry[];

    const result = entries.map((entry) => {
      const lines = db.prepare('SELECT * FROM journal_lines WHERE journal_entry_id = ?').all(entry.id) as JournalLine[];
      return {
        ...entry,
        lines,
      };
    });

    res.json({ vouchers: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/vouchers/payment - Create Payment Voucher (Voucher 4)
vouchersRouter.post('/payment', (req: Request, res: Response) => {
  const { outlet_id, voucher_date, vendor_name, expense_category, amount_paise, paid_from, narration } = req.body;

  if (!vendor_name || !amount_paise || amount_paise <= 0) {
    return res.status(400).json({ error: 'Vendor name and positive amount are required' });
  }

  const tx = db.transaction(() => {
    const { entry, lines } = JournalEngine.createPaymentVoucher({
      outlet_id: outlet_id || 'out_skp_gadhiya',
      voucher_date: voucher_date || new Date().toISOString().split('T')[0],
      vendor_name,
      expense_category: expense_category || 'Station Maintenance',
      amount_paise: Number(amount_paise),
      paid_from: paid_from || 'CASH',
      narration: narration || `Payment to ${vendor_name} for ${expense_category}`,
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

    return { voucher: entry, lines };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/vouchers/contra - Create Banking & Contra Voucher (Voucher 5)
vouchersRouter.post('/contra', (req: Request, res: Response) => {
  const { outlet_id, voucher_date, transaction_type, bank_name, amount_paise, reference_no, narration } = req.body;

  if (!transaction_type || !amount_paise || amount_paise <= 0) {
    return res.status(400).json({ error: 'Transaction type and positive amount are required' });
  }

  const tx = db.transaction(() => {
    const { entry, lines } = JournalEngine.createContraBankingVoucher({
      outlet_id: outlet_id || 'out_skp_gadhiya',
      voucher_date: voucher_date || new Date().toISOString().split('T')[0],
      transaction_type,
      bank_name: bank_name || 'SBI IOCL Current Account',
      amount_paise: Number(amount_paise),
      reference_no,
      narration,
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

    // Also record in banking_transactions
    db.prepare(`
      INSERT INTO banking_transactions (id, outlet_id, transaction_type, amount_paise, source_account, destination_account, reference_no, transaction_date, narration, voucher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      entry.outlet_id,
      transaction_type,
      Number(amount_paise),
      transaction_type === 'CASH_DEPOSIT' ? 'Forecourt Cash' : transaction_type === 'BANK_WITHDRAWAL' ? bank_name : 'Digital Gateway',
      transaction_type === 'BANK_WITHDRAWAL' ? 'Forecourt Cash' : bank_name,
      reference_no || null,
      voucher_date || new Date().toISOString().split('T')[0],
      narration || entry.narration,
      entry.id
    );

    return { voucher: entry, lines };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/vouchers/adjustment - Create Adjustment Voucher (Voucher 6)
vouchersRouter.post('/adjustment', (req: Request, res: Response) => {
  const { outlet_id, voucher_date, debit_account_code, debit_account_name, credit_account_code, credit_account_name, amount_paise, reason } = req.body;

  if (!debit_account_code || !credit_account_code || !amount_paise || amount_paise <= 0 || !reason) {
    return res.status(400).json({ error: 'Debit account, Credit account, amount and reason are required' });
  }

  const tx = db.transaction(() => {
    const { entry, lines } = JournalEngine.createAdjustmentVoucher({
      outlet_id: outlet_id || 'out_skp_gadhiya',
      voucher_date: voucher_date || new Date().toISOString().split('T')[0],
      debit_account_code,
      debit_account_name: debit_account_name || `Account ${debit_account_code}`,
      credit_account_code,
      credit_account_name: credit_account_name || `Account ${credit_account_code}`,
      amount_paise: Number(amount_paise),
      reason,
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

    return { voucher: entry, lines };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/vouchers/profit-loss - Real-time Trading & Profit and Loss Statement
vouchersRouter.get('/profit-loss', (req: Request, res: Response) => {
  try {
    const { from_date, to_date } = req.query;

    let dateFilter = '';
    const params: any[] = [];
    if (from_date && to_date) {
      dateFilter = ' AND e.voucher_date BETWEEN ? AND ?';
      params.push(from_date, to_date);
    }

    // Revenue accounts (4000 series)
    const revenueRows = db.prepare(`
      SELECT l.account_code, l.account_name, SUM(l.credit_paise - l.debit_paise) as amount_paise
      FROM journal_lines l
      JOIN journal_entries e ON l.journal_entry_id = e.id
      WHERE l.account_code LIKE '4%' AND e.is_reversed = 0 ${dateFilter}
      GROUP BY l.account_code, l.account_name
    `).all(...params) as any[];

    // Expense accounts (5000 series)
    const expenseRows = db.prepare(`
      SELECT l.account_code, l.account_name, SUM(l.debit_paise - l.credit_paise) as amount_paise
      FROM journal_lines l
      JOIN journal_entries e ON l.journal_entry_id = e.id
      WHERE l.account_code LIKE '5%' AND e.is_reversed = 0 ${dateFilter}
      GROUP BY l.account_code, l.account_name
    `).all(...params) as any[];

    const totalRevenuePaise = revenueRows.reduce((acc, r) => acc + (r.amount_paise || 0), 0);
    const totalExpensesPaise = expenseRows.reduce((acc, r) => acc + (r.amount_paise || 0), 0);
    const netProfitPaise = totalRevenuePaise - totalExpensesPaise;

    res.json({
      revenue: revenueRows,
      expenses: expenseRows,
      total_revenue_paise: totalRevenuePaise,
      total_expenses_paise: totalExpensesPaise,
      net_profit_paise: netProfitPaise,
      margin_percentage: totalRevenuePaise > 0 ? ((netProfitPaise / totalRevenuePaise) * 100).toFixed(2) : '0.00',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/vouchers/cash-flow - Forecourt Liquidity & Cash Flow Statement
vouchersRouter.get('/cash-flow', (req: Request, res: Response) => {
  try {
    const cashAccounts = [
      { code: '1010', name: 'Cash in Hand (Forecourt)' },
      { code: '1015', name: 'Indian Oil Current Bank Account' },
      { code: '1020', name: 'UPI / Digital Settlement Clearing' },
      { code: '1030', name: 'POS Card Settlement Clearing' },
    ];

    const balances = cashAccounts.map((acc) => {
      const row = db.prepare(`
        SELECT 
          COALESCE(SUM(l.debit_paise), 0) as total_debits,
          COALESCE(SUM(l.credit_paise), 0) as total_credits
        FROM journal_lines l
        JOIN journal_entries e ON l.journal_entry_id = e.id
        WHERE l.account_code = ? AND e.is_reversed = 0
      `).get(acc.code) as any;

      const currentBalance = (row?.total_debits || 0) - (row?.total_credits || 0);
      return {
        ...acc,
        balance_paise: currentBalance,
        total_inflow_paise: row?.total_debits || 0,
        total_outflow_paise: row?.total_credits || 0,
      };
    });

    const totalLiquidityPaise = balances.reduce((acc, b) => acc + b.balance_paise, 0);

    res.json({
      accounts: balances,
      total_liquidity_paise: totalLiquidityPaise,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
