import { JournalEntry, JournalLine } from '../types/domain.js';
import { v4 as uuidv4 } from 'uuid';

export interface ShiftCloseJournalInput {
  outlet_id: string;
  shift_id: string;
  voucher_date: string;
  shift_number: number;
  total_sales_paise: number;
  cash_actual_paise: number;
  upi_amount_paise: number;
  card_amount_paise: number;
  fleet_amount_paise: number;
  credit_sales_paise: number;
  expense_from_cash_paise: number;
  variance_paise: number;
}

export interface DeliveryJournalInput {
  outlet_id: string;
  delivery_id: string;
  voucher_date: string;
  invoice_number: string;
  supplier_name: string;
  total_cost_paise: number;
}

export interface ReceiptJournalInput {
  outlet_id: string;
  receipt_id: string;
  party_name: string;
  voucher_date: string;
  amount_paise: number;
  payment_mode: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI';
}

export interface ExpensePaymentInput {
  outlet_id: string;
  voucher_date: string;
  expense_category: string; // e.g. 'Electricity', 'Forecourt Maintenance', 'Generator Diesel', 'Staff Tea & Allowance', 'Staff Advance'
  vendor_name: string;
  amount_paise: number;
  paid_from: 'CASH' | 'BANK';
  reference_no?: string;
  narration: string;
}

export interface BankingContraInput {
  outlet_id: string;
  voucher_date: string;
  transaction_type: 'CASH_DEPOSIT' | 'BANK_WITHDRAWAL' | 'UPI_CLEARING_SETTLEMENT' | 'CARD_CLEARING_SETTLEMENT';
  amount_paise: number;
  bank_name: string;
  reference_no?: string;
  narration: string;
}

export interface AdjustmentJournalInput {
  outlet_id: string;
  voucher_date: string;
  debit_account_code: string;
  debit_account_name: string;
  credit_account_code: string;
  credit_account_name: string;
  amount_paise: number;
  reason: string;
}

export class JournalEngine {
  /**
   * Validates that journal lines are strictly balanced: Total Debits == Total Credits.
   */
  static validateBalance(lines: JournalLine[]): void {
    let total_debits = 0;
    let total_credits = 0;

    for (const line of lines) {
      if (line.debit_paise < 0 || line.credit_paise < 0) {
        throw new Error(`Debit/Credit cannot be negative on account ${line.account_code}`);
      }
      total_debits += line.debit_paise;
      total_credits += line.credit_paise;
    }

    if (total_debits !== total_credits) {
      throw new Error(
        `Journal entry is out of balance! Total Debits: ${total_debits} paise, Total Credits: ${total_credits} paise (Diff: ${
          total_debits - total_credits
        } paise)`
      );
    }
  }

  // 1. VOUCHER 1: SALES ENTRY VOUCHER (for Shift Close & Counter Sales)
  static createShiftCloseJournal(input: ShiftCloseJournalInput): {
    entry: JournalEntry;
    lines: JournalLine[];
  } {
    const entryId = uuidv4();
    const lines: JournalLine[] = [];

    if (input.cash_actual_paise > 0) {
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1010',
        account_name: 'Cash in Hand (Forecourt)',
        debit_paise: input.cash_actual_paise,
        credit_paise: 0,
      });
    }

    if (input.upi_amount_paise > 0) {
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1020',
        account_name: 'UPI / Digital Settlement Clearing',
        debit_paise: input.upi_amount_paise,
        credit_paise: 0,
      });
    }

    if (input.card_amount_paise > 0) {
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1030',
        account_name: 'POS Card Settlement Clearing',
        debit_paise: input.card_amount_paise,
        credit_paise: 0,
      });
    }

    if (input.fleet_amount_paise > 0) {
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1040',
        account_name: 'Fleet / Fuel Card Clearing',
        debit_paise: input.fleet_amount_paise,
        credit_paise: 0,
      });
    }

    if (input.credit_sales_paise > 0) {
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1200',
        account_name: 'Customer Trade Receivables (Khata)',
        debit_paise: input.credit_sales_paise,
        credit_paise: 0,
      });
    }

    if (input.expense_from_cash_paise > 0) {
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '5010',
        account_name: 'Station Operating Expenses',
        debit_paise: input.expense_from_cash_paise,
        credit_paise: 0,
      });
    }

    if (input.variance_paise < 0) {
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '5090',
        account_name: 'Cash Shortage Expense',
        debit_paise: Math.abs(input.variance_paise),
        credit_paise: 0,
      });
    } else if (input.variance_paise > 0) {
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '4090',
        account_name: 'Cash Overage Income',
        debit_paise: 0,
        credit_paise: input.variance_paise,
      });
    }

    lines.push({
      id: uuidv4(),
      journal_entry_id: entryId,
      account_code: '4010',
      account_name: 'Fuel Sales Revenue',
      debit_paise: 0,
      credit_paise: input.total_sales_paise,
    });

    this.validateBalance(lines);
    const total_debits = lines.reduce((acc, l) => acc + l.debit_paise, 0);

    const entry: JournalEntry = {
      id: entryId,
      outlet_id: input.outlet_id,
      voucher_number: `JV-SALES-${input.voucher_date.replace(/-/g, '')}-S${input.shift_number}`,
      voucher_date: input.voucher_date,
      reference_type: 'SHIFT_CLOSE',
      reference_id: input.shift_id,
      narration: `Shift #${input.shift_number} sales and tender settlement for ${input.voucher_date}`,
      total_debit_paise: total_debits,
      total_credit_paise: total_debits,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines };
  }

  // 2. VOUCHER 2: FUEL & LUBE PURCHASE VOUCHER
  static createDeliveryJournal(input: DeliveryJournalInput): {
    entry: JournalEntry;
    lines: JournalLine[];
  } {
    const entryId = uuidv4();
    const lines: JournalLine[] = [
      {
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1300',
        account_name: 'Fuel Inventory (Tanks)',
        debit_paise: input.total_cost_paise,
        credit_paise: 0,
      },
      {
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '2010',
        account_name: `OMC Supplier Payable (${input.supplier_name})`,
        debit_paise: 0,
        credit_paise: input.total_cost_paise,
      },
    ];

    this.validateBalance(lines);

    const entry: JournalEntry = {
      id: entryId,
      outlet_id: input.outlet_id,
      voucher_number: `JV-PURCHASE-${input.invoice_number}`,
      voucher_date: input.voucher_date,
      reference_type: 'DELIVERY',
      reference_id: input.delivery_id,
      narration: `Fuel receipt invoice ${input.invoice_number} from ${input.supplier_name}`,
      total_debit_paise: input.total_cost_paise,
      total_credit_paise: input.total_cost_paise,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines };
  }

  // 3. VOUCHER 3: CUSTOMER RECEIPTS VOUCHER (Khata Collections)
  static createReceiptJournal(input: ReceiptJournalInput): {
    entry: JournalEntry;
    lines: JournalLine[];
  } {
    const entryId = uuidv4();
    const debitAccount =
      input.payment_mode === 'CASH'
        ? { code: '1010', name: 'Cash in Hand (Forecourt)' }
        : { code: '1015', name: 'Indian Oil Current Bank Account' };

    const lines: JournalLine[] = [
      {
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: debitAccount.code,
        account_name: debitAccount.name,
        debit_paise: input.amount_paise,
        credit_paise: 0,
      },
      {
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1200',
        account_name: 'Customer Trade Receivables (Khata)',
        debit_paise: 0,
        credit_paise: input.amount_paise,
      },
    ];

    this.validateBalance(lines);

    const entry: JournalEntry = {
      id: entryId,
      outlet_id: input.outlet_id,
      voucher_number: `CR-RECEIPT-${Date.now().toString().slice(-6)}`,
      voucher_date: input.voucher_date,
      reference_type: 'CREDIT_RECEIPT',
      reference_id: input.receipt_id,
      narration: `Payment received from customer ${input.party_name} via ${input.payment_mode}`,
      total_debit_paise: input.amount_paise,
      total_credit_paise: input.amount_paise,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines };
  }

  // 4. VOUCHER 4: EXPENSES & PAYMENTS VOUCHER
  static createPaymentVoucher(input: ExpensePaymentInput): {
    entry: JournalEntry;
    lines: JournalLine[];
  } {
    const entryId = uuidv4();
    const creditAccount =
      input.paid_from === 'CASH'
        ? { code: '1010', name: 'Cash in Hand (Forecourt)' }
        : { code: '1015', name: 'Indian Oil Current Bank Account' };

    const debitAccountCode =
      input.expense_category === 'Staff Advance'
        ? '1250'
        : input.expense_category === 'Electricity'
        ? '5020'
        : '5010';

    const debitAccountName =
      input.expense_category === 'Staff Advance'
        ? 'Staff Salary Advances (Recoverable)'
        : `Station Expense (${input.expense_category})`;

    const lines: JournalLine[] = [
      {
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: debitAccountCode,
        account_name: debitAccountName,
        debit_paise: input.amount_paise,
        credit_paise: 0,
      },
      {
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: creditAccount.code,
        account_name: creditAccount.name,
        debit_paise: 0,
        credit_paise: input.amount_paise,
      },
    ];

    this.validateBalance(lines);

    const entry: JournalEntry = {
      id: entryId,
      outlet_id: input.outlet_id,
      voucher_number: `PV-PAYMENT-${Date.now().toString().slice(-6)}`,
      voucher_date: input.voucher_date,
      reference_type: 'EXPENSE',
      reference_id: entryId,
      narration: `${input.narration} (Paid to ${input.vendor_name} via ${input.paid_from})`,
      total_debit_paise: input.amount_paise,
      total_credit_paise: input.amount_paise,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines };
  }

  // 5. VOUCHER 5: BANKING & CONTRA VOUCHER
  static createContraBankingVoucher(input: BankingContraInput): {
    entry: JournalEntry;
    lines: JournalLine[];
  } {
    const entryId = uuidv4();
    const lines: JournalLine[] = [];

    if (input.transaction_type === 'CASH_DEPOSIT') {
      // Forecourt Cash deposited into Bank Account
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1015',
        account_name: `Current Bank Account (${input.bank_name})`,
        debit_paise: input.amount_paise,
        credit_paise: 0,
      });
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1010',
        account_name: 'Cash in Hand (Forecourt)',
        debit_paise: 0,
        credit_paise: input.amount_paise,
      });
    } else if (input.transaction_type === 'UPI_CLEARING_SETTLEMENT') {
      // UPI QR clearing credited to Current Account
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1015',
        account_name: `Current Bank Account (${input.bank_name})`,
        debit_paise: input.amount_paise,
        credit_paise: 0,
      });
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1020',
        account_name: 'UPI / Digital Settlement Clearing',
        debit_paise: 0,
        credit_paise: input.amount_paise,
      });
    } else if (input.transaction_type === 'CARD_SETTLEMENT') {
      // POS Card batch settlement credited to Current Account
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1015',
        account_name: `Current Bank Account (${input.bank_name})`,
        debit_paise: input.amount_paise,
        credit_paise: 0,
      });
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1030',
        account_name: 'POS Card Settlement Clearing',
        debit_paise: 0,
        credit_paise: input.amount_paise,
      });
    } else {
      // Bank withdrawal to Forecourt Cash
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1010',
        account_name: 'Cash in Hand (Forecourt)',
        debit_paise: input.amount_paise,
        credit_paise: 0,
      });
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '1015',
        account_name: `Current Bank Account (${input.bank_name})`,
        debit_paise: 0,
        credit_paise: input.amount_paise,
      });
    }

    this.validateBalance(lines);

    const entry: JournalEntry = {
      id: entryId,
      outlet_id: input.outlet_id,
      voucher_number: `CV-BANKING-${Date.now().toString().slice(-6)}`,
      voucher_date: input.voucher_date,
      reference_type: 'CONTRA_BANKING' as any,
      reference_id: entryId,
      narration: input.narration || `${input.transaction_type.replace(/_/g, ' ')} of ₹${(input.amount_paise / 100).toLocaleString()}`,
      total_debit_paise: input.amount_paise,
      total_credit_paise: input.amount_paise,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines };
  }

  // 6. VOUCHER 6: DEBIT / CREDIT ADJUSTMENT VOUCHER
  static createAdjustmentVoucher(input: AdjustmentJournalInput): {
    entry: JournalEntry;
    lines: JournalLine[];
  } {
    const entryId = uuidv4();
    const lines: JournalLine[] = [
      {
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: input.debit_account_code,
        account_name: input.debit_account_name,
        debit_paise: input.amount_paise,
        credit_paise: 0,
      },
      {
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: input.credit_account_code,
        account_name: input.credit_account_name,
        debit_paise: 0,
        credit_paise: input.amount_paise,
      },
    ];

    this.validateBalance(lines);

    const entry: JournalEntry = {
      id: entryId,
      outlet_id: input.outlet_id,
      voucher_number: `JV-ADJUSTMENT-${Date.now().toString().slice(-6)}`,
      voucher_date: input.voucher_date,
      reference_type: 'ADJUSTMENT' as any,
      reference_id: entryId,
      narration: `Adjustment: ${input.reason}`,
      total_debit_paise: input.amount_paise,
      total_credit_paise: input.amount_paise,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines };
  }

  // Reversal Voucher
  static createReversalJournal(
    originalEntry: JournalEntry,
    originalLines: JournalLine[],
    reason: string
  ): { entry: JournalEntry; lines: JournalLine[] } {
    const reversalEntryId = uuidv4();
    const reversalLines: JournalLine[] = originalLines.map((l) => ({
      id: uuidv4(),
      journal_entry_id: reversalEntryId,
      account_code: l.account_code,
      account_name: l.account_name,
      debit_paise: l.credit_paise,
      credit_paise: l.debit_paise,
    }));

    this.validateBalance(reversalLines);

    const entry: JournalEntry = {
      id: reversalEntryId,
      outlet_id: originalEntry.outlet_id,
      voucher_number: `REV-${originalEntry.voucher_number}`,
      voucher_date: new Date().toISOString().split('T')[0],
      reference_type: 'REVERSAL',
      reference_id: originalEntry.id,
      narration: `Reversal of ${originalEntry.voucher_number}. Reason: ${reason}`,
      total_debit_paise: originalEntry.total_debit_paise,
      total_credit_paise: originalEntry.total_credit_paise,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines: reversalLines };
  }
}
