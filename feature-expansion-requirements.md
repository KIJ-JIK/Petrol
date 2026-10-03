# Feature Expansion Requirements — Existing Petrol Pump App

## 1. Scope

This document extends the existing application to cover capabilities visible in the supplied PumpOne screenshots. It does not replace the original product, architecture, or current working modules.

Each feature should be implemented only after Antigravity checks whether an equivalent module already exists and whether it works end to end.

Priority labels:
- P0: required foundation or daily operations
- P1: important operating/finance expansion
- P2: useful extension after core workflows

## 2. Pump master settings — P0

### 2.1 Outlet, tank and product masters

Support:
- Outlet/site and company records.
- Fuel product/grade (e.g., petrol/MS, diesel/HSD, premium products; optional CNG/LPG/EV where in scope).
- Tank master: identifier, product, nominal capacity, status, outlet and dip chart assignment.
- Nozzle/dispenser master: identifier, product, tank association, meter unit, assigned outlet, active/inactive status.
- Staff and shift assignment relationships.
- Unit master for litres, millimetres, packaged quantities and other supported measures.
- Effective-dated tax type and accounting mapping, reviewed per jurisdiction/product.

Validation:
- Nozzle product must match a valid configured product.
- Tank-to-nozzle mapping must be explicit; do not infer silently.
- Retiring a tank/nozzle must preserve its historical records.
- Master edits are audited with actor, time, old/new values and reason.
- Deactivation is preferred to deletion for records referenced by transactions.

### 2.2 Dip master and dip chart — P0

- Store tank-specific dip chart versions.
- Each chart version has source, effective dates, unit, increments and conversion values.
- A dip reading must link to the tank and chart version used.
- Show measured depth, calculated volume, time, operator and evidence/notes.
- Preserve old charts so historical readings retain their original conversion.
- Validation must reject readings outside configured physical range, but allow a permissioned exception with a reason.
- Provide a chart import/review flow if bulk setup is supported.
- Never apply one tank’s chart to another tank by default.

### 2.3 Nozzle reading controls — P0

- Record opening/closing totalizer readings per nozzle and shift.
- Calculate sale quantity from configured reading rules.
- Support meter rollover/reset/replacement only through an exception flow:
  - exception type
  - prior and new meter reference
  - reason
  - evidence where available
  - manager approval
- “Reset nozzle reading” means register a new meter baseline/version. It must not rewrite historical readings.
- “Open/stop nozzle” should update software operational status only. Do not imply hardware actuation.
- Preserve readings submitted offline with device time, server time and sync state.

### 2.4 Price/rate history — P0

- Effective-dated price per outlet and product.
- Source/reason, entered by and approved by.
- Historical transactions preserve price/rate version used.
- Support scheduled effective time with approval.
- Do not scrape or invent retail prices.
- Customer contract/discount rates are separately versioned and may have a validity period.

## 3. Inventory and sales management — P0/P1

### 3.1 Fuel purchase and delivery entry — P0

Capture:
- Supplier/OMC, purchase invoice number/date and outlet.
- Product and tank destination.
- Tanker/trip/compartment reference where available.
- Quantity according to invoice and quantity received.
- Opening/closing dip and delivery timestamps.
- Optional seal, density, temperature, quality sample and evidence fields.
- Difference between invoice, observed tank change and accepted receipt.
- Approval and discrepancy reason.

Posting:
- Approved receipt creates exactly one fuel stock movement.
- If integrated to accounting, create supplier payable according to configured mapping.
- Corrections reverse or adjust; do not delete a posted purchase.

### 3.2 Fuel stock and tankwise details — P0

- Maintain tankwise stock ledger.
- Show opening balance, receipts, nozzle sales, approved adjustments and closing book balance.
- Compare book stock with physical dip volume.
- Report quantity and value views separately.
- Track minimum/maximum or reorder levels by tank/product.
- Show historical stock at a selected date.
- Distinguish “calculated book stock” from “observed dip stock”.
- Do not describe stock as real time if input is manual or stale.

Core formula:
`book closing stock = book opening stock + posted receipts - nozzle sales ± approved stock movements`

The observed physical volume is recorded separately. Variance is:
`physical variance = observed dip volume - book closing stock`

### 3.3 Lubricants/packaged products — P1

- Product/SKU, brand, pack size, barcode, purchase unit, sale unit, tax mapping and reorder threshold.
- Purchase, sale, return, damage, transfer and stock count movement.
- Stock quantity and valuation reports.
- Counter billing with tender split.
- Separate lube accounting/inventory from liquid-fuel litres and tanks.
- Maintain purchase and sale registers.

### 3.4 Sale registers and details — P0

- Daily sale register by product, nozzle, shift and payment method.
- Shift-wise, salesman/attendant-wise and nozzle-wise views.
- Dip/tankwise operational view with clear explanation of how sales are mapped to tanks.
- Slip-wise entry or import where current system supports it.
- Sales detail must link to source shift, readings, party/vehicle, price and receipt/tender.
- Report filters include outlet, date range, product, shift, nozzle and operator.

### 3.5 Fuel sampling, density history and stock inspection — P1

Record:
- Product, tank/nozzle/source, sample date/time, temperature/density value and unit.
- Sampling method and result/observation.
- Person taking sample, reviewer and evidence/notes.
- Calibration/test equipment reference where relevant.
- Inspection and follow-up status.
- Alerts for missing/overdue records based on outlet-configured schedule.

These are operational evidence records. Software must not claim to certify fuel quality or calibrate a dispenser. Applicable OMC and Legal Metrology requirements must be confirmed by the outlet.

### 3.6 Evaporation and other stock adjustments — P1

Provide stock adjustment categories such as:
- Approved operational evaporation/shrinkage adjustment.
- Measurement correction.
- Damage/contamination.
- Transfer.
- Other with explanation.

Every adjustment requires:
- tank/product
- quantity and unit
- reason/category
- date/time
- source measurement/evidence where available
- user and approver
- linked variance/incident
- audit event

Do not auto-post evaporation to make a stock reconciliation balance. Do not provide a hidden balancing feature.

### 3.7 Quick dip check — P1

A fast mobile flow:
1. Select outlet and tank.
2. Confirm tank/product.
3. Enter dip measurement and time.
4. Select applicable chart version automatically and show it to the user.
5. Show converted volume and current book balance.
6. Flag variance with drill-through.
7. Save as draft or submit for review according to policy.

It must be clearly marked as an operational check, not a certified inspection.

## 4. Credit, periodic billing and customer/vehicle accounts — P0/P1

### 4.1 Short-term credit — P0

- Party account with credit limit and optional system-level maximum.
- Credit terms and due date.
- Vehicle and driver association where relevant.
- Sale records identify customer, vehicle, shift, product, litres, rate, amount and slip/reference.
- Prevent or warn on limit/overdue breach based on role policy.
- Permit authorized override with reason and audit record.
- Record collections and allocate them to specific outstanding bills.
- Bill-by-bill outstanding and customer/vehicle ledgers.

### 4.2 Periodic billing — P1

Support weekly, fortnightly, monthly or custom cycles:
- Select account and billing period.
- Include eligible, unbilled credit transactions.
- Allow consolidated billing by date, vehicle, or one bill per vehicle as configured.
- Preview included transactions and totals before issue.
- Prevent duplicate billing with transaction-level bill status.
- Issue invoice/memo and update receivable exactly once.
- Reprint, email or message a statement/invoice through configured channels.
- Credit/debit notes and reversals are separate records.
- Preserve the line-level transaction list for disputes.

### 4.3 Counter billing — P1

- Counter sale for fuel, lubes or other products, as applicable.
- Search/select customer, vehicle and product.
- Price, quantity, discount, tax category and tender split.
- Print or download receipt/bill.
- Credit counter sale requires party selection and limit checks.
- Tax/invoice treatment must be configured per product and jurisdiction; do not label every pump transaction a GST invoice.

### 4.4 Petro/fleet/swipe card sales — P1

- Record provider/card scheme, transaction reference, outlet, shift, product, amount and settlement status.
- Provider/card receipts are tender types, not duplicate sales.
- Reconcile provider summary to bank settlement.
- Handle fee, reversal, delayed settlement and unmatched reference.
- Store tokens/references only; do not store sensitive payment credentials.

## 5. Accounts and finance — P1

### 5.1 Ledgers and account groups

- Account group hierarchy and chart of accounts.
- Opening balances with date/source/approval.
- Customer, supplier, employee, bank, cash and general ledger accounts.
- Ledger statements and party/vehicle views.
- Credit limits and account status.
- Do not silently backdate or change a posted balance.

### 5.2 Vouchers and books

- Receipt, payment, journal, contra, purchase, sales and credit/debit note vouchers as relevant.
- Daily cash book, bank book and journal book.
- Voucher numbering and financial year.
- Attach supporting document.
- Maker-checker approval for configurable voucher types/amount thresholds.
- Balanced journal validation before posting.

### 5.3 Receivables/payables and outstanding clearance

- Bill-by-bill customer and supplier outstanding.
- Payment/receipt allocation to one or more invoices.
- Partial payment and advance handling.
- Ageing report and due-date reminders.
- Customer/supplier statement reconciliation.
- Interest calculation should be opt-in, contract-based, configurable, reproducible and reviewed for applicable law. Default is no automatic interest posting.

### 5.4 Financial statements and MIS

- Trial balance by ledger and account group.
- Trading account, profit and loss, balance sheet and cash flow.
- Sales summaries and expense register.
- Stock valuation with valuation method shown.
- Party/vehicle ledger reports.
- TDS report only where the business configuration and professional review confirm it is applicable.
- “VAT/GST report” should be a configurable tax reporting group, not an assumption that petrol/diesel sales use GST.

### 5.5 Bank reconciliation

- Import bank statement (CSV/XLSX or verified provider connection).
- Preserve original statement lines and import source.
- Match by reference, date, amount and configured rules.
- Human review for ambiguous matches.
- Track unmatched, partial, fee, reversal and duplicate lines.
- Reconciliation never changes original shift tender records.
- Export reconciliation results and audit decisions.

## 6. HR and payroll — P1

### 6.1 Employee management

- Profile, role, outlet, employment dates, salary basis, contact details and relevant documents.
- Keep sensitive fields restricted and minimize personal data.
- Employee account/ledger opening balance with source and approval.

### 6.2 Shifts, attendance, leave and overtime

- Multiple shift definitions and staff assignments.
- Attendance in/out, absence, leave, overtime and correction.
- Attendance register and reports.
- Attendance corrections require reason/approval.
- Do not assume legal overtime calculations; make policy configurable and reviewed for applicable state/employment rules.

### 6.3 Salary, loans and payslips

- Salary register and payroll run by pay period.
- Earnings, overtime, incentives, deductions, loan/advance recovery.
- Employee loan/advance ledger and outstanding balance.
- Payslip generation and secure employee access/export.
- Payroll approval, locked posting and reversal process.
- Payroll reports and MIS.

## 7. SMS and email — P1

Supported use cases:
- Welcome/account setup message.
- Credit sale/receipt confirmation.
- Statement/invoice availability.
- Payment reminder.
- Internal alerts to authorized staff.
- Birthday/anniversary marketing only as optional, consent-controlled messaging.

Requirements:
- Configurable templates with variables, language and channel.
- Delivery status, provider reference, retry and failure handling.
- User consent/preferences and opt-out history where applicable.
- Transactional/service communications separated from promotional campaigns.
- SMS bulk sending must use a compliant provider and meet applicable TRAI/TCCCPR sender, header, template and consent requirements.
- Do not send messages merely because a phone number exists in a party record.
- Email statements should use expiring links or protected attachments where personal/financial data is present.

## 8. Admin panel and access — P0

- Company/tenant and outlet management.
- User creation, deactivation, password/session reset workflows as supported by identity layer.
- Form/module-specific permissions for view, add, edit, approve, print, export and post.
- Outlet scope per user.
- Approval permissions separate from data-entry permissions.
- Audit search and user login/session history where supported.
- Backup status and restore administration.
- Configuration of roles, approval thresholds, message providers, financial year and numbering.
- Admin actions cannot bypass ledger invariants or erase audit data.