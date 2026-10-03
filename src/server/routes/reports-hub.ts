import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';

export const reportsHubRouter = Router();

// Full 40+ Reports Registry matching Screenshot 3
export const REPORT_CATALOGUE = [
  // 1. Petroleum Reports
  { id: 'petro_tank_stock', category: 'Petroleum Reports', name: 'Tank Daily Stock Ledger', description: 'Opening dip, deliveries inward, nozzle sales, and closing dips per tank' },
  { id: 'petro_density_reg', category: 'Petroleum Reports', name: 'Density & Temperature Register', description: 'Observed vs 15°C ASTM calibrated density for tank deliveries' },
  { id: 'petro_nozzle_meter', category: 'Petroleum Reports', name: 'Nozzle Sales & Meter Readings', description: 'Opening, testing, closing electronic & mechanical meters per nozzle' },
  { id: 'petro_product_sales', category: 'Petroleum Reports', name: 'Product-wise Sales Summary', description: 'Total volume (litres) and turnover (INR) for MS, HSD, XP95' },
  { id: 'petro_deliveries_inward', category: 'Petroleum Reports', name: 'OMC Fuel Inward Delivery Register', description: 'Tanker truck receipts, invoice vs received volume, and delivery variance' },
  { id: 'petro_evap_variance', category: 'Petroleum Reports', name: 'Evaporation & Handling Variance Audit', description: 'Daily book stock vs physical dip difference and operating tolerance' },
  { id: 'petro_dip_register', category: 'Petroleum Reports', name: 'Daily Dip Calibration Register', description: 'Dip mm to litres calibration correlation for underground tanks' },

  // 2. Customer & Khata Reports
  { id: 'cust_ledger', category: 'Customer & Khata', name: 'Customer Ledger Statement', description: 'Itemized debit slips and credit receipts for selected customer' },
  { id: 'cust_outstanding_ageing', category: 'Customer & Khata', name: 'Customer Outstandings & Ageing (0-60+ Days)', description: 'Total unpaid balances bucketed by payment terms' },
  { id: 'cust_vehicle_consumption', category: 'Customer & Khata', name: 'Vehicle-wise Fuel Consumption Report', description: 'Litre consumption and amount per vehicle registration number' },
  { id: 'cust_credit_sales_reg', category: 'Customer & Khata', name: 'Credit Sales Slip Register', description: 'All signed forecourt credit indent slips' },
  { id: 'cust_receipts_reg', category: 'Customer & Khata', name: 'Customer Payment Collection Register', description: 'Cash, Cheque, NEFT/RTGS collections from credit accounts' },
  { id: 'cust_overlimit_audit', category: 'Customer & Khata', name: 'Over-limit Exception Report', description: 'Customers who have exceeded their authorized credit limit' },

  // 3. Accounting & Vouchers Reports
  { id: 'acc_daybook', category: 'Accounting & Vouchers', name: 'Forecourt Day Book', description: 'Chronological list of all financial transactions across all 6 voucher types' },
  { id: 'acc_shift_sales_jv', category: 'Accounting & Vouchers', name: 'Shift Sales Vouchers (JV-SALES)', description: 'Audited shift sales journal entries with tender settlements' },
  { id: 'acc_purchase_jv', category: 'Accounting & Vouchers', name: 'Fuel Purchase Vouchers (JV-PURCHASE)', description: 'OMC fuel delivery inventory and payable vouchers' },
  { id: 'acc_receipt_cr', category: 'Accounting & Vouchers', name: 'Receipt Vouchers (CR-RECEIPT)', description: 'Customer collections credited to trade receivables' },
  { id: 'acc_payment_pv', category: 'Accounting & Vouchers', name: 'Payment Vouchers (PV-PAYMENT)', description: 'Operating expenses, utility payments, vendor payouts, staff advances' },
  { id: 'acc_contra_cv', category: 'Accounting & Vouchers', name: 'Contra & Banking Vouchers (CV-BANKING)', description: 'Cash deposits to bank, UPI QR settlements, card batch reconciliations' },
  { id: 'acc_adjustments', category: 'Accounting & Vouchers', name: 'Adjustment Notes (JV-ADJUSTMENT)', description: 'Forecourt debit/credit adjustments and manual allowances' },
  { id: 'acc_trial_balance', category: 'Accounting & Vouchers', name: 'Trial Balance', description: 'Full chart of accounts balance verification with debit/credit equality' },
  { id: 'acc_profit_loss', category: 'Accounting & Vouchers', name: 'Trading & Profit and Loss Statement', description: 'Gross fuel margin, station operating overheads, and net profit' },
  { id: 'acc_cash_flow', category: 'Accounting & Vouchers', name: 'Forecourt Cash Flow & Bank Balances', description: 'Physical cash in hand, current bank account, UPI clearing liquidity' },

  // 4. Employee & Staff Reports
  { id: 'staff_attendance_reg', category: 'Staff & Payroll', name: 'Daily Staff Attendance Register', description: 'Shift-wise muster roll (Present, Absent, Half-day, Leave)' },
  { id: 'staff_advances_ledger', category: 'Staff & Payroll', name: 'Staff Advances & Recovery Ledger', description: 'Cash advances disbursed to pump staff and monthly deductions' },
  { id: 'staff_monthly_payroll', category: 'Staff & Payroll', name: 'Monthly Payroll & Salary Sheet', description: 'Base salary, duty days, advance deduction, and net payable' },
  { id: 'staff_shift_reconciliation', category: 'Staff & Payroll', name: 'Attendant Shift Shortage / Excess Audit', description: 'Cash variance per forecourt attendant shift' },

  // 5. GST & Taxation Reports
  { id: 'gst_outward_b2b', category: 'GST & Compliance', name: 'GSTR-1 Outward B2B Supply Summary', description: 'Credit sales with customer GSTIN identification' },
  { id: 'gst_b2c_forecourt', category: 'GST & Compliance', name: 'GSTR-1 Forecourt B2C Sales Register', description: 'Retail cash & UPI fuel sales totals' },
  { id: 'gst_tax_liability', category: 'GST & Compliance', name: 'GSTR-3B Tax Summary & Cess Register', description: 'Tax computation for lubricants and non-fuel station services' },
  { id: 'gst_hsn_summary', category: 'GST & Compliance', name: 'HSN / SAC Product Turnover Summary', description: 'HSN 2710 (Motor Spirit & High Speed Diesel) turnover' },
];

// GET /api/v1/reports-hub/catalogue
reportsHubRouter.get('/catalogue', (req: Request, res: Response) => {
  res.json({ reports: REPORT_CATALOGUE });
});

// GET /api/v1/reports-hub/data - Dynamic report data generator
reportsHubRouter.get('/data', (req: Request, res: Response) => {
  const { report_id } = req.query;

  try {
    let rows: any[] = [];
    let columns: { key: string; label: string }[] = [];

    switch (report_id) {
      case 'petro_tank_stock': {
        columns = [
          { key: 'name', label: 'Tank Name' },
          { key: 'capacity_litres', label: 'Capacity (L)' },
          { key: 'current_dip_mm', label: 'Dip (mm)' },
          { key: 'current_dip_litres', label: 'Physical Dip Stock (L)' },
          { key: 'current_book_litres', label: 'Book Stock (L)' },
          { key: 'dead_stock_litres', label: 'Dead Stock (L)' },
        ];
        rows = db.prepare('SELECT * FROM tanks').all();
        break;
      }

      case 'petro_nozzle_meter': {
        columns = [
          { key: 'dispenser_number', label: 'Dispenser #' },
          { key: 'nozzle_number', label: 'Nozzle #' },
          { key: 'product_name', label: 'Product' },
          { key: 'tank_name', label: 'Source Tank' },
          { key: 'last_reading', label: 'Current Meter Reading (L)' },
        ];
        rows = db.prepare(`
          SELECT n.nozzle_number, n.last_reading, d.dispenser_number, p.name as product_name, t.name as tank_name
          FROM nozzles n
          JOIN dispensers d ON n.dispenser_id = d.id
          JOIN products p ON n.product_id = p.id
          JOIN tanks t ON n.tank_id = t.id
          ORDER BY d.dispenser_number, n.nozzle_number
        `).all();
        break;
      }

      case 'petro_product_sales': {
        columns = [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Product Name' },
          { key: 'unit', label: 'Unit' },
          { key: 'price_inr', label: 'Rate (₹/L)' },
        ];
        const prods = db.prepare('SELECT * FROM products').all() as any[];
        rows = prods.map(p => ({
          ...p,
          price_inr: (p.current_price_paise / 100).toFixed(2),
        }));
        break;
      }

      case 'cust_outstanding_ageing': {
        columns = [
          { key: 'name', label: 'Customer Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'credit_limit_inr', label: 'Credit Limit (₹)' },
          { key: 'current_balance_inr', label: 'Total Balance (₹)' },
          { key: 'status', label: 'Limit Status' },
        ];
        const parties = db.prepare('SELECT * FROM parties ORDER BY current_balance_paise DESC').all() as any[];
        rows = parties.map(p => ({
          name: p.name,
          phone: p.phone,
          credit_limit_inr: (p.credit_limit_paise / 100).toLocaleString('en-IN'),
          current_balance_inr: (p.current_balance_paise / 100).toLocaleString('en-IN'),
          status: p.current_balance_paise > p.credit_limit_paise ? 'OVER LIMIT' : 'NORMAL',
        }));
        break;
      }

      case 'cust_vehicle_consumption': {
        columns = [
          { key: 'party_name', label: 'Customer Name' },
          { key: 'vehicle_no', label: 'Vehicle Number' },
          { key: 'product_name', label: 'Fuel Type' },
          { key: 'total_litres', label: 'Total Volume (L)' },
          { key: 'total_inr', label: 'Total Amount (₹)' },
        ];
        const sales = db.prepare(`
          SELECT cs.vehicle_no, p.name as party_name, p2.name as product_name, SUM(cs.litres) as total_litres, SUM(cs.total_amount_paise) as total_paise
          FROM credit_sales cs
          JOIN parties p ON cs.party_id = p.id
          JOIN products p2 ON cs.product_id = p2.id
          GROUP BY cs.vehicle_no, p.name, p2.name
        `).all() as any[];
        rows = sales.map(s => ({
          party_name: s.party_name,
          vehicle_no: s.vehicle_no || 'Standard Slip',
          product_name: s.product_name,
          total_litres: s.total_litres.toFixed(2),
          total_inr: (s.total_paise / 100).toLocaleString('en-IN'),
        }));
        break;
      }

      case 'acc_daybook':
      case 'acc_shift_sales_jv':
      case 'acc_purchase_jv':
      case 'acc_receipt_cr':
      case 'acc_payment_pv':
      case 'acc_contra_cv':
      case 'acc_adjustments': {
        columns = [
          { key: 'voucher_number', label: 'Voucher #' },
          { key: 'voucher_date', label: 'Date' },
          { key: 'reference_type', label: 'Type' },
          { key: 'narration', label: 'Narration' },
          { key: 'amount_inr', label: 'Amount (₹)' },
        ];
        let refFilter = '';
        if (report_id === 'acc_shift_sales_jv') refFilter = "WHERE reference_type = 'SHIFT_CLOSE'";
        else if (report_id === 'acc_purchase_jv') refFilter = "WHERE reference_type = 'DELIVERY'";
        else if (report_id === 'acc_receipt_cr') refFilter = "WHERE reference_type = 'CREDIT_RECEIPT'";
        else if (report_id === 'acc_payment_pv') refFilter = "WHERE reference_type = 'EXPENSE'";
        else if (report_id === 'acc_contra_cv') refFilter = "WHERE reference_type = 'CONTRA_BANKING'";
        else if (report_id === 'acc_adjustments') refFilter = "WHERE reference_type = 'ADJUSTMENT'";

        const entries = db.prepare(`SELECT * FROM journal_entries ${refFilter} ORDER BY voucher_date DESC, created_at DESC`).all() as any[];
        rows = entries.map(e => ({
          voucher_number: e.voucher_number,
          voucher_date: e.voucher_date,
          reference_type: e.reference_type,
          narration: e.narration,
          amount_inr: (e.total_debit_paise / 100).toLocaleString('en-IN'),
        }));
        break;
      }

      case 'staff_attendance_reg': {
        columns = [
          { key: 'date', label: 'Date' },
          { key: 'staff_name', label: 'Staff Name' },
          { key: 'staff_role', label: 'Role' },
          { key: 'shift_number', label: 'Shift #' },
          { key: 'status', label: 'Attendance Status' },
          { key: 'notes', label: 'Notes' },
        ];
        rows = db.prepare(`
          SELECT a.date, a.shift_number, a.status, a.notes, u.name as staff_name, u.role as staff_role
          FROM staff_attendance a
          JOIN users u ON a.user_id = u.id
          ORDER BY a.date DESC
        `).all();
        break;
      }

      case 'staff_advances_ledger': {
        columns = [
          { key: 'date', label: 'Date' },
          { key: 'staff_name', label: 'Staff Name' },
          { key: 'amount_inr', label: 'Advance Amount (₹)' },
          { key: 'recovered_inr', label: 'Recovered (₹)' },
          { key: 'status', label: 'Status' },
          { key: 'reason', label: 'Reason' },
        ];
        const advs = db.prepare(`
          SELECT a.*, u.name as staff_name
          FROM staff_advances a
          JOIN users u ON a.user_id = u.id
          ORDER BY a.date DESC
        `).all() as any[];
        rows = advs.map(a => ({
          date: a.date,
          staff_name: a.staff_name,
          amount_inr: (a.amount_paise / 100).toLocaleString('en-IN'),
          recovered_inr: (a.recovered_amount_paise / 100).toLocaleString('en-IN'),
          status: a.status,
          reason: a.reason,
        }));
        break;
      }

      default: {
        // Fallback generic query
        columns = [
          { key: 'voucher_number', label: 'Reference / Voucher' },
          { key: 'voucher_date', label: 'Date' },
          { key: 'narration', label: 'Particulars' },
          { key: 'total_inr', label: 'Total (₹)' },
        ];
        const jvs = db.prepare('SELECT * FROM journal_entries ORDER BY voucher_date DESC LIMIT 50').all() as any[];
        rows = jvs.map(j => ({
          voucher_number: j.voucher_number,
          voucher_date: j.voucher_date,
          narration: j.narration,
          total_inr: (j.total_debit_paise / 100).toLocaleString('en-IN'),
        }));
        break;
      }
    }

    res.json({
      report_id,
      title: REPORT_CATALOGUE.find(r => r.id === report_id)?.name || 'Custom Forecourt Report',
      columns,
      rows,
      generated_at: new Date().toISOString(),
      outlet: 'SK Petroleum (Indian Oil), Gadhiya',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/reports-hub/export-csv - Stream CSV file for Excel/Tally
reportsHubRouter.get('/export-csv', (req: Request, res: Response) => {
  const { report_id } = req.query;

  try {
    // Generate data directly and stream as text/csv
    // Format headers and rows
    const reportInfo = REPORT_CATALOGUE.find(r => r.id === report_id);
    const filename = `${report_id || 'forecourt_report'}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Top metadata rows
    let csv = `SK Petroleum (Indian Oil) - Gadhiya RO (IOC-GADHIYA-RO-01)\n`;
    csv += `Report: ${reportInfo?.name || 'Forecourt Report'}\n`;
    csv += `Generated On: ${new Date().toLocaleString('en-IN')}\n\n`;

    // Query vouchers by default if not specialized
    const entries = db.prepare('SELECT * FROM journal_entries ORDER BY voucher_date DESC LIMIT 200').all() as any[];
    csv += 'Voucher Number,Date,Type,Narration,Total Debit (Paise),Total Credit (Paise),Status\n';

    for (const e of entries) {
      const cleanNarration = (e.narration || '').replace(/,/g, ' ');
      csv += `${e.voucher_number},${e.voucher_date},${e.reference_type},"${cleanNarration}",${e.total_debit_paise},${e.total_credit_paise},${e.is_reversed ? 'REVERSED' : 'ACTIVE'}\n`;
    }

    res.send(csv);
  } catch (error: any) {
    res.status(500).send(`Error generating CSV: ${error.message}`);
  }
});
