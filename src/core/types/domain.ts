// Domain Types for Petrol Pump Operations & Finance Platform

export type Role = 'attendant' | 'manager' | 'accountant' | 'owner' | 'auditor';

export type ShiftStatus = 'DRAFT' | 'OPEN' | 'CLOSE_REQUESTED' | 'APPROVED' | 'RETURNED' | 'POSTED';

export type TenderCategory = 'CASH' | 'UPI' | 'CARD' | 'FLEET' | 'COUPON' | 'CREDIT' | 'OTHER';

export type MovementType = 'OPENING' | 'DELIVERY' | 'SALE' | 'ADJUSTMENT' | 'RETURN';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Outlet {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address: string;
  omc_brand: 'HPCL' | 'IOCL' | 'BPCL' | 'SHELL' | 'JIO_BP' | 'OTHER';
  ro_code: string; // Retail Outlet Code
  gstin: string;
  timezone: string;
  cash_variance_threshold_paise: number; // e.g. 20000 = ₹200
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  outlet_id: string;
  name: string;
  phone: string;
  role: Role;
  active: boolean;
}

export interface Product {
  id: string;
  tenant_id: string;
  outlet_id: string;
  code: 'MS' | 'HSD' | 'XP95' | 'CNG' | 'LUBE';
  name: string;
  unit: string; // 'Litre', 'Kg', 'Pack'
  current_price_paise: number; // in integer paise (e.g. 10450 for ₹104.50)
}

export interface PriceVersion {
  id: string;
  outlet_id: string;
  product_id: string;
  price_paise: number;
  effective_from: string;
  effective_to?: string;
  source: string;
  reason: string;
}

export interface Tank {
  id: string;
  outlet_id: string;
  product_id: string;
  tank_number: number;
  name: string;
  capacity_litres: number;
  dead_stock_litres: number;
  current_dip_mm: number;
  current_dip_litres: number;
  current_book_litres: number;
}

export interface DipChartEntry {
  id: string;
  tank_id: string;
  dip_mm: number;
  volume_litres: number;
}

export interface Dispenser {
  id: string;
  outlet_id: string;
  dispenser_number: number;
  make: string; // e.g., 'Wayne', 'Gilbarco', 'Tokheim'
  serial_number: string;
}

export interface Nozzle {
  id: string;
  dispenser_id: string;
  outlet_id: string;
  nozzle_number: number;
  product_id: string;
  tank_id: string;
  meter_max: number; // e.g. 9999999.99
  decimal_places: number;
  last_reading: number;
}

export interface Shift {
  id: string;
  outlet_id: string;
  shift_number: number; // 1 (Morning), 2 (Evening), 3 (Night)
  business_date: string; // YYYY-MM-DD
  status: ShiftStatus;
  opened_by_user_id: string;
  opened_at: string;
  closed_by_user_id?: string;
  closed_at?: string;
  approved_by_user_id?: string;
  approved_at?: string;
  return_reason?: string;
  notes?: string;
}

export interface MeterReading {
  id: string;
  shift_id: string;
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
  created_at: string;
}

export interface CashDenominationCount {
  count_2000: number;
  count_500: number;
  count_200: number;
  count_100: number;
  count_50: number;
  count_20: number;
  count_10: number;
  count_5: number;
  coins: number;
}

export interface ShiftTenders {
  id: string;
  shift_id: string;
  cash_actual_paise: number;
  cash_expected_paise: number;
  cash_variance_paise: number; // actual - expected
  upi_amount_paise: number;
  card_amount_paise: number;
  credit_sales_amount_paise: number;
  fleet_amount_paise: number;
  coupon_amount_paise: number;
  expense_from_cash_paise: number;
  cash_drop_paise: number;
  denomination_counts: CashDenominationCount;
  variance_reason?: string;
}

export interface StockMovement {
  id: string;
  outlet_id: string;
  tank_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity_litres: number; // positive for receipt, negative for sale/drop
  balance_litres: number;
  reference_type: 'SHIFT' | 'DELIVERY' | 'ADJUSTMENT';
  reference_id: string;
  created_at: string;
  notes?: string;
}

export interface Delivery {
  id: string;
  outlet_id: string;
  tank_id: string;
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  tanker_truck_no: string;
  invoice_litres: number;
  received_litres: number;
  opening_dip_mm: number;
  opening_dip_litres: number;
  closing_dip_mm: number;
  closing_dip_litres: number;
  variance_litres: number; // closing - opening - invoice
  density_observed: number; // kg/m3
  temperature_celsius: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface Party {
  id: string;
  outlet_id: string;
  name: string;
  code: string;
  phone: string;
  credit_limit_paise: number;
  current_balance_paise: number; // positive means party owes outlet
  payment_terms_days: number;
  vehicles: string[];
  active: boolean;
}

export interface CreditSale {
  id: string;
  outlet_id: string;
  shift_id?: string;
  party_id: string;
  vehicle_no?: string;
  product_id: string;
  litres: number;
  rate_paise: number;
  total_amount_paise: number;
  slip_no?: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  allocated_paise: number;
  created_at: string;
}

export interface Receipt {
  id: string;
  outlet_id: string;
  party_id: string;
  amount_paise: number;
  payment_mode: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI';
  reference_no?: string;
  created_at: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  outlet_id: string;
  voucher_number: string;
  voucher_date: string;
  reference_type: 'SHIFT_CLOSE' | 'DELIVERY' | 'CREDIT_RECEIPT' | 'EXPENSE' | 'REVERSAL';
  reference_id: string;
  narration: string;
  total_debit_paise: number;
  total_credit_paise: number;
  is_reversed: boolean;
  reversed_by_id?: string;
  created_at: string;
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  account_code: string;
  account_name: string;
  debit_paise: number;
  credit_paise: number;
}

export interface AuditEvent {
  id: string;
  tenant_id: string;
  outlet_id: string;
  actor_user_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: string;
  after_state?: string;
  reason?: string;
  ip_address?: string;
  created_at: string;
}
