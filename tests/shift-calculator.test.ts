import { describe, it, expect } from 'vitest';
import { ShiftCalculator } from '../src/core/domain/shift-calculator.js';

describe('ShiftCalculator', () => {
  it('calculates standard nozzle sale correctly', () => {
    const result = ShiftCalculator.calculateNozzle({
      nozzle_id: 'n1',
      opening_reading: 125430.5,
      closing_reading: 126120.25,
      testing_litres: 10,
      is_rollover: false,
      meter_max: 9999999.99,
      price_paise: 10450, // ₹104.50/L
    });

    expect(result.gross_litres_sold).toBe(689.75);
    expect(result.net_litres_sold).toBe(679.75);
    // 679.75 * 10450 = 7103387.5 => rounded to 7103388 paise (₹71,033.88)
    expect(result.total_amount_paise).toBe(7103388);
  });

  it('handles meter rollover correctly', () => {
    // Opening close to max (e.g. 999800.00), closing after loop (e.g. 450.00)
    const result = ShiftCalculator.calculateNozzle({
      nozzle_id: 'n2',
      opening_reading: 999800.0,
      closing_reading: 450.0,
      testing_litres: 0,
      is_rollover: true,
      meter_max: 1000000.0,
      rollover_offset: 0.0,
      price_paise: 9280, // ₹92.80/L
    });

    // (1000000 - 999800) + 450 = 200 + 450 = 650 litres
    expect(result.gross_litres_sold).toBe(650.0);
    expect(result.net_litres_sold).toBe(650.0);
    // 650 * 9280 = 6032000 paise (₹60,320.00)
    expect(result.total_amount_paise).toBe(6032000);
  });

  it('rejects closing < opening if rollover is not flagged', () => {
    expect(() => {
      ShiftCalculator.calculateNozzle({
        nozzle_id: 'n3',
        opening_reading: 5000,
        closing_reading: 4000,
        testing_litres: 0,
        is_rollover: false,
        meter_max: 9999999.99,
        price_paise: 10000,
      });
    }).toThrow('Closing reading (4000) is less than opening reading (5000)');
  });

  it('aggregates shift totals across multiple nozzles', () => {
    const n1 = ShiftCalculator.calculateNozzle({
      nozzle_id: 'n1',
      opening_reading: 1000,
      closing_reading: 1500,
      testing_litres: 5,
      is_rollover: false,
      meter_max: 9999999.99,
      price_paise: 10000, // ₹100.00 -> 495 L * 10000 = 4950000
    });

    const n2 = ShiftCalculator.calculateNozzle({
      nozzle_id: 'n2',
      opening_reading: 2000,
      closing_reading: 2300,
      testing_litres: 0,
      is_rollover: false,
      meter_max: 9999999.99,
      price_paise: 9000, // ₹90.00 -> 300 L * 9000 = 2700000
    });

    const totals = ShiftCalculator.calculateShiftTotals([n1, n2]);
    expect(totals.total_gross_litres).toBe(800);
    expect(totals.total_testing_litres).toBe(5);
    expect(totals.total_net_litres).toBe(795);
    expect(totals.total_sales_paise).toBe(7650000); // ₹76,500.00
  });
});
