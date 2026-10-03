# Petrol Pump App — End-to-End Workflows

## Purpose

This document defines how users move through the petrol pump system. It extends the existing app; it does not authorize rebuilding or replacing its architecture.

Before implementing a workflow, inspect the current code and connect it to existing modules, permissions, and data. Do not create duplicate screens or records when an equivalent feature already exists.

## Shared workflow rules

- Every record belongs to a company and, where applicable, an outlet.
- Every operational transaction has an actor, timestamp, status, and source reference.
- Use outlet-local business dates while storing timestamps consistently.
- Financial and operational records move through explicit states, such as `Draft`, `Submitted`, `Approved`, `Posted`, `Reversed`, or `Cancelled`.
- Posted readings, sales, stock movements, bills, receipts, payroll runs, and journal entries are not silently edited or deleted. Correct them through a reasoned reversal or adjustment.
- Sensitive actions require server-side permission checks and audit events.
- Retries and offline sync must not duplicate transactions or postings.
- When inputs conflict, put the record in a review state. Never silently overwrite meter readings, money, or approvals.
- Each report or total should link back to its source records.
- A software workflow must not claim to certify a measurement, approve statutory compliance, or control physical pump equipment unless a verified and authorized integration exists.

---

## 1. Master setup workflows

### 1.1 Company and outlet setup

1. Authorized administrator creates or selects a company.
2. Administrator adds an outlet, address, timezone, business-day convention, financial year, and required operational settings.
3. Administrator assigns users and outlet-level roles.
4. System records who created or changed the setup.
5. Changes affecting historical calculations are effective-dated; old transactions retain their original settings.

### 1.2 Product, unit, tax, and account setup

1. Administrator creates product groups and products: fuel grades, lubricants, and other counter items.
2. Administrator sets sale/purchase units and any permitted conversions.
3. Administrator assigns accounting mappings and a configurable tax category.
4. Administrator records the effective date and source for tax/accounting configuration.
5. Accountant reviews tax and ledger mappings before live billing.
6. Product changes do not rewrite historical invoices or sales.

**Tax rule:** The system must not assume all fuel transactions use GST. Tax categories and invoice labels depend on product, jurisdiction, transaction, and current rules. Use reviewed configuration.

### 1.3 Tank, dip chart, dispenser, and nozzle setup

1. Create a tank with outlet, identifier, product, capacity, and active status.
2. Add a tank-specific dip chart version, including units, conversion data, source, and effective dates.
3. Create dispensers and nozzles; map each nozzle to its product and appropriate tank.
4. Record meter unit, expected rollover limit, active status, and any meter identifier.
5. Validate mappings and prevent accidental reuse of a chart from another tank.
6. Deactivated tanks/nozzles remain visible in historical reports.
7. Master changes generate audit events.

### 1.4 Employee, party, supplier, and vehicle setup

1. Create employees with role, outlet assignment, employment status, and payroll basis as permitted.
2. Create customer/party accounts with terms, contact preferences, credit status, and limit.
3. Add vehicles to parties where vehicle-wise credit or billing is required.
4. Create suppliers and OMC/vendor accounts with payment terms and statement references.
5. Set opening balances only with date, source, review, and approval.
6. Do not collect unnecessary personal data.

### 1.5 Role and approval setup

1. Administrator assigns a role and outlet scope to each user.
2. Permissions are assigned per action: view, create, edit draft, submit, approve, post, reverse, print, export, or configure.
3. Sensitive actions have maker-checker separation where configured.
4. A user cannot approve their own transaction if separation of duties is required.
5. Permission changes are audited and take effect server-side.

---

## 2. Price update workflow

1. Authorized user drafts an outlet/product price with an effective date and time.
2. User enters source and reason.
3. System previews affected products and customer agreements.
4. Authorized approver reviews and approves or rejects the change.
5. On approval, the new price becomes active at its effective time.
6. Sales and bills retain the exact price version used.
7. If supported hardware integration exists, the system sends the change through that adapter and shows delivery/acknowledgment status.
8. If no verified integration exists, the app records the price for software calculations only and does not claim to change the physical dispenser or display.

---

## 3. Shift and nozzle-reading workflow

### 3.1 Open shift

1. Manager selects outlet, business date, shift, and assigned staff.
2. System shows the prior approved closing reading for each assigned nozzle as a suggested opening reading.
3. Manager confirms or enters opening values.
4. If a value differs from the previous close, the system requires an exception type, reason, and authorization.
5. The shift records its price policy and assigned nozzles.
6. The shift status becomes `Open`.

### 3.2 Record shift activity

1. Attendant records the relevant sales, payment methods, credit slips, cash drops, and counter sales using the current app’s supported flow.
2. Customer-credit transactions include party and, when configured, vehicle and driver.
3. Refunds, voids, or corrections require a reason and appropriate permission.
4. Records captured offline show a pending-sync state and preserve device time and server receipt time.
5. If synced data conflicts with a newer or approved record, create a review task.

### 3.3 Close shift

1. Attendant enters closing totalizer readings for each assigned nozzle.
2. System calculates litres sold using the configured meter rule.
3. If rollover, reset, or replacement is involved, require the exception workflow rather than accepting an unexplained negative or implausible result.
4. System calculates sales amount using the correct effective price version and configured rounding.
5. Attendant records tender totals, cash count/denominations, deposits/drops, card/petro-card slips, and credit sales.
6. If dip readings are due, record them in the tank workflow and attach them to the relevant outlet/date/shift.
7. System compares expected sales value with entered tender and credit totals.
8. System shows differences, missing inputs, source links, and configurable warnings.
9. Attendant submits the close.
10. Manager approves, returns it for correction, or records an authorized exception with a reason.
11. On approval, the shift is locked against ordinary editing and postings occur once.
12. Later bank settlement matching does not silently reopen the shift.

### 3.4 Nozzle reading reset or meter replacement

1. Authorized user selects nozzle and effective date/time.
2. User records old meter identifier/last value and new meter identifier/baseline.
3. User selects reset/replacement reason and attaches evidence where available.
4. Manager approves.
5. System starts a new meter-reading sequence while preserving the old sequence and all historic readings.
6. “Reset” must never mean deleting or rewriting previously posted readings.

### 3.5 Open/stop nozzle or tank status

1. Authorized manager changes the software status to active, inactive, under maintenance, or unavailable.
2. User enters reason, time, and optional maintenance reference.
3. System warns if open shifts or pending transactions depend on the asset.
4. Change is audited.
5. This changes software records only. It does not physically open, stop, or control equipment without an explicitly verified integration.

---

## 4. Dip, quick dip, density, sampling, and inspection workflows

### 4.1 Scheduled dip reading

1. User selects outlet and tank.
2. System displays tank product, capacity, current chart version, last dip, and expected book stock.
3. User enters measured depth, unit, time, and operator.
4. System converts depth using the selected tank-specific chart and displays the calculated volume.
5. User confirms the value and adds notes/evidence if needed.
6. System compares observed volume with book stock and shows the variance.
7. Reading is saved as draft or submitted according to outlet policy.
8. Manager reviews any configured threshold breach.
9. Approved reading becomes the official operational observation; it does not overwrite book stock.

### 4.2 Quick dip check

1. User launches Quick Dip Check.
2. Selects tank or scans/chooses tank identifier.
3. Confirms product and chart version.
4. Enters dip value and measurement time.
5. System immediately displays converted volume, current book stock, and variance.
6. User saves as an operational check or submits for manager review.
7. The result is clearly identified as a manual check and not a certified inspection.

### 4.3 Density history and fuel sampling

1. User starts a sample/quality record for product, tank/nozzle/source, outlet, and time.
2. User records measurement, unit, method, equipment reference, operator, and notes.
3. User attaches evidence where applicable.
4. Reviewer checks the record and records follow-up action if needed.
5. System maintains a history by product, tank, date, and outlet.
6. If a configured record is overdue or missing, alert authorized users.
7. The app stores operational evidence; it does not certify the product’s quality or instrument calibration.

### 4.4 Stock inspection and density calculation

1. System combines posted opening stock, receipts, nozzle sales, and approved adjustments to calculate book stock.
2. It displays physical dip volume separately.
3. It displays the configured density/temperature context only when those values are actually supplied.
4. User reviews variance and links to source entries.
5. Any correction is a separately approved stock movement; no automatic balancing is allowed.

---

## 5. Fuel purchase and tanker trip workflow

### 5.1 Purchase/delivery entry

1. Create expected delivery with supplier/OMC, purchase order or invoice reference, product, outlet, and expected quantity.
2. Enter tanker/trip and compartment details where available.
3. Record invoice quantity, invoice date, delivery date, and intended tank.
4. Record pre-unloading dip and time.
5. Record unloading observations, optional seal references, sampling/density notes, and any incident.
6. Record post-unloading dip and time.
7. System compares:
   - invoice quantity
   - accepted quantity
   - tank-volume change
   - configured measurement context
8. Discrepancy is highlighted with source values; user cannot hide the difference by changing the invoice quantity without audit.
9. Manager approves receipt, partial receipt, or dispute.
10. Approved receipt creates one stock movement and, if enabled, one supplier payable.
11. Supplier statement reconciliation is a later separate workflow.

### 5.2 Tanker trip entry

1. Create trip linked to delivery, tanker, supplier, driver, and compartment where known.
2. Record route/departure/arrival timestamps where relevant.
3. Link invoice, seal, and supporting documents.
4. Record unloading status and any variance or incident.
5. Approve and close the trip.
6. Do not infer quantity or quality from trip metadata alone.

---

## 6. Fuel and lube inventory workflows

### 6.1 Fuel stock ledger

For each tank and product, display:
- Opening book quantity.
- Posted receipts.
- Nozzle sales.
- Approved adjustments/transfers.
- Calculated closing book quantity.
- Latest observed dip quantity and timestamp.
- Variance between observed and calculated quantities.

Formula:
`book closing stock = opening book stock + posted receipts - nozzle sales ± approved stock movements`

The observed dip remains a distinct measurement.

### 6.2 Evaporation or shrinkage entry

1. Authorized user selects tank/product/date and adjustment category.
2. User enters quantity, unit, reason, and supporting evidence/measurement context.
3. User links the adjustment to a stock variance or incident.
4. System shows resulting stock and financial effect before submission.
5. Manager/owner approves according to threshold.
6. Approved adjustment creates a new stock movement and required accounting entry.
7. Audit log preserves requester, approver, reason, old calculation and new movement.
8. The system must not auto-suggest an amount just to eliminate unexplained loss, nor allow hidden edits.

### 6.3 Lubricant/store purchase

1. Select supplier and purchase invoice.
2. Enter SKU, quantity, unit cost, tax mapping, discount and destination stock location.
3. Attach invoice evidence.
4. Review and approve purchase.
5. Posting increases item stock and creates payable/accounting impact as configured.

### 6.4 Lubricant/store sale and adjustment

1. Select SKU, quantity and price.
2. Record discount and tender split.
3. Print/share receipt if configured.
4. Update item stock and sales record once.
5. Returns, damage, transfers and stock counts are separate movement types with reason and approval.
6. Stock valuation uses configured method and displays that method in reports.

---

## 7. Customer credit and periodic billing workflows

### 7.1 Short-term credit sale

1. Select customer/party and optional vehicle/driver.
2. System checks account status, credit limit, overdue policy, and permitted products.
3. User records product, quantity, price, shift/slip, date/time and reference.
4. If limit is exceeded, system blocks or requests authorized override according to policy.
5. Override requires reason, approver and audit event.
6. Approved credit sale creates receivable once and links to the shift.
7. Customer statement reflects the transaction.

### 7.2 Customer receipt and outstanding clearance

1. Select customer and receipt method.
2. Enter amount, date, reference and receiving account.
3. Allocate receipt to one or more bills or record it as advance.
4. System updates bill-wise outstanding.
5. If receipt exceeds balance, show remaining advance/credit.
6. Reversal requires permission and reason; preserve original receipt and allocations.

### 7.3 Periodic billing

1. Select customer, billing cycle (weekly, fortnightly, monthly, or configured period), and cutoff date.
2. System lists eligible unbilled credit slips.
3. Choose consolidation rule: date-wise, vehicle-wise, one bill per vehicle, or separate bills as configured.
4. Preview transaction lines, rates, quantities, taxes and total.
5. Validate that no transaction was already billed or reversed.
6. Authorized user approves and generates bills.
7. Each source slip becomes linked to the generated bill exactly once.
8. Print/download/email the bill or statement using configured channel.
9. Subsequent correction uses a credit/debit note or reversal; never silently regenerate and duplicate.

### 7.4 Cash and credit memo printing

1. Select an approved bill or counter transaction.
2. Choose the permitted memo/template type.
3. Render company/outlet, customer, transaction lines, payment/credit status and document number.
4. Printed copy is marked original/duplicate/reprint according to configuration.
5. Reprints are logged.
6. Invoice/tax wording must come from reviewed configuration.

### 7.5 Customer and vehicle statements

1. Select customer, vehicle (optional), outlet and date range.
2. Display opening, charges, receipts, credits/adjustments and closing balance.
3. Allow drill-down to slips and bills.
4. Export or send statement only to users authorized for the account.
5. Record delivery status and channel.

---

## 8. Petro-card, card and bank reconciliation workflow

1. Record card/petro-card tender with provider, transaction reference, amount, shift, and settlement status.
2. Import provider settlement file or bank statement.
3. Detect duplicate source file/transaction using checksum and references.
4. Match exact references first, then configured matching rules.
5. Put partial, fee-adjusted, reversed or ambiguous matches into review.
6. Accountant confirms or rejects proposed matches.
7. Record settlement fees and bank credits separately from original sales.
8. Close reconciliation period and retain the source file and decisions.
9. Reconciliation must not rewrite shift sales or tender totals.

---

## 9. Accounting and finance workflows

### 9.1 Opening account balances

1. Accountant creates customer, supplier, employee, bank, cash, or ledger account.
2. Enter opening balance, effective date, source and supporting document.
3. Review and approve.
4. System creates the opening journal entry.
5. Later changes use adjustment entries, not direct balance editing.

### 9.2 Voucher and journal workflow

1. Select voucher type: receipt, payment, journal, contra, purchase, sales, or credit/debit note as supported.
2. Select party/accounts, outlet, date and amount.
3. Attach evidence and enter narration/reference.
4. System validates debit-credit equality and required account mappings.
5. User submits for approval if required.
6. Approver posts; system assigns voucher number and posts once.
7. Reversal creates linked reversal entry and preserves original.

### 9.3 Receipt/payment report and payable/receivable

1. Filter by outlet, account, party, date, method and status.
2. Display opening, transaction, allocation and closing balance.
3. Allow drill-through to source invoice/voucher/receipt.
4. Export is permission-checked and audit logged.

### 9.4 Interest calculation

1. Accountant selects a party, agreement, date range and approved calculation rule.
2. System previews principal, period, basis, rate and calculated interest.
3. User checks contract terms and applicable rules.
4. Authorized accountant approves.
5. System posts interest only as a distinct voucher linked to the calculation.
6. Default behavior is no automatic interest charge.
7. Every calculation must be reproducible from stored inputs and rule version.

### 9.5 Financial reports

- Trial balance by ledger/group.
- Bank/cash book.
- Trading and P&L reports.
- Balance sheet and cash flow.
- Sales summary and stock valuation.
- TDS/tax reports only where configured and professionally reviewed.
- Reports must show outlet, date period, accounting basis/status and generation time.
- Exports must include filters and preserve permissions.

### 9.6 Bank reconciliation

1. Import statement file or approved provider feed.
2. Preview parsed account/date/amount/reference before acceptance.
3. Reject invalid rows and identify duplicates.
4. Propose matches to receipts, payments, card/UPI settlements and deposits.
5. Accountant resolves unmatched/partial/fee/reversal cases.
6. Post approved bank-side adjustment/fees through voucher flow.
7. Mark statement period reconciled and retain evidence.
8. Do not modify original sales or receipts to force a match.

---

## 10. HR, attendance, salary, leave and employee advances

### 10.1 Multiple shifts and attendance

1. Configure shift schedules.
2. Assign employees to outlet and shift.
3. Record attendance start/end and breaks if used.
4. Record absence, leave, overtime or manual correction with reason.
5. Supervisor reviews exceptions.
6. Attendance register and reports use approved entries.
7. Do not assume a statutory overtime formula; use reviewed outlet policy.

### 10.2 Leave workflow

1. Employee or authorized supervisor submits leave request with dates/type.
2. Manager approves, rejects or requests correction.
3. Approved leave updates attendance/payroll inputs.
4. Leave balances follow configured policy and can be corrected only with audit trail.

### 10.3 Employee loan or advance

1. Record request, amount, date, terms and purpose.
2. Authorized manager/owner approves.
3. Disbursement creates employee receivable/advance ledger record.
4. Record repayments or payroll deductions as separate allocations.
5. Show outstanding employee balance and statement.
6. Do not combine employee advances with customer credit or supplier borrowing.

### 10.4 Payroll run and payslip

1. Select outlet/company and pay period.
2. Load approved attendance, salary terms, overtime and prior approved adjustments.
3. Calculate earnings, deductions, advances/loan recovery and net pay using configured policy.
4. Preview employee-wise payroll register.
5. Payroll approver reviews and locks the run.
6. Posting creates salary expense/payable and employee ledger impact according to configuration.
7. Generate payslips with restricted access.
8. Corrections after posting use reversal/adjustment payroll run.

---

## 11. SMS and email workflow

### 11.1 Message setup

1. Administrator configures provider, sender identity, templates, language, variables and intended purpose.
2. Register/store relevant consent or preference state where applicable.
3. Test template using sample data.
4. Do not activate a campaign until provider configuration and applicable compliance steps are complete.

### 11.2 Transaction/service message

Possible triggers:
- Customer account welcome.
- Credit sale or receipt confirmation.
- Bill/statement availability.
- Payment reminder.
- Internal shift-close alert.
- Supplier statement or payment notice.

Flow:
1. Business event commits successfully.
2. Notification job is queued; failure cannot roll back the business event.
3. Job checks recipient, channel, template, consent/purpose and opt-out rules.
4. Provider sends message.
5. Store provider reference, status, attempt count and failure reason.
6. Retry temporary failures safely without duplicate business transaction.

### 11.3 Birthday, anniversary and pollution reminders

- Treat as optional communications, not automatic defaults.
- Configure purpose, data source, audience, template, channel and schedule.
- Ensure applicable consent/preferences and legal basis are respected.
- Allow opt-out and retain the opt-out.
- Avoid collecting personal or vehicle-related dates unless necessary and authorized.

### 11.4 Statement email

1. Generate statement from approved records.
2. Check recipient and permission.
3. Send protected attachment or expiring link where appropriate.
4. Record send result and allow controlled resend.
5. Resending does not create a new invoice or alter balances.

---

## 12. Admin, user access and backup workflows

### 12.1 User administration

1. Authorized admin creates user and assigns company/outlet scope.
2. Assign role permissions per module/action.
3. User completes secure sign-in setup.
4. Deactivation revokes active sessions and blocks future access without deleting historical attribution.
5. Permission changes are recorded in audit history.

### 12.2 Form-level access

Configure per user/role:
- View
- Add
- Edit draft
- Submit
- Approve
- Post
- Reverse
- Print
- Export
- Configure

Enforce in API and UI. Hiding a button is not sufficient access control.

### 12.3 Approval/signatory access

1. Administrator assigns which transaction types a user may approve.
2. Configure thresholds and outlet scope.
3. Require maker-checker separation for selected workflows.
4. Approval records actor, timestamp, decision, comments and source version.
5. Reassignment of approver is audited.

### 12.4 Backup and restore

1. System creates scheduled encrypted backup using the existing infrastructure’s supported backup mechanism.
2. Record start/end time, scope, status, location/reference and retention date.
3. Alert admin on failure.
4. Restrict backup download/restore actions to explicitly authorized administrators.
5. Perform restore only into a designated environment with an auditable operator and approval.
6. Never expose credentials or backup files in ordinary user screens.
7. Display last successful backup and latest restore test status; do not claim a backup is valid solely because a job started.

---

## 13. Reports and operational review workflow

1. User selects report, outlet(s), date range, product, shift, party or employee filters.
2. System validates permissions for all selected outlets/data.
3. Report displays data status: draft, approved, posted or reconciled.
4. Summary values link to underlying records.
5. User exports/prints if permitted.
6. Export records actor, filters, timestamp and output type.
7. Reports should include:
   - Shift-wise report
   - Salesman/attendant report
   - Nozzle sales report
   - Dip/tankwise sale and stock view
   - Purchase register
   - Sale register
   - Credit sales and customer/vehicle statements
   - Lube stock and valuation
   - Expense register
   - Attendance and salary reports
   - Bank reconciliation
   - Ledger, trial balance, trading, P&L and balance sheet
   - Tax reports based on reviewed configuration

## 14. End-to-end scenarios for acceptance

### Scenario A: Ordinary shift close
- Open shift, enter readings, reconcile cash/digital/credit, submit and approve.
- Verify litres and amount calculate correctly and postings occur exactly once.

### Scenario B: Meter replacement
- Record new meter baseline without deleting historical readings.
- Verify future sales calculate from the new sequence and history remains intact.

### Scenario C: Delivery discrepancy
- Enter invoice, before/after dip and delivery quantity with a mismatch.
- Verify system flags discrepancy and does not post without required review.

### Scenario D: Quick dip
- Enter dip for the correct tank/chart and compare physical volume with book stock.
- Verify the system does not overwrite book stock.

### Scenario E: Customer periodic bill
- Generate a monthly vehicle-wise bill from eligible unbilled slips.
- Verify every slip is included once, statement balance updates and duplicate generation is blocked.

### Scenario F: Bank settlement
- Import provider/bank lines and match card/UPI settlement.
- Verify fees/reversals are distinct and original sales remain unchanged.

### Scenario G: Staff advance and payroll
- Approve advance, recover part through payroll and verify employee ledger balance.
- Verify restricted payroll access.

### Scenario H: Message failure
- Trigger a permitted credit-sale confirmation with provider unavailable.
- Verify sale persists, notification retries, and the message is not sent twice.

### Scenario I: Role boundary
- Attendant submits a shift but cannot approve own configured exception or view payroll.
- Verify API rejects unauthorized access even if request is made directly.

### Scenario J: Correction after posting
- Reverse/adjust an approved posting with a reason.
- Verify old entry remains visible, linked reversal appears, and reports calculate the corrected net total.