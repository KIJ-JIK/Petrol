# System Architecture

## 1. Architecture approach

Use a modular monolith for the first release. Shift close, stock posting and accounting need transactional integrity; independent microservices would add deployment and data-consistency work before there is a scale need.

Split background workers and integrations only when load or ownership boundaries justify it.

## 2. Logical components

- Web/PWA clients: attendant, manager, owner and accountant surfaces.
- Identity and access: OIDC identity, session management, MFA and role/outlet scoping.
- Domain API: shifts, readings, stock, parties, credit, deliveries, expenses and finance.
- PostgreSQL: authoritative transactional data.
- Queue/workers: report generation, notifications, import processing, OCR and reconciliation.
- Object storage: invoices, photographs, statements and generated exports.
- Integration adapters: bank files, payment providers, accounting packages, POS, dispensers and ATG.
- Observability: logs, metrics, traces, audit events and error reporting.

## 3. Suggested deployment

```mermaid
flowchart LR
  A[Attendant PWA] --> G[API Gateway / Identity]
  B[Owner & Accountant Web] --> G
  C[Manager Tablet] --> G
  D[Imports & Vendor Adapters] --> Q[Queue]
  G --> S[Domain Modules]
  S --> DB[(PostgreSQL)]
  S --> Q
  S --> AU[Audit Events]
  Q --> W[Background Workers]
  W --> OBJ[(Encrypted Object Storage)]
  W --> N[Email / SMS / Messaging Provider]
  DB --> R[Reporting Views]
  R --> UI[Dashboards / Exports]