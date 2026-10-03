export interface NozzleCalculationInput {
  nozzle_id: string;
  opening_reading: number;
  closing_reading: number;
  testing_litres: number; // Pump calibration test returned to tank
  is_rollover: boolean;
  meter_max: number; // e.g. 9999999.99 or 999999.99
  rollover_offset?: number;
  price_paise: number; // Integer paise per litre (e.g. 10450 for ₹104.50)
}

export interface NozzleCalculationResult {
  nozzle_id: string;
  opening_reading: number;
  closing_reading: number;
  testing_litres: number;
  is_rollover: boolean;
  meter_max: number;
  gross_litres_sold: number;
  net_litres_sold: number;
  price_paise: number;
  total_amount_paise: number;
}

export class ShiftCalculator {
  /**
   * Calculate nozzle sales with exact precision and rollover handling.
   */
  static calculateNozzle(input: NozzleCalculationInput): NozzleCalculationResult {
    const {
      nozzle_id,
      opening_reading,
      closing_reading,
      testing_litres = 0,
      is_rollover = false,
      meter_max = 9999999.99,
      rollover_offset = 0.01,
      price_paise,
    } = input;

    if (opening_reading < 0 || closing_reading < 0) {
      throw new Error(`Meter readings cannot be negative on nozzle ${nozzle_id}`);
    }

    if (testing_litres < 0) {
      throw new Error(`Testing litres cannot be negative on nozzle ${nozzle_id}`);
    }

    let gross_litres_sold = 0;

    if (is_rollover) {
      // In a mechanical/digital rollover, the meter hits max and loops back to 0
      // Example: opening 999980.00, max 1000000.00, closing 250.00 -> (1000000 - 999980) + 250 = 270 L
      if (closing_reading > opening_reading) {
        throw new Error(
          `Rollover specified for nozzle ${nozzle_id}, but closing reading (${closing_reading}) is greater than opening (${opening_reading})`
        );
      }
      gross_litres_sold = (meter_max - opening_reading) + closing_reading + rollover_offset;
    } else {
      if (closing_reading < opening_reading) {
        throw new Error(
          `Closing reading (${closing_reading}) is less than opening reading (${opening_reading}) on nozzle ${nozzle_id}. If meter rolled over, flag as rollover.`
        );
      }
      gross_litres_sold = closing_reading - opening_reading;
    }

    // Round litres to 2 decimal places to avoid standard IEEE float drift
    gross_litres_sold = Math.round(gross_litres_sold * 100) / 100;

    const net_litres_sold = Math.round(Math.max(0, gross_litres_sold - testing_litres) * 100) / 100;

    // Monetary calculation in integer paise
    // e.g. 10.50 litres * 10450 paise = 109725 paise (₹1097.25)
    const total_amount_paise = Math.round(net_litres_sold * price_paise);

    return {
      nozzle_id,
      opening_reading,
      closing_reading,
      testing_litres,
      is_rollover,
      meter_max,
      gross_litres_sold,
      net_litres_sold,
      price_paise,
      total_amount_paise,
    };
  }

  /**
   * Aggregate multiple nozzle calculations for the shift total.
   */
  static calculateShiftTotals(nozzles: NozzleCalculationResult[]) {
    let total_gross_litres = 0;
    let total_testing_litres = 0;
    let total_net_litres = 0;
    let total_sales_paise = 0;

    for (const n of nozzles) {
      total_gross_litres += n.gross_litres_sold;
      total_testing_litres += n.testing_litres;
      total_net_litres += n.net_litres_sold;
      total_sales_paise += n.total_amount_paise;
    }

    return {
      total_gross_litres: Math.round(total_gross_litres * 100) / 100,
      total_testing_litres: Math.round(total_testing_litres * 100) / 100,
      total_net_litres: Math.round(total_net_litres * 100) / 100,
      total_sales_paise,
    };
  }
}
