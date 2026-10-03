# Operating Workflows

## 1. Shift lifecycle

### Open

1. Manager selects outlet and shift.
2. System suggests prior approved closing meter readings.
3. Manager confirms readings, staff and assigned nozzles.
4. System loads the price book effective for the shift.
5. Shift becomes open; all opening values are timestamped and attributable.

### During shift

- Attendant enters sales and tender activity using supported workflow.
- Record credit customer and vehicle when applicable.
- Record cash drops, refunds, expenses or adjustments with a reason.
- Capture evidence as required by outlet policy.
- Preserve draft/offline changes locally until acknowledged by the server.

### Close

1. Attendant enters closing readings for assigned nozzles.
2. System calculates litres from opening/closing readings.
3. System calculates sales amount using configured price and rounding.
4. Attendant enters tender totals and denomination count.
5. System compares expected sales value with total tender/credit.
6. Required dip readings are entered or marked as not due with explanation.
7. System presents variances with drill-through to source inputs.
8. Attendant submits close.
9. Manager resolves or annotates exceptions, then approves or returns for correction.
10. On approval, the system posts stock and ledger effects exactly once.
11. Later bank settlement matching does not silently reopen the shift.

### Exception handling

- Missing meter reading: block final approval unless a privileged override is recorded.
- Meter rollover/reset: require selected exception type and starting/ending values.
- Cash shortage/overage: require explanation; optionally escalate by threshold.
- Stock mismatch: create investigation item linked to dip, sales and deliveries.
- Correction after approval: create reversal/adjustment record, preserve prior version and approver.

## 2. Delivery receipt

1. Create expected delivery or purchase record.
2. Enter supplier/OMC, invoice, tanker, compartment and product details.
3. Record opening dip and time.
4. Record unloading notes, relevant seal references and quality/density checks.
5. Record closing dip after unloading.
6. Compare invoice quantity, quantity received and tank-volume change.
7. Manager reviews any discrepancy.
8. Approval posts stock receipt and supplier payable once.
9. Later supplier statement matching marks invoice as matched, disputed or partially settled.

## 3. Credit sale and payment

1. Select customer/party and optional authorized vehicle/driver.
2. Check credit terms, limit and overdue policy.
3. Record product, litres, price, amount and originating shift.
4. Post receivable and show the updated party balance.
5. Record later receipt as cash, bank, UPI or other supported method.
6. Allocate receipt to one or more invoices or leave as advance.
7. Generate statement and ageing.
8. Record disputed amount separately; do not erase the sale.

## 4. Fuel price update

1. User with permission drafts outlet/product price and effective time.
2. Enter source, reason and supporting note.
3. System previews affected products and any customer agreements.
4. Authorized user approves.
5. New price becomes active at effective time.
6. Historical shifts retain the price version used at the time.
7. If integration to dispenser or display hardware exists, send only through validated interface and show delivery/acknowledgement state.

## 5. Bank/digital reconciliation

1. Import provider or bank file.
2. Validate format, date range, account and duplicate file.
3. Parse transaction rows into a review queue.
4. Match by reference, amount, date and configured tolerances.
5. Surface unmatched, fee-adjusted, reversed and partial settlements.
6. Accountant confirms matches.
7. Post settlement fees or bank entries using configured accounting rules.
8. Preserve original file and matching decision audit.

## 6. Staff advance and payroll

1. Record advance request, amount, reason and approver.
2. Disbursement creates staff receivable/advance ledger entry.
3. Payroll run includes approved salary, deductions and agreed recovery.
4. Employee ledger shows opening balance, advances, recoveries and closing balance.
5. Restrict payslip and salary data by role.

## 7. Lubricant/store inventory

1. Receive supplier purchase and quantities.
2. Post stock to outlet/store location.
3. Sell by SKU through counter sale and tender flow.
4. Handle return, damage, transfer and count adjustment as separate stock movements.
5. Show reorder and stock ageing report.