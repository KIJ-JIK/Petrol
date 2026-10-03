import { CashDenominationCount } from '../types/domain.js';

export interface ReconciliationInput {
  total_meter_sales_paise: number;
  upi_amount_paise: number;
  card_amount_paise: number;
  credit_sales_amount_paise: number;
  fleet_amount_paise: number;
  coupon_amount_paise: number;
  expense_from_cash_paise: number;
  cash_drop_paise: number;
  denominations: CashDenominationCount;
  variance_threshold_paise?: number; // default ₹200 (20000 paise)
}

export interface ReconciliationResult {
  counted_cash_paise: number;
  total_digital_paise: number;
  non_cash_tender_paise: number;
  expected_cash_paise: number;
  actual_cash_paise: number; // counted_cash + cash_drop
  variance_paise: number; // actual_cash - expected_cash (negative = shortage, positive = excess)
  is_shortage: boolean;
  is_excess: boolean;
  exceeds_threshold: boolean;
}

export class ReconciliationEngine {
  /**
   * Sums cash denominations in integer paise (1 Rupee = 100 Paise).
   */
  static sumDenominations(d: CashDenominationCount): number {
    const rupees =
      (d.count_2000 || 0) * 2000 +
      (d.count_500 || 0) * 500 +
      (d.count_200 || 0) * 200 +
      (d.count_100 || 0) * 100 +
      (d.count_50 || 0) * 50 +
      (d.count_20 || 0) * 20 +
      (d.count_10 || 0) * 10 +
      (d.count_5 || 0) * 5 +
      (d.coins || 0);

    return rupees * 100; // Return in integer paise
  }

  /**
   * Reconciles shift sales against all tenders, expenses, drops, and physical cash.
   */
  static reconcile(input: ReconciliationInput): ReconciliationResult {
    const counted_cash_paise = this.sumDenominations(input.denominations);
    const total_digital_paise =
      (input.upi_amount_paise || 0) +
      (input.card_amount_paise || 0) +
      (input.fleet_amount_paise || 0);

    const non_cash_tender_paise =
      total_digital_paise +
      (input.credit_sales_amount_paise || 0) +
      (input.coupon_amount_paise || 0);

    // Expected cash remaining to be deposited = Total Sales - Non Cash Tenders - Expenses paid from cash
    const expected_cash_paise =
      input.total_meter_sales_paise -
      non_cash_tender_paise -
      (input.expense_from_cash_paise || 0);

    // Actual cash accounted for = Cash counted at handover + Cash dropped to safe mid-shift
    const actual_cash_paise = counted_cash_paise + (input.cash_drop_paise || 0);

    const variance_paise = actual_cash_paise - expected_cash_paise;
    const threshold = input.variance_threshold_paise ?? 20000; // default ₹200

    return {
      counted_cash_paise,
      total_digital_paise,
      non_cash_tender_paise,
      expected_cash_paise,
      actual_cash_paise,
      variance_paise,
      is_shortage: variance_paise < 0,
      is_excess: variance_paise > 0,
      exceeds_threshold: Math.abs(variance_paise) > threshold,
    };
  }
}
