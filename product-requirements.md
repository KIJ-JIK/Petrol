# Product Requirements Document

## 1. Product summary

A petrol pump operations and finance system that replaces disconnected registers and spreadsheets with a reliable record of shifts, fuel stock, credit, payments, staff, expenses and reporting.

### Product outcome

A manager can close a shift and understand:
- How many litres each nozzle sold.
- The value of those sales at the applicable prices.
- How the sale value was collected or left outstanding.
- How the book stock compares with observed tank stock.
- Which discrepancies need explanation or approval.

## 2. Problem statement

Pump operations create separate but related records: nozzle readings, shift slips, tank dips, delivery invoices, cash counts, digital settlements, customer credit, staff advances and accounting vouchers. Manual transfer between records causes delay, duplicated work and unexplained differences.

The product must create a linked audit trail from operational input to owner report while staying usable in low-connectivity conditions.

## 3. Goals

- Reduce shift-close time and same-day closing delays.
- Improve completeness of meter, tender and dip records.
- Identify cash, stock, delivery and settlement discrepancies quickly.
- Make khata balances and collections easy to understand.
- Give owners useful outlet-level and multi-outlet visibility.
- Preserve evidence, approvals and correction history.

## 4. Non-goals for MVP

- Direct control of dispensers or pump calibration.
- Automated legal/tax filing.
- Public price scraping or unverified live price feeds.
- Automated interest charges or lending decisions.
- Full-scale convenience-store ERP.
- AI-generated accounting adjustments without user approval.

## 5. Functional requirements

### A. Outlet configuration

- Configure legal entity, outlet, address, timezone, business-day convention and financial year.
- Configure products/grades, sales units, price history and accounting mappings.
- Configure tanks, capacity, product, dip chart version and optional dead-stock value.
- Configure dispensers, sides, nozzles, meter units and rollover/reset policy.
- Configure shifts, staff assignment, tenders, approval thresholds and report settings.
- Configuration changes are permissioned and audited.

### B. Shift sales

- Open a shift and carry forward approved closing readings as suggested opening readings.
- Record readings by nozzle, attendant and time.
- Calculate litres sold, supporting meter rollover rules and exceptional reset/replacement.
- Use effective-dated product prices; preserve the price and rule used for the calculation.
- Record tender split: cash, UPI, card, fleet/fuel card, coupon, customer credit, other.
- Record refunds, voids, rounding adjustments and cash drops with reason and actor.
- Submit close for approval; block approval if required readings or explanations are missing.
- Show calculated values and formulas before final submission.
- Generate shift summary and daily sales report.

### C. Tender and cash reconciliation

- Calculate expected cash and compare with counted cash.
- Capture cash denomination counts and deposits/drops.
- Record digital transaction totals and provider references.
- Flag unallocated tender, missing settlement, over/short cash and duplicate transaction imports.
- Keep operational close separate from later bank settlement matching.
- Allow authorized discrepancy resolution with a reason and evidence.

### D. Tank and stock

- Maintain a stock movement ledger per tank and product.
- Record delivery expected quantity, invoice quantity, received quantity, tanker/compartment references and supplier.
- Record dip before/after delivery and quality/density notes when required.
- Convert dip measurement to volume using the selected tank chart version.
- Compare book stock with observed stock and display litres, percentage and trend.
- Record approved stock adjustment as a new movement; never overwrite earlier movements.
- Alert on configurable low stock, unexplained variance and delivery discrepancy.

### E. Credit / khata

- Manage parties, contact details, credit limit, payment terms and permitted products.
- Optionally restrict credit by vehicle, driver or customer account.
- Post credit sale against shift or invoice, preserving product, litres, price and party.
- Record receipt, advance, allocation, reversal, credit note and dispute.
- Provide statements and ageing buckets.
- Alert on limit breach and overdue balance.
- Any interest/late fee must be contractually and legally reviewed, configurable and auditable.

### F. Supplier and borrowing records

- Record supplier/OMC invoice, payable, due date, payments and statement reconciliation.
- Track short delivery or invoice disputes separately from standard payable.
- Track loans as separate records: lender, principal, disbursement, schedule, terms, repayments.
- Track owner withdrawal and staff advances independently from sales and supplier payables.

### G. Staff

- Maintain employee, role, outlet assignment, active status and relevant document dates.
- Record shift assignment, attendance, leave, salary/wage, overtime, incentive and advance.
- Produce staff ledger and payslip/export.
- Restrict salary and personal data to authorized roles.
- Audit changes to attendance, pay, advances and access.

### H. Lubricant and store inventory

- Create SKU, barcode, pack size, unit, category, tax mapping and reorder level.
- Record purchase, sale, transfer, return, damage and stock count.
- Support counter sale, invoice/receipt and tender split.
- Report stock on hand, ageing, sales, margin estimate and shrinkage.
- Keep packaged products separate from liquid-fuel volume reconciliation.

### I. Expenses

- Record date, outlet, category, vendor, amount, tax fields, payment method and approver.
- Attach receipt image or invoice reference.
- Support recurring expenses and export to accounting.
- Allow owner-defined approval thresholds.

### J. Reports

- Shift/day sales by product, nozzle, attendant and tender.
- Meter reading history and exceptions.
- Book-vs-dip stock, stock ledger, delivery variance and stock cover.
- Cash expected/actual, deposits, UPI/card/fleet reconciliation.
- Credit balances, ageing, receipts and collection history.
- Supplier balances, expenses, staff ledger and payroll summary.
- Outlet comparisons and consolidated totals when multi-outlet is enabled.
- Export with report filters, generation time, outlet and source-data period.

### K. Audit and documents

- Maintain append-only audit events for sign-in, create, update, approval, posting, correction and export.
- Include actor, timestamp, outlet, record ID, before/after values when appropriate, reason and correlation ID.
- Store evidence documents with access control and download history.
- Provide configurable reminders for renewal, inspection or verification documents.
- Retention periods must be decided with professional advice.

## 6. Roles and permissions

| Capability | Attendant | Manager | Accountant | Owner |
|---|---:|---:|---:|---:|
| Enter own shift readings | Yes | Yes | No | Optional |
| Submit shift close | Yes | Yes | No | Optional |
| Approve own shift | No | Only if policy permits | No | Yes |
| Record delivery/dip | Optional | Yes | Optional | Yes |
| Approve stock adjustment | No | Limited | No | Yes |
| Manage party credit | No | Limited | Yes | Yes |
| Post/reverse ledger | No | No | Yes | Yes |
| Set prices/credit limits | No | Limited | No | Yes |
| View payroll details | No | Limited | Optional | Yes |
| Export audit history | No | Limited | Yes | Yes |

All permissions must also be scoped to assigned outlets.

## 7. MVP acceptance criteria

A pilot outlet can:
1. Configure its products, tanks, dispensers and nozzles.
2. Open a shift using suggested opening meter readings.
3. Enter closing readings and see the calculated litres by nozzle.
4. Reconcile sales to tender split and cash count.
5. Submit a shift and require manager approval for configured exceptions.
6. Record a delivery and related dip measurements without duplicate stock posting.
7. Record a credit sale and later allocate a receipt to that balance.
8. View a daily report and export it.
9. Continue entering records during network interruption and see pending sync state.
10. Trace a posted figure to its source record and see who changed or approved it.

## 8. Success measures

- Median time to close shift.
- Percent of shifts closed on the business day.
- Percent of shifts with unresolved cash variance.
- Percent of required dips and readings completed.
- Time to resolve tank/delivery variance.
- Percent of digital settlements matched within the agreed time.
- Credit ageing and collection time.
- Weekly active outlets and recurring shift usage.
- Offline sync failure rate and support requests per outlet.
- Pilot-to-paid conversion and retention.