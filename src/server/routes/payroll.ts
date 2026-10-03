import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { JournalEngine } from '../../core/domain/journal-engine.js';
import { v4 as uuidv4 } from 'uuid';

export const payrollRouter = Router();

// GET /api/v1/payroll/staff - List all staff users
payrollRouter.get('/staff', (req: Request, res: Response) => {
  try {
    const staff = db.prepare(`
      SELECT id, name, phone, role, active, created_at
      FROM users
      ORDER BY role ASC, name ASC
    `).all();
    res.json({ staff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/payroll/attendance - Query staff attendance
payrollRouter.get('/attendance', (req: Request, res: Response) => {
  try {
    const { date, user_id, month } = req.query;

    let query = `
      SELECT a.*, u.name as staff_name, u.role as staff_role
      FROM staff_attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    if (user_id) {
      query += ' AND a.user_id = ?';
      params.push(user_id);
    }
    if (month) {
      query += ' AND a.date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY a.date DESC, u.name ASC';

    const records = db.prepare(query).all(...params);
    res.json({ attendance: records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/payroll/attendance - Mark staff attendance
payrollRouter.post('/attendance', (req: Request, res: Response) => {
  const { user_id, date, shift_number, status, notes } = req.body;

  if (!user_id || !date || !status) {
    return res.status(400).json({ error: 'user_id, date, and status are required' });
  }

  try {
    // Check if record already exists for this user, date and shift
    const existing = db.prepare(`
      SELECT id FROM staff_attendance WHERE user_id = ? AND date = ? AND shift_number = ?
    `).get(user_id, date, shift_number || 1) as any;

    if (existing) {
      db.prepare(`
        UPDATE staff_attendance
        SET status = ?, notes = ?
        WHERE id = ?
      `).run(status, notes || null, existing.id);
      return res.json({ success: true, id: existing.id, updated: true });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO staff_attendance (id, user_id, date, shift_number, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, user_id, date, shift_number || 1, status, notes || null);

    res.json({ success: true, id, updated: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/payroll/advances - List all staff advances
payrollRouter.get('/advances', (req: Request, res: Response) => {
  try {
    const advances = db.prepare(`
      SELECT adv.*, u.name as staff_name, u.role as staff_role
      FROM staff_advances adv
      JOIN users u ON adv.user_id = u.id
      ORDER BY adv.date DESC, adv.created_at DESC
    `).all();

    res.json({ advances });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/payroll/advances - Disburse cash advance to staff member
payrollRouter.post('/advances', (req: Request, res: Response) => {
  const { user_id, amount_paise, date, reason, paid_from } = req.body;

  if (!user_id || !amount_paise || amount_paise <= 0 || !reason) {
    return res.status(400).json({ error: 'user_id, amount_paise, and reason are required' });
  }

  const tx = db.transaction(() => {
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(user_id) as any;
    if (!user) {
      throw new Error('Staff member not found');
    }

    const advanceDate = date || new Date().toISOString().split('T')[0];

    // Generate balanced double-entry payment voucher
    const { entry, lines } = JournalEngine.createPaymentVoucher({
      outlet_id: 'out_skp_gadhiya',
      voucher_date: advanceDate,
      vendor_name: `${user.name} (Staff)`,
      expense_category: 'Staff Advance',
      amount_paise: Number(amount_paise),
      paid_from: paid_from || 'CASH',
      narration: `Staff salary advance disbursed to ${user.name}: ${reason}`,
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

    const advanceId = uuidv4();
    db.prepare(`
      INSERT INTO staff_advances (id, user_id, amount_paise, date, reason, status, recovered_amount_paise, voucher_id)
      VALUES (?, ?, ?, ?, ?, 'DISBURSED', 0, ?)
    `).run(advanceId, user_id, Number(amount_paise), advanceDate, reason, entry.id);

    return { advanceId, voucherNumber: entry.voucher_number };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/payroll/monthly - Monthly payroll sheet
payrollRouter.get('/monthly', (req: Request, res: Response) => {
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

  try {
    // Default base salaries by role for SK Petroleum
    const roleSalariesPaise: Record<string, number> = {
      owner: 0,
      manager: 3500000,    // ₹35,000/mo
      accountant: 2500000, // ₹25,000/mo
      attendant: 1800000,  // ₹18,000/mo
    };

    const staffList = db.prepare(`
      SELECT id, name, role FROM users WHERE active = 1 AND role != 'owner' ORDER BY role ASC, name ASC
    `).all() as any[];

    const payrollSheet = staffList.map((user) => {
      // Days present in the month
      const attendanceStats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present_days,
          COUNT(CASE WHEN status = 'HALF_DAY' THEN 1 END) as half_days,
          COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent_days
        FROM staff_attendance
        WHERE user_id = ? AND date LIKE ?
      `).get(user.id, `${month}%`) as any;

      // Unrecovered advances
      const advanceRow = db.prepare(`
        SELECT COALESCE(SUM(amount_paise - recovered_amount_paise), 0) as pending_advance_paise
        FROM staff_advances
        WHERE user_id = ? AND status != 'RECOVERED'
      `).get(user.id) as any;

      const baseSalary = roleSalariesPaise[user.role] || 1500000;
      const pendingAdvance = advanceRow?.pending_advance_paise || 0;
      const advanceDeduction = Math.min(pendingAdvance, Math.round(baseSalary * 0.4)); // Cap advance deduction at 40% of salary
      const netPayable = Math.max(0, baseSalary - advanceDeduction);

      return {
        user_id: user.id,
        name: user.name,
        role: user.role,
        month,
        base_salary_paise: baseSalary,
        present_days: attendanceStats?.present_days || 0,
        half_days: attendanceStats?.half_days || 0,
        absent_days: attendanceStats?.absent_days || 0,
        pending_advance_paise: pendingAdvance,
        advance_deducted_paise: advanceDeduction,
        net_payable_paise: netPayable,
        status: 'READY_FOR_PAYMENT',
      };
    });

    res.json({ month, payroll: payrollSheet });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
