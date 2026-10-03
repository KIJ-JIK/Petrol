# Frontend and UX Guidance

## 1. User surfaces

### Attendant mobile/PWA

Primary tasks:
- See assigned outlet, shift and nozzles.
- Enter opening/closing meter readings.
- Record tender totals, cash count and handover.
- Add credit sale/party and limited operational notes.
- See whether data is saved locally, synced or needs attention.

Design:
- Large touch targets and numeric keypad.
- Minimal typing; camera capture where helpful.
- Single task flow with progress.
- Clear offline banner and last-sync timestamp.
- No access to owner-only finance or payroll data.

### Manager tablet/web

Primary tasks:
- Open and assign shift.
- Review readings, dip, delivery and exceptions.
- Approve or return shift close.
- View day sheet and pending issues.

### Owner dashboard

Primary tasks:
- Review today’s litres, sales, collections, stock and credit outstanding.
- Compare outlets.
- Review approvals and exceptions.
- Drill into the source transactions behind totals.

### Accountant workspace

Primary tasks:
- Match digital/bank settlements.
- Review supplier invoices and statements.
- Inspect ledgers, vouchers and exports.
- Search audit records and correct via controlled reversal workflow.

## 2. Suggested navigation

- Home
- Shift Close
- Sales
- Tanks & Deliveries
- Khata / Parties
- Purchases & Suppliers
- Lubricants / Store
- Staff
- Money & Accounting
- Reports
- Documents & Compliance
- Settings

Show only relevant navigation by role.

## 3. Dashboard cards

Attendant:
- Current shift
- Assigned nozzles
- Readings due
- Sync status

Manager:
- Shifts open
- Closes awaiting approval
- Variances requiring review
- Deliveries today
- Low-stock alerts

Owner:
- Litres and sales today
- Cash expected vs actual
- Digital settlements pending
- Tank stock and variance
- Credit overdue
- Outlet comparison

Accountant:
- Unmatched settlements
- Supplier invoices due
- Credit ageing
- Failed/import jobs
- Journals awaiting review

## 4. Interaction rules

- Keep outlet and business date visible.
- Show exact units: litres, millimetres, ₹, and timestamp.
- Visually distinguish draft, submitted, approved, posted and reversed.
- Explain calculations inline and let users open source readings.
- Use text/icons in addition to color for warning states.
- Corrections require reason and show the effect before posting.
- Confirm irreversible business actions such as shift approval or ledger posting.
- Use language understandable to forecourt staff; provide local-language support after pilot validation.
- Make tables searchable and export filters visible.
- Provide accessible contrast and keyboard support on desktop.

## 5. Shift close screen outline

1. Shift/outlet/date summary.
2. Nozzle table: product, opening reading, closing reading, litres, price, amount.
3. Tender summary: expected, entered, difference by method.
4. Cash denomination entry and deposit/drop fields.
5. Dip readings due with tank, time, dip depth, chart and volume.
6. Reconciliation summary with links to source inputs.
7. Notes/evidence.
8. Submit for approval.
9. Manager view: approve, return with reason, or create controlled exception.