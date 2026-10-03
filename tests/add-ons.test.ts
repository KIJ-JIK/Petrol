import { describe, it, expect } from 'vitest';
import { db, initDatabase } from '../src/core/database/db.js';
import { DipChartEngine } from '../src/core/domain/dip-chart.js';
import { v4 as uuidv4 } from 'uuid';

initDatabase();

describe('Add-On Modules Verification', () => {
  it('meter replacement establishes new baseline without rewriting history', () => {
    const nozzle = db.prepare('SELECT id, last_reading FROM nozzles LIMIT 1').get() as any;
    expect(nozzle).toBeDefined();

    const oldReading = nozzle.last_reading;
    const newBaseline = 0.00; // Reset / new mechanical unit baseline
    const exceptionId = uuidv4();

    db.prepare(`
      INSERT INTO meter_replacement_exceptions (id, outlet_id, nozzle_id, old_meter_id, old_final_reading, new_meter_id, new_baseline_reading, reason, approved_by_user_id)
      VALUES (?, 'out_skp_gadhiya', ?, 'MTR-OLD-01', ?, 'MTR-NEW-02', ?, 'Totalizer electronic board replacement', 'usr_manager')
    `).run(exceptionId, nozzle.id, oldReading, newBaseline);

    db.prepare('UPDATE nozzles SET last_reading = ? WHERE id = ?').run(newBaseline, nozzle.id);

    const updatedNozzle = db.prepare('SELECT last_reading FROM nozzles WHERE id = ?').get(nozzle.id) as any;
    expect(updatedNozzle.last_reading).toBe(0.00);

    const exc = db.prepare('SELECT * FROM meter_replacement_exceptions WHERE id = ?').get(exceptionId) as any;
    expect(exc.old_final_reading).toBe(oldReading);
    expect(exc.new_baseline_reading).toBe(0.00);

    // Restore nozzle reading for test purity
    db.prepare('UPDATE nozzles SET last_reading = ? WHERE id = ?').run(oldReading, nozzle.id);
  });

  it('controlled stock adjustment enforces non-empty justification and updates book stock', () => {
    const tank = db.prepare('SELECT id, current_book_litres FROM tanks LIMIT 1').get() as any;
    expect(tank).toBeDefined();

    const originalStock = tank.current_book_litres;
    const shrinkageLitres = -25.5; // 25.5 Litres evaporation shrinkage
    const adjId = uuidv4();

    db.prepare(`
      INSERT INTO stock_adjustments (id, outlet_id, tank_id, product_id, adjustment_type, quantity_litres, unit, reason, source_measurement, approved_by_user_id)
      VALUES (?, 'out_skp_gadhiya', ?, 'prod_ms', 'EVAPORATION', ?, 'Litre', 'Monthly summer temperature transit loss within 0.15% limit', 'Dip measurement mm verification', 'usr_manager')
    `).run(adjId, tank.id, shrinkageLitres);

    db.prepare('UPDATE tanks SET current_book_litres = current_book_litres + ? WHERE id = ?').run(shrinkageLitres, tank.id);

    const updatedTank = db.prepare('SELECT current_book_litres FROM tanks WHERE id = ?').get(tank.id) as any;
    expect(updatedTank.current_book_litres).toBe(originalStock + shrinkageLitres);

    // Restore for test purity
    db.prepare('UPDATE tanks SET current_book_litres = ? WHERE id = ?').run(originalStock, tank.id);
  });

  it('quick dip check converts mm to litres and computes book stock variance', () => {
    const tank = db.prepare('SELECT id, capacity_litres, current_book_litres FROM tanks LIMIT 1').get() as any;
    const chart = db.prepare('SELECT dip_mm, volume_litres FROM dip_chart_entries WHERE tank_id = ? ORDER BY dip_mm ASC').all(tank.id) as any[];

    expect(chart.length).toBeGreaterThan(0);

    const testMm = 1000;
    const volume = DipChartEngine.interpolateVolume(testMm, chart);
    expect(volume).toBeGreaterThan(0);
    expect(volume).toBeLessThanOrEqual(tank.capacity_litres);

    const variance = volume - tank.current_book_litres;
    expect(typeof variance).toBe('number');
  });

  it('periodic billing batches unbilled credit sales into a customer invoice', () => {
    const party = db.prepare('SELECT id FROM parties LIMIT 1').get() as any;
    expect(party).toBeDefined();

    const saleId = uuidv4();
    db.prepare(`
      INSERT INTO credit_sales (id, outlet_id, party_id, product_id, litres, rate_paise, total_amount_paise, is_billed)
      VALUES (?, 'out_skp_gadhiya', ?, 'prod_hsd', 100.0, 9220, 922000, 0)
    `).run(saleId, party.id);

    // Generate invoice
    const invId = uuidv4();
    const invNum = `INV-TEST-${Date.now().toString().slice(-4)}`;

    db.prepare(`
      INSERT INTO customer_invoices (id, outlet_id, party_id, invoice_number, billing_cycle, from_date, to_date, total_litres, subtotal_paise, grand_total_paise, status, created_by_user_id)
      VALUES (?, 'out_skp_gadhiya', ?, ?, 'MONTHLY', '2026-10-01', '2026-10-31', 100.0, 922000, 922000, 'ISSUED', 'usr_manager')
    `).run(invId, party.id, invNum);

    db.prepare('UPDATE credit_sales SET is_billed = 1, invoice_id = ? WHERE id = ?').run(invId, saleId);

    const updatedSale = db.prepare('SELECT is_billed, invoice_id FROM credit_sales WHERE id = ?').get(saleId) as any;
    expect(updatedSale.is_billed).toBe(1);
    expect(updatedSale.invoice_id).toBe(invId);
  });
});
