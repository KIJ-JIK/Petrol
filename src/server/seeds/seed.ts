import { db, initDatabase } from '../../core/database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { JournalEngine } from '../../core/domain/journal-engine.js';

export function seed() {
  initDatabase();

  const tables = [
    'notification_logs',
    'notification_templates',
    'bank_statement_lines',
    'counter_sales',
    'customer_invoice_items',
    'customer_invoices',
    'stock_adjustments',
    'fuel_density_records',
    'meter_replacement_exceptions',
    'asset_status_logs',
    'sync_queue',
    'audit_events',
    'banking_transactions',
    'staff_payroll',
    'staff_advances',
    'staff_attendance',
    'customer_vehicles',
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

  // 7. Customers / Khata Parties (Gadhiya Agricultural & Commercial Accounts)
  const partiesData = [
    {
      id: 'pty_gadhiya_kisan',
      name: 'Gadhiya Kisan Seva Sahakari Mandali',
      code: 'CUST-KISAN-01',
      phone: '9825112233',
      credit_limit_paise: 10000000, // ₹1,00,000
      payment_terms_days: 15,
      vehicles: ['GJ-11-AA-4411', 'GJ-11-AA-4412', 'GJ-11-TR-5050'],
    },
    {
      id: 'pty_saurashtra_logistics',
      name: 'Saurashtra Highway Logistics',
      code: 'CUST-SHL-02',
      phone: '9825223344',
      credit_limit_paise: 25000000, // ₹2,50,000
      payment_terms_days: 30,
      vehicles: ['GJ-14-TR-8822', 'GJ-14-TR-8823', 'GJ-14-TR-9901'],
    },
    {
      id: 'pty_panchayat_tractor',
      name: 'Gadhiya Gram Panchayat Tractor Service',
      code: 'CUST-GP-03',
      phone: '9825334455',
      credit_limit_paise: 5000000, // ₹50,000
      payment_terms_days: 15,
      vehicles: ['GJ-11-GP-0099'],
    },
  ];

  for (const p of partiesData) {
    db.prepare(`
      INSERT INTO parties (id, outlet_id, name, code, phone, credit_limit_paise, current_balance_paise, payment_terms_days, vehicles_json)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(p.id, outletId, p.name, p.code, p.phone, p.credit_limit_paise, p.payment_terms_days, JSON.stringify(p.vehicles));

    for (const v of p.vehicles) {
      db.prepare(`
        INSERT INTO customer_vehicles (id, party_id, vehicle_no)
        VALUES (?, ?, ?)
      `).run(uuidv4(), p.id, v);
    }
  }

  // 8. Sample Credit Sales & Collections for Parties
  const sale1Paise = 1844000; // 200 Litres HSD @ ₹92.20 = ₹18,440
  db.prepare(`
    INSERT INTO credit_sales (id, outlet_id, shift_id, party_id, vehicle_no, product_id, litres, rate_paise, total_amount_paise, slip_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    outletId,
    shiftId,
    'pty_gadhiya_kisan',
    'GJ-11-AA-4411',
    'prod_hsd',
    200.0,
    9220,
    sale1Paise,
    'SL-10021'
  );
  db.prepare('UPDATE parties SET current_balance_paise = current_balance_paise + ? WHERE id = ?').run(sale1Paise, 'pty_gadhiya_kisan');

  const sale2Paise = 2766000; // 300 Litres HSD @ ₹92.20 = ₹27,660
  db.prepare(`
    INSERT INTO credit_sales (id, outlet_id, shift_id, party_id, vehicle_no, product_id, litres, rate_paise, total_amount_paise, slip_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    outletId,
    shiftId,
    'pty_saurashtra_logistics',
    'GJ-14-TR-8822',
    'prod_hsd',
    300.0,
    9220,
    sale2Paise,
    'SL-10022'
  );
  db.prepare('UPDATE parties SET current_balance_paise = current_balance_paise + ? WHERE id = ?').run(sale2Paise, 'pty_saurashtra_logistics');

  // 9. Staff Attendance (Today & Yesterday)
  const today = businessDate;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const attendanceEntries = [
    { user_id: 'usr_manager', date: today, shift_number: 1, status: 'PRESENT', notes: 'Forecourt shift in-charge' },
    { user_id: 'usr_attendant_1', date: today, shift_number: 1, status: 'PRESENT', notes: 'Dispenser 1 MPD operator' },
    { user_id: 'usr_attendant_2', date: today, shift_number: 1, status: 'PRESENT', notes: 'Dispenser 2 MPD operator' },
    { user_id: 'usr_accountant', date: today, shift_number: 1, status: 'PRESENT', notes: 'Back-office khata audit' },
    { user_id: 'usr_manager', date: yesterday, shift_number: 1, status: 'PRESENT', notes: 'On-time' },
    { user_id: 'usr_attendant_1', date: yesterday, shift_number: 1, status: 'PRESENT', notes: 'On-time' },
    { user_id: 'usr_attendant_2', date: yesterday, shift_number: 1, status: 'HALF_DAY', notes: 'Afternoon medical leave' },
    { user_id: 'usr_accountant', date: yesterday, shift_number: 1, status: 'PRESENT', notes: 'On-time' },
  ];

  for (const a of attendanceEntries) {
    db.prepare(`
      INSERT INTO staff_attendance (id, user_id, date, shift_number, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), a.user_id, a.date, a.shift_number, a.status, a.notes);
  }

  // 10. Sample Staff Advance & Balanced Payment Voucher
  const advanceAmountPaise = 300000; // ₹3,000 cash advance
  const { entry: advVoucher, lines: advLines } = JournalEngine.createPaymentVoucher({
    outlet_id: outletId,
    voucher_date: today,
    vendor_name: 'Forecourt Attendant 1',
    expense_category: 'Staff Advance',
    amount_paise: advanceAmountPaise,
    paid_from: 'CASH',
    narration: 'Staff salary advance disbursed for festival expenses',
  });

  db.prepare(`
    INSERT INTO journal_entries (id, outlet_id, voucher_number, voucher_date, reference_type, reference_id, narration, total_debit_paise, total_credit_paise)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(advVoucher.id, advVoucher.outlet_id, advVoucher.voucher_number, advVoucher.voucher_date, advVoucher.reference_type, advVoucher.reference_id, advVoucher.narration, advVoucher.total_debit_paise, advVoucher.total_credit_paise);

  const insertLine = db.prepare(`
    INSERT INTO journal_lines (id, journal_entry_id, account_code, account_name, debit_paise, credit_paise)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const l of advLines) {
    insertLine.run(l.id, l.journal_entry_id, l.account_code, l.account_name, l.debit_paise, l.credit_paise);
  }

  db.prepare(`
    INSERT INTO staff_advances (id, user_id, amount_paise, date, reason, status, recovered_amount_paise, voucher_id)
    VALUES (?, ?, ?, ?, ?, 'DISBURSED', 0, ?)
  `).run(uuidv4(), 'usr_attendant_1', advanceAmountPaise, today, 'Festival advance', advVoucher.id);

  // 11. Sample Contra Banking Voucher (Cash Deposit to SBI)
  const depositPaise = 25000000; // ₹2,50,000 forecourt cash deposited into Current Account
  const { entry: contraVoucher, lines: contraLines } = JournalEngine.createContraBankingVoucher({
    outlet_id: outletId,
    voucher_date: today,
    transaction_type: 'CASH_DEPOSIT',
    bank_name: 'SBI IOCL Current Account (Gadhiya Branch)',
    amount_paise: depositPaise,
    reference_no: 'SBI-DEP-9941',
    narration: 'Forecourt daily cash sales deposited into SBI IOCL Current Account',
  });

  db.prepare(`
    INSERT INTO journal_entries (id, outlet_id, voucher_number, voucher_date, reference_type, reference_id, narration, total_debit_paise, total_credit_paise)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(contraVoucher.id, contraVoucher.outlet_id, contraVoucher.voucher_number, contraVoucher.voucher_date, contraVoucher.reference_type, contraVoucher.reference_id, contraVoucher.narration, contraVoucher.total_debit_paise, contraVoucher.total_credit_paise);

  for (const l of contraLines) {
    insertLine.run(l.id, l.journal_entry_id, l.account_code, l.account_name, l.debit_paise, l.credit_paise);
  }

  // 12. Approved Transactional Notification Templates (DLT / TRAI Compliant)
  const templates = [
    {
      id: 'tpl_credit_sale',
      name: 'Credit Fuel Dispense Confirmation',
      category: 'TRANSACTIONAL',
      dlt_template_id: 'DLT-IOCL-110729381',
      channel: 'SMS',
      content_template: 'Dear {#var#}, fuel of {#var#}L worth Rs.{#var#} dispensed for vehicle {#var#} at SK Petroleum, Gadhiya. Current balance: Rs.{#var#}. - Indian Oil',
    },
    {
      id: 'tpl_receipt_ack',
      name: 'Khata Payment Receipt Acknowledgment',
      category: 'TRANSACTIONAL',
      dlt_template_id: 'DLT-IOCL-110729382',
      channel: 'SMS',
      content_template: 'Dear {#var#}, received payment of Rs.{#var#} via {#var#} (Ref: {#var#}). Updated balance: Rs.{#var#}. Thank you - SK Petroleum, Gadhiya.',
    },
    {
      id: 'tpl_invoice_memo',
      name: 'Monthly Periodic Statement Availability',
      category: 'SERVICE',
      dlt_template_id: 'DLT-IOCL-110729383',
      channel: 'SMS',
      content_template: 'Dear {#var#}, your fuel billing memo {#var#} for Rs.{#var#} is generated. Due date: {#var#}. View invoice online: {#var#}. - SK Petroleum.',
    },
    {
      id: 'tpl_due_reminder',
      name: 'Payment Due Friendly Reminder',
      category: 'SERVICE',
      dlt_template_id: 'DLT-IOCL-110729384',
      channel: 'SMS',
      content_template: 'Dear {#var#}, a friendly reminder that Rs.{#var#} is due for your Khata account at SK Petroleum, Gadhiya. Kindly settle to avoid credit interruption.',
    },
  ];

  for (const t of templates) {
    db.prepare(`
      INSERT INTO notification_templates (id, name, category, dlt_template_id, channel, content_template, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(t.id, t.name, t.category, t.dlt_template_id, t.channel, t.content_template);
  }

  // 13. Daily Fuel Density Calibration Records
  db.prepare(`
    INSERT INTO fuel_density_records (id, outlet_id, tank_id, product_id, sample_timestamp, temperature_celsius, observed_density, density_at_15c, sampling_method, sample_result, reviewed_by_user_id, notes)
    VALUES (?, ?, 'tank_ms_1', 'prod_ms', ?, 29.5, 735.4, 745.1, 'HYDROMETER_MANUAL', 'NORMAL', 'usr_manager', 'Morning tank dip density check - within IOCL Gujarat tolerance')
  `).run(uuidv4(), outletId, `${today} 06:45:00`);

  db.prepare(`
    INSERT INTO fuel_density_records (id, outlet_id, tank_id, product_id, sample_timestamp, temperature_celsius, observed_density, density_at_15c, sampling_method, sample_result, reviewed_by_user_id, notes)
    VALUES (?, ?, 'tank_hsd_1', 'prod_hsd', ?, 29.0, 824.2, 833.6, 'HYDROMETER_MANUAL', 'NORMAL', 'usr_manager', 'Morning tank dip density check - normal diesel standard')
  `).run(uuidv4(), outletId, `${today} 06:50:00`);

  // 14. Sample Bank Statement Credit Entries for Reconciliation
  db.prepare(`
    INSERT INTO bank_statement_lines (id, outlet_id, bank_name, transaction_date, description, reference_no, credit_paise, debit_paise, match_status, notes)
    VALUES (?, ?, 'SBI IOCL Current Account (Gadhiya)', ?, 'BY CASH DEPOSIT FORECOURT COUNTER', 'SBI-DEP-9941', 25000000, 0, 'MATCHED', 'Reconciled to CV-BANKING voucher')
  `).run(uuidv4(), outletId, today);

  db.prepare(`
    INSERT INTO bank_statement_lines (id, outlet_id, bank_name, transaction_date, description, reference_no, credit_paise, debit_paise, match_status, notes)
    VALUES (?, ?, 'SBI IOCL Current Account (Gadhiya)', ?, 'UPI IOCL QR BATCH SETTLEMENT ICICI', 'UPI-BAT-4401', 3450000, 0, 'UNMATCHED', 'Awaiting accountant review')
  `).run(uuidv4(), outletId, today);

  // 15. Sample Counter Sale (Servo Pride Packaged Lube)
  const lubeBillId = uuidv4();
  const lubeAmountPaise = 185000; // ₹1,850 for Servo Pride 15W-40 5L
  db.prepare(`
    INSERT INTO counter_sales (id, outlet_id, bill_number, customer_name, customer_phone, product_category, product_name, quantity, unit_price_paise, total_amount_paise, tender_mode, cash_tendered_paise, digital_tendered_paise, sold_by_user_id)
    VALUES (?, ?, 'POS-LUBE-001', 'Arjun Bhai Patel', '9825445566', 'LUBRICANT', 'Servo Pride 15W-40 (5 Litres)', 1, 185000, 185000, 'UPI', 0, 185000, 'usr_attendant_1')
  `).run(lubeBillId, outletId);

  console.log('✅ Seeding complete: SK Petroleum (Indian Oil), Gadhiya initialized with full facilities.');
}

if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed')) {
  seed();
}
