import { describe, it, expect } from 'vitest';
import { ReconciliationEngine } from '../src/core/domain/reconciliation.js';

describe('ReconciliationEngine', () => {
  it('sums cash denominations accurately to the paise', () => {
    const paise = ReconciliationEngine.sumDenominations({
      count_2000: 1, // ₹2000
      count_500: 10, // ₹5000
      count_200: 5, // ₹1000
      count_100: 20, // ₹2000
      count_50: 10, // ₹500
      count_20: 10, // ₹200
      count_10: 10, // ₹100
      count_5: 0,
      coins: 45, // ₹45
    });

    // Total Rupees = 2000 + 5000 + 1000 + 2000 + 500 + 200 + 100 + 45 = ₹10,845
    // In paise = 1084500
    expect(paise).toBe(1084500);
  });

  it('calculates cash variance and flags threshold escalation', () => {
    // Total meter sales = ₹50,000 (5,000,000 paise)
    // Digital: UPI ₹25,000 + Card ₹10,000 = ₹35,000
    // Credit: ₹5,000
    // Expenses: ₹1,000
    // Expected Cash = 50,000 - 35,000 - 5,000 - 1,000 = ₹9,000 (900,000 paise)
    // Counted Cash: ₹8,750 (875,000 paise) + ₹0 drop
    // Variance = 8,750 - 9,000 = -₹250 (-25,000 paise)
    // Threshold is ₹200 (20,000 paise) => Should flag exceeds_threshold!
    const result = ReconciliationEngine.reconcile({
      total_meter_sales_paise: 5000000,
      upi_amount_paise: 2500000,
      card_amount_paise: 1000000,
      fleet_amount_paise: 0,
      credit_sales_amount_paise: 500000,
      coupon_amount_paise: 0,
      expense_from_cash_paise: 100000,
      cash_drop_paise: 0,
      denominations: {
        count_2000: 0,
        count_500: 17, // 8500
        count_200: 1, // 200
        count_100: 0,
        count_50: 1, // 50
        count_20: 0,
        count_10: 0,
        count_5: 0,
        coins: 0, // total 8750
      },
      variance_threshold_paise: 20000, // ₹200
    });

    expect(result.counted_cash_paise).toBe(875000);
    expect(result.expected_cash_paise).toBe(900000);
    expect(result.actual_cash_paise).toBe(875000);
    expect(result.variance_paise).toBe(-25000);
    expect(result.is_shortage).toBe(true);
    expect(result.exceeds_threshold).toBe(true);
  });
});
