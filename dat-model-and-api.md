
## `data-model-and-api.md`

```markdown
# Data Model and API Outline

## 1. Core entity groups

### Organization and configuration

- Tenant
- LegalEntity
- Outlet
- User
- Role
- Permission
- Product
- PriceVersion
- ShiftDefinition
- TenderType

### Forecourt and stock

- Tank
- DipChartVersion
- Dispenser
- Nozzle
- MeterReading
- Shift
- ShiftAssignment
- Tender
- DipReading
- Delivery
- DeliveryCompartment
- StockMovement

### Parties and finance

- Party
- Vehicle
- CreditAgreement
- CreditSale
- Receipt
- ReceiptAllocation
- Supplier
- SupplierInvoice
- Expense
- BankStatementLine
- Settlement
- LedgerAccount
- JournalEntry
- JournalLine
- Loan
- LoanRepayment

### Staff and controls

- Employee
- Attendance
- PayrollRun
- Approval
- AuditEvent
- Document
- IntegrationConnection
- ImportJob
- OutboxEvent

## 2. Important relationships

- Tenant has one or more outlets.
- Outlet owns tanks, dispensers, nozzles, shifts and staff assignments.
- Nozzle belongs to a dispenser and has a configured product.
- Shift contains assignments, meter readings, tenders and close status.
- Meter reading links to nozzle, shift, actor and timestamp.
- Delivery creates stock movement and optionally a supplier payable.
- Credit sale links to party and source shift; receipts allocate against credit sales.
- Every journal entry links back to source domain record and has balanced journal lines.
- Every privileged change links to an audit event and, where required, approval.

## 3. Required invariants

- All business entities include tenant and outlet scope where applicable.
- All authorization checks occur server-side.
- Money uses integer paise or a database decimal type with explicit rounding.
- Quantity precision is explicit by unit/product; retain original reading value.
- Store raw readings, calculated quantities, rule version and calculation time.
- Store UTC timestamps and render them in outlet timezone.
- Prices/configuration are effective-dated; historical calculations retain original version.
- Posted journals are immutable; correction uses reversal/adjustment.
- Every posting/import/sync endpoint is idempotent.
- Stock movements are append-only.
- Do not treat book stock as physical measurement.
- Offline conflicts require review for money, readings and approvals.

## 4. Shift calculation

For a normal meter:
- `litres_sold = closing_totalizer - opening_totalizer`

For a configured rollover:
- `litres_sold = (configured_meter_max - opening_totalizer) + closing_totalizer + rollover_offset`

The calculation must validate:
- Correct nozzle/product association.
- Non-negative result unless an authorized exception applies.
- Expected precision and meter maximum.
- Shift and business date consistency.
- Price version effective for the sale/shift policy.
- Required reason and approval for reset/replacement/override.

The business must choose whether price changes within a shift split sales at transaction time or use the shift’s configured price. Do not hardcode this without discovery.

## 5. Stock calculation

- `book_closing_stock = book_opening_stock + posted_receipts - metered_sales ± approved_adjustments`
- `physical_variance = measured_dip_volume - book_closing_stock`

Keep measured dip volume, dip chart version, measurement unit and measurement timestamp. Avoid applying a universal evaporation or tolerance adjustment.

## 6. Journal rules

- Debits equal credits for every posted journal.
- Sales posting should be configurable by account mapping and business process.
- Credit sale posts receivable; customer receipt reduces receivable and increases cash/bank.
- Delivery posting records inventory/stock value and payable as configured.
- Corrections reverse or adjust prior postings; they do not erase history.
- Reconciliation may match a settlement without altering the original shift sale.

## 7. API examples

Use versioned APIs, server authorization, pagination, request IDs and idempotency keys.

- `POST /v1/outlets/{outletId}/shifts`
- `POST /v1/shifts/{shiftId}/meter-readings`
- `POST /v1/shifts/{shiftId}/close-request`
- `POST /v1/shifts/{shiftId}/approve-close`
- `POST /v1/outlets/{outletId}/deliveries`
- `POST /v1/deliveries/{deliveryId}/post`
- `POST /v1/parties/{partyId}/credit-sales`
- `POST /v1/receipts/{receiptId}/allocations`
- `GET /v1/reports/daily-close?outletId=...&businessDate=...`
- `POST /v1/imports/bank-statement`

Commands should return validated results and clear errors. Import endpoints create review jobs; they must not silently reconcile or post uncertain data.