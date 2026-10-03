import { StockMovement, MovementType } from '../types/domain.js';
import { v4 as uuidv4 } from 'uuid';

export interface StockMovementInput {
  outlet_id: string;
  tank_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity_litres: number; // positive for receipt, negative for sales
  current_balance_litres: number;
  reference_type: 'SHIFT' | 'DELIVERY' | 'ADJUSTMENT';
  reference_id: string;
  notes?: string;
}

export class StockLedgerEngine {
  /**
   * Calculates new running balance and creates append-only stock movement record.
   */
  static recordMovement(input: StockMovementInput): {
    movement: StockMovement;
    new_balance_litres: number;
  } {
    const new_balance_litres =
      Math.round((input.current_balance_litres + input.quantity_litres) * 100) / 100;

    const movement: StockMovement = {
      id: uuidv4(),
      outlet_id: input.outlet_id,
      tank_id: input.tank_id,
      product_id: input.product_id,
      movement_type: input.movement_type,
      quantity_litres: input.quantity_litres,
      balance_litres: new_balance_litres,
      reference_type: input.reference_type,
      reference_id: input.reference_id,
      created_at: new Date().toISOString(),
      notes: input.notes,
    };

    return { movement, new_balance_litres };
  }

  /**
   * Compares measured physical dip volume with current book stock.
   */
  static calculateVariance(physical_dip_litres: number, book_stock_litres: number) {
    const variance_litres = Math.round((physical_dip_litres - book_stock_litres) * 100) / 100;
    const variance_percentage =
      book_stock_litres > 0
        ? Math.round((variance_litres / book_stock_litres) * 10000) / 100
        : 0;

    return {
      physical_dip_litres,
      book_stock_litres,
      variance_litres,
      variance_percentage,
      is_shortage: variance_litres < 0,
      is_excess: variance_litres > 0,
      exceeds_threshold: Math.abs(variance_percentage) > 1.0, // > 1% discrepancy
    };
  }
}
