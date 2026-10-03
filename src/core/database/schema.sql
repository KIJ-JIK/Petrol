-- Petrol Pump Management Platform Schema (PostgreSQL & SQLite compatible)

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS outlets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT NOT NULL,
  omc_brand TEXT NOT NULL, -- HPCL, IOCL, BPCL, etc.
  ro_code TEXT NOT NULL,
  gstin TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  cash_variance_threshold_paise INTEGER NOT NULL DEFAULT 20000,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL, -- attendant, manager, accountant, owner, auditor
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  code TEXT NOT NULL, -- MS, HSD, XP95, etc.
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Litre',
  current_price_paise INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS price_versions (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  price_paise INTEGER NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  source TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS tanks (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  tank_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  capacity_litres REAL NOT NULL,
  dead_stock_litres REAL NOT NULL DEFAULT 500.0,
  current_dip_mm REAL NOT NULL DEFAULT 0.0,
  current_dip_litres REAL NOT NULL DEFAULT 0.0,
  current_book_litres REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS dip_chart_entries (
  id TEXT PRIMARY KEY,
  tank_id TEXT NOT NULL REFERENCES tanks(id),
  dip_mm INTEGER NOT NULL,
  volume_litres REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS dispensers (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  dispenser_number INTEGER NOT NULL,
  make TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS nozzles (
  id TEXT PRIMARY KEY,
  dispenser_id TEXT NOT NULL REFERENCES dispensers(id),
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  nozzle_number INTEGER NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  tank_id TEXT NOT NULL REFERENCES tanks(id),
  meter_max REAL NOT NULL DEFAULT 9999999.99,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  last_reading REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  shift_number INTEGER NOT NULL,
  business_date TEXT NOT NULL,
  status TEXT NOT NULL, -- DRAFT, OPEN, CLOSE_REQUESTED, APPROVED, RETURNED, POSTED
  opened_by_user_id TEXT NOT NULL REFERENCES users(id),
  opened_at TEXT NOT NULL,
  closed_by_user_id TEXT REFERENCES users(id),
  closed_at TEXT,
  approved_by_user_id TEXT REFERENCES users(id),
  approved_at TEXT,
  return_reason TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS meter_readings (
  id TEXT PRIMARY KEY,
  shift_id TEXT NOT NULL REFERENCES shifts(id),
  nozzle_id TEXT NOT NULL REFERENCES nozzles(id),
  opening_reading REAL NOT NULL,
  closing_reading REAL NOT NULL,
  testing_litres REAL NOT NULL DEFAULT 0.0,
  is_rollover INTEGER NOT NULL DEFAULT 0,
  meter_max REAL NOT NULL,
  gross_litres_sold REAL NOT NULL,
  net_litres_sold REAL NOT NULL,
  price_paise INTEGER NOT NULL,
  total_amount_paise INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS shift_tenders (
  id TEXT PRIMARY KEY,
  shift_id TEXT UNIQUE NOT NULL REFERENCES shifts(id),
  cash_actual_paise INTEGER NOT NULL DEFAULT 0,
  cash_expected_paise INTEGER NOT NULL DEFAULT 0,
  cash_variance_paise INTEGER NOT NULL DEFAULT 0,
  upi_amount_paise INTEGER NOT NULL DEFAULT 0,
  card_amount_paise INTEGER NOT NULL DEFAULT 0,
  credit_sales_amount_paise INTEGER NOT NULL DEFAULT 0,
  fleet_amount_paise INTEGER NOT NULL DEFAULT 0,
  coupon_amount_paise INTEGER NOT NULL DEFAULT 0,
  expense_from_cash_paise INTEGER NOT NULL DEFAULT 0,
  cash_drop_paise INTEGER NOT NULL DEFAULT 0,
  denomination_json TEXT NOT NULL DEFAULT '{}',
  variance_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  tank_id TEXT NOT NULL REFERENCES tanks(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL, -- OPENING, DELIVERY, SALE, ADJUSTMENT, RETURN
  quantity_litres REAL NOT NULL,
  balance_litres REAL NOT NULL,
  reference_type TEXT NOT NULL, -- SHIFT, DELIVERY, ADJUSTMENT
  reference_id TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  tank_id TEXT NOT NULL REFERENCES tanks(id),
  invoice_number TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  tanker_truck_no TEXT NOT NULL,
  invoice_litres REAL NOT NULL,
  received_litres REAL NOT NULL,
  opening_dip_mm REAL NOT NULL,
  opening_dip_litres REAL NOT NULL,
  closing_dip_mm REAL NOT NULL,
  closing_dip_litres REAL NOT NULL,
  variance_litres REAL NOT NULL,
  density_observed REAL NOT NULL,
  temperature_celsius REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'APPROVED',
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  phone TEXT NOT NULL,
  credit_limit_paise INTEGER NOT NULL DEFAULT 5000000, -- ₹50,000 default
  current_balance_paise INTEGER NOT NULL DEFAULT 0,
  payment_terms_days INTEGER NOT NULL DEFAULT 15,
  vehicles_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS credit_sales (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  shift_id TEXT REFERENCES shifts(id),
  party_id TEXT NOT NULL REFERENCES parties(id),
  vehicle_no TEXT,
  product_id TEXT NOT NULL REFERENCES products(id),
  litres REAL NOT NULL,
  rate_paise INTEGER NOT NULL,
  total_amount_paise INTEGER NOT NULL,
  slip_no TEXT,
  status TEXT NOT NULL DEFAULT 'UNPAID',
  allocated_paise INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  party_id TEXT NOT NULL REFERENCES parties(id),
  amount_paise INTEGER NOT NULL,
  payment_mode TEXT NOT NULL, -- CASH, BANK_TRANSFER, CHEQUE, UPI
  reference_no TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  voucher_number TEXT UNIQUE NOT NULL,
  voucher_date TEXT NOT NULL,
  reference_type TEXT NOT NULL, -- SHIFT_CLOSE, DELIVERY, CREDIT_RECEIPT, REVERSAL
  reference_id TEXT NOT NULL,
  narration TEXT NOT NULL,
  total_debit_paise INTEGER NOT NULL,
  total_credit_paise INTEGER NOT NULL,
  is_reversed INTEGER NOT NULL DEFAULT 0,
  reversed_by_id TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id),
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  debit_paise INTEGER NOT NULL DEFAULT 0,
  credit_paise INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  outlet_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_state TEXT,
  after_state TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL,
  device_event_time TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  error_message TEXT,
  processed_at TEXT
);
