# Upgrade Existing Petrol Pump App — Feature Expansion Brief

## Important instruction

The application has already been generated from earlier product and architecture documents. This is an upgrade of the existing app, not a greenfield rebuild.

Before changing code:
1. Inspect the current repository, `AGENTS.md`, package files, database schema, routes, components, API, migrations, tests, and existing UI.
2. Summarize the current architecture and identify what is already implemented.
3. Map every requirement below to one of:
   - Existing and complete
   - Existing but incomplete
   - Missing
   - Conflicting with a new requirement
4. Propose the smallest compatible extension plan.
5. Preserve the existing framework, conventions, architecture and working behavior unless there is a concrete technical reason to change them.
6. Do not replace working modules with mockups or static screens.
7. Do not delete data, reset databases, rewrite architecture, or make breaking migrations without explicit user authorization.
8. Implement complete vertical slices: UI, API, permissions, data model, validation, audit behavior and useful empty/error states.
9. Use realistic demo data only where the app already supports demo data. Clearly distinguish seeded sample records from real records.
10. After implementation, report changed modules, migrations, configuration required, and any gaps that remain.

## Product context

This is a petrol pump management system for Indian retail fuel outlets and small dealer groups. Its core workflow links nozzle readings and shift sales to tank stock, receipts, customer credit, accounting and reports. It must support low-connectivity operation where the current architecture permits it.

The screenshots provided by the user show a PumpOne feature list. Treat them as feature references, not as authoritative process rules or a mandate to copy its UI.

## Upgrade outcomes

Extend the existing system to cover the feature groups below, prioritizing:
1. Master setup and safe controls for tanks/nozzles/products/prices.
2. Inventory and sales registers, dip and density records, deliveries and lube stock.
3. Periodic and short-term credit billing by customer and vehicle.
4. Integrated finance, bank reconciliation, accounting reports and employee balances.
5. Staff attendance, multiple shifts, overtime, leave, loans/advances, payroll and payslips.
6. Notifications, administrator permissions, approvals and backups.

## Critical safeguards

- Preserve current records and add migrations; never silently reset or overwrite data.
- Posted readings, sales, stock movements and accounting entries are immutable. Corrections create audited reversal/adjustment records.
- Do not create any UI or feature to falsify or conceal a shortage, loss, density result or compliance record.
- “Evaporation entry” must be a controlled, evidence-backed stock adjustment category requiring reason, measurement context, approval and audit log. It must not automatically erase unexplained variance or be used as a universal balancing amount.
- “Reset nozzle reading”, “open/stop nozzle” and “open/stop tank” are administrative status/configuration functions. The app does not remotely control certified equipment unless a verified, authorized hardware integration already exists.
- Never infer tax treatment. Use configurable, effective-dated tax categories reviewed for outlet jurisdiction and product.
- Bulk customer SMS must use a compliant provider and account for applicable TRAI sender/header/template/consent requirements. Separate transaction/service messages from promotional messages.
- Keep financial amounts exact, enforce balanced journals and use idempotency for posting/imports.
- All permissions must be enforced server-side, not only hidden from the UI.

## Delivery approach

Implement in phases. First add foundational masters and controlled records, then operational modules, then finance/payroll/notifications. Do not attempt a broad visual rewrite before the data and workflow behavior is connected.