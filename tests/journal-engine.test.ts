import { describe, it, expect } from 'vitest';
import { JournalEngine } from '../src/core/domain/journal-engine.js';

describe('JournalEngine', () => {
  it('creates balanced shift close voucher with cash shortage', () => {
    // Total sales = ₹100,000 (10,000,000 paise)
    // UPI: ₹30,000, Card: ₹20,000, Fleet: ₹10,000, Credit: ₹15,000, Expense: ₹2,000
    // Expected cash: 100,000 - 30,000 - 20,000 - 10,000 - 15,000 - 2,000 = ₹23,000
    // Actual cash: ₹22,800 => Shortage of ₹200 (20,000 paise)
    const { entry, lines } = JournalEngine.createShiftCloseJournal({
      outlet_id: 'out1',
      shift_id: 'sh1',
      voucher_date: '2026-10-03',
      shift_number: 1,
      total_sales_paise: 10000000,
      cash_actual_paise: 2280000,
      upi_amount_paise: 3000000,
      card_amount_paise: 2000000,
      fleet_amount_paise: 1000000,
      credit_sales_paise: 1500000,
      expense_from_cash_paise: 200000,
      variance_paise: -20000, // ₹200 shortage
    });

    const debits = lines.reduce((acc, l) => acc + l.debit_paise, 0);
    const credits = lines.reduce((acc, l) => acc + l.credit_paise, 0);

    expect(debits).toBe(credits);
    expect(debits).toBe(10000000);
    expect(entry.total_debit_paise).toBe(10000000);
    expect(entry.total_credit_paise).toBe(10000000);

    // Verify cash shortage line is present on debit side
    const shortageLine = lines.find((l) => l.account_code === '5090');
    expect(shortageLine).toBeDefined();
    expect(shortageLine?.debit_paise).toBe(20000);
  });

  it('creates balanced delivery voucher', () => {
    const { entry, lines } = JournalEngine.createDeliveryJournal({
      outlet_id: 'out1',
      delivery_id: 'del1',
      voucher_date: '2026-10-03',
      invoice_number: 'INV-HPCL-9874',
      supplier_name: 'Hindustan Petroleum Corp Ltd',
      total_cost_paise: 115000000, // ₹11,50,000
    });

    const debits = lines.reduce((acc, l) => acc + l.debit_paise, 0);
    const credits = lines.reduce((acc, l) => acc + l.credit_paise, 0);

    expect(debits).toBe(credits);
    expect(debits).toBe(115000000);
    expect(entry.voucher_number).toBe('JV-PURCHASE-INV-HPCL-9874');
  });

  it('creates balanced expense & payment voucher (Voucher 4)', () => {
    const { entry, lines } = JournalEngine.createPaymentVoucher({
      outlet_id: 'out1',
      voucher_date: '2026-10-03',
      vendor_name: 'Gujarat Electricity Board (GETCO)',
      expense_category: 'Electricity',
      amount_paise: 2450000, // ₹24,500
      paid_from: 'BANK',
      narration: 'Monthly forecourt HT power tariff payment',
    });

    const debits = lines.reduce((acc, l) => acc + l.debit_paise, 0);
    const credits = lines.reduce((acc, l) => acc + l.credit_paise, 0);

    expect(debits).toBe(credits);
    expect(debits).toBe(2450000);
    expect(entry.voucher_number).toContain('PV-PAYMENT-');
  });

  it('creates balanced banking contra voucher (Voucher 5)', () => {
    const { entry, lines } = JournalEngine.createContraBankingVoucher({
      outlet_id: 'out1',
      voucher_date: '2026-10-03',
      transaction_type: 'CASH_DEPOSIT',
      bank_name: 'SBI IOCL Current Account',
      amount_paise: 50000000, // ₹5,00,000 cash deposit
      reference_no: 'SBI-CHQ-10492',
      narration: 'Cash deposit into current account',
    });

    const debits = lines.reduce((acc, l) => acc + l.debit_paise, 0);
    const credits = lines.reduce((acc, l) => acc + l.credit_paise, 0);

    expect(debits).toBe(credits);
    expect(debits).toBe(50000000);
    expect(entry.voucher_number).toContain('CV-BANKING-');
  });

  it('creates balanced debit/credit adjustment voucher (Voucher 6)', () => {
    const { entry, lines } = JournalEngine.createAdjustmentVoucher({
      outlet_id: 'out1',
      voucher_date: '2026-10-03',
      debit_account_code: '5010',
      debit_account_name: 'Station Operating Expenses',
      credit_account_code: '1010',
      credit_account_name: 'Cash in Hand (Forecourt)',
      amount_paise: 150000, // ₹1,500
      reason: 'Nozzle calibration verification audit sample',
    });

    const debits = lines.reduce((acc, l) => acc + l.debit_paise, 0);
    const credits = lines.reduce((acc, l) => acc + l.credit_paise, 0);

    expect(debits).toBe(credits);
    expect(debits).toBe(150000);
    expect(entry.voucher_number).toContain('JV-ADJUSTMENT-');
  });

  it('creates balanced customer receipt voucher', () => {
    const { entry, lines } = JournalEngine.createReceiptJournal({
      outlet_id: 'out1',
      receipt_id: 'rc1',
      party_name: 'National Transport Corp',
      voucher_date: '2026-10-03',
      amount_paise: 5000000, // ₹50,000
      payment_mode: 'BANK_TRANSFER',
    });

    const debits = lines.reduce((acc, l) => acc + l.debit_paise, 0);
    const credits = lines.reduce((acc, l) => acc + l.credit_paise, 0);

    expect(debits).toBe(credits);
    expect(debits).toBe(5000000);
  });

  it('reverses an entry with inverted debits and credits', () => {
    const original = JournalEngine.createReceiptJournal({
      outlet_id: 'out1',
      receipt_id: 'rc1',
      party_name: 'National Transport Corp',
      voucher_date: '2026-10-03',
      amount_paise: 5000000,
      payment_mode: 'CASH',
    });

    const reversal = JournalEngine.createReversalJournal(
      original.entry,
      original.lines,
      'Duplicate voucher posted accidentally'
    );

    const revDebits = reversal.lines.reduce((acc, l) => acc + l.debit_paise, 0);
    const revCredits = reversal.lines.reduce((acc, l) => acc + l.credit_paise, 0);

    expect(revDebits).toBe(revCredits);
    expect(revDebits).toBe(5000000);
    expect(reversal.entry.voucher_number).toContain('REV-');
  });
});
