# Upgrade Architecture, Data Changes and Rollout

## 1. Architecture rule

Extend the current architecture. Do not replace framework, database or routing unless the current implementation demonstrably blocks a required behavior.

Before coding, produce a current-state map:
- Frontend framework and route structure.
- Backend framework, API shape and auth.
- Database and migration tooling.
- Existing modules and data entities.
- Existing roles/permissions.
- Existing reporting/export approach.
- Existing offline behavior.
- Existing test/build commands.
- Known technical debt that directly blocks the requested features.

## 2. Suggested module boundaries

Use the existing project’s naming/conventions; conceptually separate:
- Master Data
- Forecourt Operations
- Inventory and Procurement
- Credit and Billing
- Accounting and Reconciliation
- HR and Payroll
- Notifications
- Administration, Audit and Backup

These can remain folders/modules in a monolith. Do not introduce microservices solely to satisfy this feature list.

## 3. Entity additions/extension candidates

Only add entities absent from the current schema:
- `Tank`, `DipChartVersion`, `Dispenser`, `Nozzle`
- `PriceVersion`, `MeterReading`, `DensityRecord`, `SampleRecord`
- `Delivery`, `DeliveryCompartment`, `StockMovement`, `StockAdjustment`
- `Party`, `Vehicle`, `CreditAgreement`, `CreditSale`
- `BillingCycle`, `CustomerInvoice`, `InvoiceLine`, `ReceiptAllocation`
- `SupplierInvoice`, `BankStatementImport`, `BankStatementLine`, `ReconciliationMatch`
- `LedgerAccount`, `JournalEntry`, `JournalLine`, `Voucher`
- `Employee`, `Attendance`, `LeaveRequest`, `PayrollRun`, `PaySlip`, `EmployeeAdvance`
- `NotificationTemplate`, `MessageConsent`, `NotificationJob`
- `RolePermission`, `Approval`, `AuditEvent`, `BackupJob`

Use existing entity names if equivalents exist. Avoid duplicate “customer”, “staff”, “sale” or “ledger” tables.

## 4. Migration safety

- Add forward-only migrations that preserve existing rows.
- Backfill new fields with explicit safe defaults or nullable fields.
- Do not assume historical prices, tank mapping or chart versions if not known; mark unknown and request data entry.
- Make large data migration resumable and idempotent.
- Provide rollback strategy for schema deployment; application rollback must not destroy new data.
- Seed demo/reference data only in development/demo environments.
- Keep the app usable during migration where current deployment model requires it.

## 5. Posting and idempotency

- A domain transaction and its accounting/stock postings must either all succeed or be safely retried.
- Add idempotency key to shift approval/posting, delivery posting, invoice generation, receipt import and bank-file import.
- Prevent periodic invoice generation from billing the same transaction twice.
- Use unique constraints to support these invariants.
- A failed notification must not roll back a valid shift close.
- Use an outbox/job pattern if the existing app already has background task support.

## 6. Permissions and approvals

Define permissions at action level:
- View
- Create
- Edit draft
- Submit
- Approve
- Post
- Reverse
- Print
- Export
- Configure

Apply outlet scope in API and database access. Separate maker from approver for configurable high-risk actions:
- Price changes
- Credit limit/override
- Stock adjustments
- Shift discrepancy override
- Invoice issue/reversal
- Journal posting/reversal
- Payroll approval
- User/permission changes

## 7. Reporting implementation

- Reuse existing reporting framework.
- Reports must show filters, data period, outlet, generation time and status.
- Financial reports should be based on posted records; operational reports may include drafts but clearly label them.
- Every summary should drill into its source transactions.
- Export should apply the same permissions as screen access.
- Avoid expensive live joins for large multi-outlet reports; use existing cache/read-model pattern if present.

## 8. Rollout sequence

### Slice 1: Foundation
Master settings, role/action permissions, effective-dated price, audit history, safe migrations.

### Slice 2: Forecourt controls
Tank/dip chart, nozzle reading lifecycle, density/sampling and quick dip check.

### Slice 3: Inventory and sales
Purchase/delivery, stock movements, fuel and lube registers, sale details, evacuation adjustment workflow only when authorized and audited.

### Slice 4: Credit/billing
Short-term credit, party/vehicle records, bill-by-bill outstanding, periodic billing, counter billing and petro-card settlement status.

### Slice 5: Finance
Ledgers/vouchers, outstanding clearance, accounting reports, bank reconciliation, tax report configuration.

### Slice 6: HR and communication
Attendance, leave/overtime, loans/advances, payroll/payslips, compliant SMS/email queue.

Do not mark an entire slice “done” when only its navigation item or static page exists.

## 9. Definition of done per module

- User can complete the end-to-end workflow using persisted data.
- API enforces authentication, outlet scope and action permissions.
- Input validation and useful error states exist.
- Transaction history and audit trail work.
- Duplicate submission/retry is safe.
- Existing features still work.
- Reports/export include the new records correctly.
- Database migration is safe for existing data.
- Loading, empty, offline, conflict and permission-denied states are handled.
- Any external integration is clearly configured and does not pretend to work when credentials are absent.