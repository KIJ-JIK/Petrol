import { Router, Request, Response } from 'express';
import { db } from '../../core/database/db.js';
import { StockLedgerEngine } from '../../core/domain/stock-ledger.js';

export const reportRouter = Router();

// GET /api/v1/reports/dsr (Daily Sales Report)
reportRouter.get('/dsr', (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  try {
    // 1. Sales by Product
    const salesByProduct = db.prepare(`
      SELECT 
        p.id as product_id,
        p.code as product_code,
        p.name as product_name,
        p.current_price_paise,
        COALESCE(SUM(r.net_litres_sold), 0) as total_litres,
        COALESCE(SUM(r.total_amount_paise), 0) as total_amount_paise
      FROM products p
      LEFT JOIN nozzles n ON n.product_id = p.id
      LEFT JOIN meter_readings r ON r.nozzle_id = n.id
      LEFT JOIN shifts s ON r.shift_id = s.id AND s.business_date = ? AND s.status = 'POSTED'
      GROUP BY p.id, p.code, p.name, p.current_price_paise
    `).all(date);

    // 2. Tender Collection Summary
    const tenderSummary = db.prepare(`
      SELECT 
        COALESCE(SUM(t.cash_actual_paise), 0) as total_cash_paise,
        COALESCE(SUM(t.cash_expected_paise), 0) as total_expected_cash_paise,
        COALESCE(SUM(t.cash_variance_paise), 0) as total_variance_paise,
        COALESCE(SUM(t.upi_amount_paise), 0) as total_upi_paise,
        COALESCE(SUM(t.card_amount_paise), 0) as total_card_paise,
        COALESCE(SUM(t.credit_sales_amount_paise), 0) as total_credit_paise,
        COALESCE(SUM(t.expense_from_cash_paise), 0) as total_expense_paise
      FROM shift_tenders t
      JOIN shifts s ON t.shift_id = s.id
      WHERE s.business_date = ? AND s.status = 'POSTED'
    `).get(date) as any;

    // 3. Tank Stocks & Physical Dip Variances
    const tanks = db.prepare(`
      SELECT t.*, p.name as product_name, p.code as product_code
      FROM tanks t
      JOIN products p ON t.product_id = p.id
      ORDER BY t.tank_number
    `).all() as any[];

    const tankVariances = tanks.map((t) => ({
      ...t,
      variance: StockLedgerEngine.calculateVariance(t.current_dip_litres, t.current_book_litres),
    }));

    // 4. Khata Outstanding
    const totalKhataOutstanding = db.prepare(`
      SELECT COALESCE(SUM(current_balance_paise), 0) as total_outstanding_paise FROM parties
    `).get() as any;

    // 5. Total Gross Revenue
    const totalRevenuePaise = (salesByProduct as any[]).reduce((acc, p) => acc + p.total_amount_paise, 0);
    const totalLitres = (salesByProduct as any[]).reduce((acc, p) => acc + p.total_litres, 0);

    res.json({
      business_date: date,
      outlet_name: 'SK Petroleum (Indian Oil), Gadhiya',
      total_litres: Math.round(totalLitres * 100) / 100,
      total_revenue_paise: totalRevenuePaise,
      sales_by_product: salesByProduct,
      tenders: tenderSummary,
      tanks: tankVariances,
      khata_outstanding_paise: totalKhataOutstanding.total_outstanding_paise,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
