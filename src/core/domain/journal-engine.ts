import { JournalEntry, JournalLine } from '../types/domain.js';
import { v4 as uuidv4 } from 'uuid';

export interface ShiftCloseJournalInput {
  outlet_id: string;
  shift_id: string;
  voucher_date: string;
  shift_number: number;
  total_sales_paise: number;
  cash_actual_paise: number; // Cash deposited + drops
  upi_amount_paise: number;
  card_amount_paise: number;
  fleet_amount_paise: number;
  credit_sales_paise: number;
  expense_from_cash_paise: number;
  variance_paise: number; // actual - expected
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

  /**
   * Creates a balanced double-entry voucher for an approved shift close.
   */
  static createShiftCloseJournal(input: ShiftCloseJournalInput): {
    entry: JournalEntry;
    lines: JournalLine[];
  } {
    const entryId = uuidv4();
    const lines: JournalLine[] = [];

    // 1. Debit Cash in Hand
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

    // 2. Debit UPI Clearing
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

    // 3. Debit Card Clearing
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

    // 4. Debit Fleet Card Clearing
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

    // 5. Debit Customer Khata (Trade Receivables)
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

    // 6. Debit Forecourt Expenses paid from cash
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

    // 7. Handle Cash Shortage or Overage
    if (input.variance_paise < 0) {
      // Shortage is an operational expense / loss
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '5090',
        account_name: 'Cash Shortage Expense',
        debit_paise: Math.abs(input.variance_paise),
        credit_paise: 0,
      });
    } else if (input.variance_paise > 0) {
      // Overage is other operational income
      lines.push({
        id: uuidv4(),
        journal_entry_id: entryId,
        account_code: '4090',
        account_name: 'Cash Overage Income',
        debit_paise: 0,
        credit_paise: input.variance_paise,
      });
    }

    // 8. Credit Fuel Sales Revenue
    lines.push({
      id: uuidv4(),
      journal_entry_id: entryId,
      account_code: '4010',
      account_name: 'Fuel Sales Revenue',
      debit_paise: 0,
      credit_paise: input.total_sales_paise,
    });

    // Validate double-entry invariant
    this.validateBalance(lines);

    const total_debits = lines.reduce((acc, l) => acc + l.debit_paise, 0);

    const entry: JournalEntry = {
      id: entryId,
      outlet_id: input.outlet_id,
      voucher_number: `JV-SH-${input.voucher_date.replace(/-/g, '')}-S${input.shift_number}`,
      voucher_date: input.voucher_date,
      reference_type: 'SHIFT_CLOSE',
      reference_id: input.shift_id,
      narration: `Shift #${input.shift_number} close revenue and tender posting for ${input.voucher_date}`,
      total_debit_paise: total_debits,
      total_credit_paise: total_debits,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines };
  }

  /**
   * Creates a balanced double-entry voucher for an approved fuel delivery.
   */
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
      voucher_number: `JV-DEL-${input.invoice_number}`,
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

  /**
   * Creates a balanced double-entry voucher for a Khata receipt payment from customer.
   */
  static createReceiptJournal(input: ReceiptJournalInput): {
    entry: JournalEntry;
    lines: JournalLine[];
  } {
    const entryId = uuidv4();
    const debitAccount =
      input.payment_mode === 'CASH'
        ? { code: '1010', name: 'Cash in Hand (Forecourt)' }
        : { code: '1015', name: 'Bank Current Account' };

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
      voucher_number: `CR-${Date.now().toString().slice(-6)}`,
      voucher_date: input.voucher_date,
      reference_type: 'CREDIT_RECEIPT',
      reference_id: input.receipt_id,
      narration: `Collection received from customer ${input.party_name} via ${input.payment_mode}`,
      total_debit_paise: input.amount_paise,
      total_credit_paise: input.amount_paise,
      is_reversed: false,
      created_at: new Date().toISOString(),
    };

    return { entry, lines };
  }

  /**
   * Creates a reversal voucher for an existing journal entry.
   */
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
      debit_paise: l.credit_paise, // swap debit and credit
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
