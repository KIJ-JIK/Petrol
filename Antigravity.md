# Petrol Pump Management Platform — Project Context

## Mission

Build a mobile-first, offline-tolerant operating and finance platform for Indian petrol pumps and small dealer groups. The system should connect shift sales, fuel stock, customer credit, collections, staff operations, and accounting in a reliable, auditable workflow.

The core promise: **close every shift with litres and money accounted for, and show the owner what needs attention.**

## Users

- Owner/partner: outlet and group performance, approvals, pricing, credit exposure.
- Outlet manager: shift opening/closing, deliveries, dips, reconciliations, approvals.
- Attendant/cashier: assigned nozzle readings, tenders, expenses and handover.
- Accountant/CA: ledgers, reconciliation, statements, vouchers and exports.
- HR/payroll: attendance, salary, advances and employee balances.
- Auditor: read-only, time-bounded access to records and audit history.

## Initial MVP

- One outlet per tenant, with configurable products, tanks, dispensers, nozzles, shifts and users.
- Opening/closing meter readings and shift sales calculations.
- Cash, UPI, card, fleet, coupon and credit tender reconciliation.
- Tank deliveries, dip readings, stock ledger and variance reporting.
- Customer/party khata, credit limits, receipts, ageing and statements.
- Basic staff, attendance, advances, expenses and audit log.
- Owner dashboard, DSR, CSV/PDF exports and offline-capable PWA.

## Later releases

- Multi-outlet reporting and consolidated accounts.
- Supplier/OMC statements, bank and digital settlement reconciliation.
- Lubricant/store inventory and billing.
- Payroll, documents, renewal reminders and compliance evidence.
- Supported dispenser/POS/ATG/payment-provider integrations.
- OCR of invoices/statements with human confirmation.
- Fleet customer portal and reporting automation.

## Product principles

1. The shift close connects meter readings, litres, revenue, tenders, credit, cash and stock.
2. Every calculated number must be explainable and traceable to its source.
3. Posted financial records are immutable. Correct through reversal or adjustment.
4. Offline conflicts are visible. Never silently pick a winner for money, readings or approvals.
5. Separate physical measurements, book stock and financial sales.
6. Use configurable OMC/outlet workflows; do not hardcode unverified assumptions.
7. Do not claim legal/tax compliance or remote dispenser control without verified requirements and authorized interfaces.
8. Keep roles simple for forecourt staff and detailed for managers/accountants.

## Engineering rules

- Inspect the repository, `AGENTS.md`, existing conventions and scripts before implementation.
- Use a modular monolith first, with clear domain boundaries.
- Tenant/outlet authorization must be enforced server-side.
- Store money exactly (paise-safe integer or decimal); define quantity precision and rounding.
- Keep raw readings, timestamps, effective-dated prices, calculated values and formula/version provenance.
- Use idempotency for imports, offline sync and posting operations.
- Balance double-entry journals before posting.
- Use audit events for privileged actions, corrections, approvals and configuration changes.
- Do not invent OMC APIs, tax treatment, legal tolerances or hardware support. Track unknowns explicitly.
- Keep secrets and raw payment-card details out of the application database and logs.

## Reference market

Public feature pages describe products such as PetroMath, PumpCount, PumpDesk, PetroPulse360, PumpSoftware, Esperto and Petrosoft365 with combinations of meter/dip/stock, shift closing, credit, accounting, payroll, billing and multi-outlet reporting. Treat vendor feature claims as marketing until verified through a demo or customer reference.

The likely product opportunity is dependable reconciliation, transparent correction history, offline workflows, migration and dealer/accountant trust—not simply a longer feature checklist.

## Research starting points

- PetroMath: https://petromath.co.in/
- PumpCount: https://petrolpumpsoftware.com/
- PumpDesk: https://pumpdesk.in/
- PetroPulse360: https://petropulse360.com/features
- PumpSoftware: https://pumpsoftware.in/
- Esperto: https://www.espertotech.in/software/petrol-pump-management
- Petrosoft365: https://www.didc.in/petrosoft365.php
- Department of Consumer Affairs, Legal Metrology: https://consumeraffairs.nic.in/hi/acts-and-rules/legal-metrology/the-legal-metrology-act-2009
- HPCL Marketing Discipline Guidelines 2024: https://www.hindustanpetroleum.com/documents/pdf/Marketing_Discipline_Guideline_2024_24102024.pdf
- CBIC GST invoice rules: https://cbic-gst.gov.in/gst-invoice-rules.html

These regulatory sources are discovery references, not legal advice. Requirements vary by state, OMC agreement, product, and outlet type.