import { db, initDatabase } from '../../core/database/db.js';
import { v4 as uuidv4 } from 'uuid';

export function seed() {
  initDatabase();

  console.log('--- Seeding SK Petroleum (Indian Oil), Gadhiya ---');

  const tables = [
    'sync_queue',
    'audit_events',
    'journal_lines',
    'journal_entries',
    'receipts',
    'credit_sales',
    'parties',
    'deliveries',
    'stock_movements',
    'shift_tenders',
    'meter_readings',
    'shifts',
    'nozzles',
    'dispensers',
    'dip_chart_entries',
    'tanks',
    'price_versions',
    'products',
    'users',
    'outlets',
    'tenants',
  ];

  for (const table of tables) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
    } catch {
      // Table might not exist yet
    }
  }

  // 1. Tenant & Sole Outlet: SK Petroleum (Indian Oil), Gadhiya
  const tenantId = 'ten_sk_petroleum';
  db.prepare(`
    INSERT INTO tenants (id, name, code)
    VALUES (?, ?, ?)
  `).run(tenantId, 'SK Petroleum', 'SKP-TENANT');

  const outletId = 'out_skp_gadhiya';
  db.prepare(`
    INSERT INTO outlets (id, tenant_id, name, code, address, omc_brand, ro_code, gstin, timezone, cash_variance_threshold_paise)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    outletId,
    tenantId,
    'SK Petroleum',
    'SKP-GADHIYA',
    'Gadhiya, Gujarat',
    'IOCL',
    'IOC-GADHIYA-RO-01',
    '24AABCS1429B1Z1',
    'Asia/Kolkata',
    20000 // ₹200 threshold
  );

  // 2. Forecourt Staff & Management for SK Petroleum, Gadhiya
  const users = [
    { id: 'usr_owner', name: 'Owner / Partner', phone: '9825001122', role: 'owner' },
    { id: 'usr_manager', name: 'Outlet Manager', phone: '9825002233', role: 'manager' },
    { id: 'usr_attendant_1', name: 'Forecourt Attendant 1', phone: '9825003344', role: 'attendant' },
    { id: 'usr_attendant_2', name: 'Forecourt Attendant 2', phone: '9825004455', role: 'attendant' },
    { id: 'usr_accountant', name: 'Station Accountant / CA', phone: '9825005566', role: 'accountant' },
  ];

  for (const u of users) {
    db.prepare(`
      INSERT INTO users (id, tenant_id, outlet_id, name, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(u.id, tenantId, outletId, u.name, u.phone, u.role);
  }

  // 3. Indian Oil Fuel Products & Current Price Book
  const products = [
    { id: 'prod_ms', code: 'MS', name: 'Petrol (Motor Spirit)', unit: 'Litre', price_paise: 9650 }, // ₹96.50/L in Gujarat
    { id: 'prod_hsd', code: 'HSD', name: 'Diesel (High Speed Diesel)', unit: 'Litre', price_paise: 9220 }, // ₹92.20/L
    { id: 'prod_xp95', code: 'XP95', name: 'Indian Oil XP95 (Premium Petrol)', unit: 'Litre', price_paise: 10450 }, // ₹104.50/L
  ];

  for (const p of products) {
    db.prepare(`
      INSERT INTO products (id, tenant_id, outlet_id, code, name, unit, current_price_paise)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, tenantId, outletId, p.code, p.name, p.unit, p.price_paise);

    db.prepare(`
      INSERT INTO price_versions (id, outlet_id, product_id, price_paise, effective_from, source, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), outletId, p.id, p.price_paise, '2026-10-01 06:00:00', 'Indian Oil Daily Rate Notification', 'Daily revision');
  }

  // 4. Underground Storage Tanks at SK Petroleum, Gadhiya
  const tanks = [
    {
      id: 'tank_ms_1',
      product_id: 'prod_ms',
      tank_number: 1,
      name: 'Tank 1 - MS Petrol (20 KL)',
      capacity_litres: 20000,
      dead_stock_litres: 500,
      current_dip_mm: 1450,
      current_dip_litres: 12500,
      current_book_litres: 12500,
    },
    {
      id: 'tank_hsd_1',
      product_id: 'prod_hsd',
      tank_number: 2,
      name: 'Tank 2 - HSD Diesel (25 KL)',
      capacity_litres: 25000,
      dead_stock_litres: 600,
      current_dip_mm: 1750,
      current_dip_litres: 17200,
      current_book_litres: 17200,
    },
  ];

  for (const t of tanks) {
    db.prepare(`
      INSERT INTO tanks (id, outlet_id, product_id, tank_number, name, capacity_litres, dead_stock_litres, current_dip_mm, current_dip_litres, current_book_litres)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(t.id, outletId, t.product_id, t.tank_number, t.name, t.capacity_litres, t.dead_stock_litres, t.current_dip_mm, t.current_dip_litres, t.current_book_litres);

    db.prepare(`
      INSERT INTO stock_movements (id, outlet_id, tank_id, product_id, movement_type, quantity_litres, balance_litres, reference_type, reference_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), outletId, t.id, t.product_id, 'OPENING', t.current_book_litres, t.current_book_litres, 'ADJUSTMENT', 'OPENING_BALANCE', 'Tank opening stock calibrated');

    // Calibrated dip chart entries (mm -> litres)
    const steps = 10;
    const maxMm = t.capacity_litres === 20000 ? 2200 : 2500;
    for (let i = 1; i <= steps; i++) {
      const mm = Math.round((maxMm / steps) * i);
      const vol = Math.round((t.capacity_litres / steps) * i);
      db.prepare(`
        INSERT INTO dip_chart_entries (id, tank_id, dip_mm, volume_litres)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), t.id, mm, vol);
    }
  }

  // 5. Forecourt Dispensers & Nozzles
  const dispensers = [
    { id: 'disp_1', dispenser_number: 1, make: 'Tokheim / Midco MPD', serial_number: 'IOC-TK-01' },
    { id: 'disp_2', dispenser_number: 2, make: 'Tokheim / Midco MPD', serial_number: 'IOC-TK-02' },
  ];

  for (const d of dispensers) {
    db.prepare(`
      INSERT INTO dispensers (id, outlet_id, dispenser_number, make, serial_number)
      VALUES (?, ?, ?, ?, ?)
    `).run(d.id, outletId, d.dispenser_number, d.make, d.serial_number);
  }

  const nozzles = [
    { id: 'noz_1', dispenser_id: 'disp_1', nozzle_number: 1, product_id: 'prod_ms', tank_id: 'tank_ms_1', last_reading: 105200.00 },
    { id: 'noz_2', dispenser_id: 'disp_1', nozzle_number: 2, product_id: 'prod_hsd', tank_id: 'tank_hsd_1', last_reading: 241500.00 },
    { id: 'noz_3', dispenser_id: 'disp_2', nozzle_number: 1, product_id: 'prod_ms', tank_id: 'tank_ms_1', last_reading: 78900.00 },
    { id: 'noz_4', dispenser_id: 'disp_2', nozzle_number: 2, product_id: 'prod_hsd', tank_id: 'tank_hsd_1', last_reading: 198400.00 },
  ];

  for (const n of nozzles) {
    db.prepare(`
      INSERT INTO nozzles (id, dispenser_id, outlet_id, nozzle_number, product_id, tank_id, meter_max, decimal_places, last_reading)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(n.id, n.dispenser_id, outletId, n.nozzle_number, n.product_id, n.tank_id, 9999999.99, 2, n.last_reading);
  }

  // 6. Active Shift 1 (Gadhiya Forecourt)
  const shiftId = 'sh_gadhiya_01';
  const businessDate = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO shifts (id, outlet_id, shift_number, business_date, status, opened_by_user_id, opened_at, notes)
    VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)
  `).run(
    shiftId,
    outletId,
    1,
    businessDate,
    'usr_manager',
    `${businessDate} 06:00:00`,
    'Morning Shift Active — SK Petroleum, Gadhiya'
  );

  console.log('✅ Seeding complete: SK Petroleum (Indian Oil), Gadhiya initialized.');
}

if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed')) {
  seed();
}
