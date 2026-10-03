# Mobile-First Upgrade — Existing Petrol Pump App

## Goal

Adapt the existing petrol pump application so all current and planned modules work well on mobile phones. Keep the existing backend and web application architecture wherever possible.

Build a responsive, installable Progressive Web App (PWA) from the existing web app. Preserve desktop use. Do not start a separate native mobile application or rewrite the app unless repository inspection proves that is necessary and the user approves the reason.

## First: inspect the existing app

Before changing code:

1. Inspect project instructions, repository structure, frontend framework, routes, styling system, authentication, APIs, data model, build setup and deployment.
2. Identify which pages already work on narrow screens and which are desktop-only.
3. Identify existing PWA, offline, camera, notification and responsive support.
4. Map each current feature to its existing mobile route or component.
5. Report what is implemented, incomplete, missing or broken on mobile.
6. Propose an incremental plan that reuses the app’s current architecture.
7. Preserve working features, existing data, URL behavior and desktop functionality.

Do not create duplicate modules when an existing screen/API already covers the feature. Do not replace functional screens with static mockups.

## Product requirement

Every feature available in the web app must be reachable and usable on a phone. Mobile is the primary layout and interaction target; desktop remains supported.

Mobile-first does not mean forcing every desktop table onto a narrow screen. Choose an appropriate phone interaction:
- compact list cards with drill-down
- horizontally scrollable, labelled data grids only where necessary
- focused forms
- step-by-step workflows
- bottom sheets or dialogs for short actions
- full-screen detail pages for complex work

## User roles and mobile priorities

### Attendant / cashier

Prioritize:
- Assigned outlet and active shift
- Assigned nozzle list
- Opening/closing meter readings
- Cash, UPI, card, petro-card and credit totals
- Cash denomination/count and handover
- Customer/vehicle credit slip
- Quick dip check, where permitted
- Sync/offline state and errors

Keep input controls large, fast, legible outdoors, and usable with one hand. Minimize free typing.

### Manager

Prioritize:
- Shifts needing setup, close, review or approval
- Variances and missing readings
- Tank dip and delivery entry
- Staff assignment and attendance
- Credit override and stock-adjustment approvals
- Today’s sales, collections and stock alerts

### Owner

Prioritize:
- Today’s litres, sales and collections
- Cash/tender variance
- Tankwise stock and dip variance
- Credit outstanding and overdue balances
- Deliveries and supplier payables
- Approval inbox
- Multi-outlet overview, if already supported

### Accountant

Prioritize:
- Billwise outstanding and party statements
- Bank/card/petro-card reconciliation
- Receipt/payment entry
- Voucher and ledger search
- Purchase and sale registers
- Reports and exports
- Audit and correction history

### HR/payroll user

Prioritize:
- Attendance register
- Leave and overtime review
- Employee advances/loans
- Payroll period summary and approval
- Payslip access with restricted permissions

## Mobile navigation

Use the existing information architecture where possible. On mobile, provide a clear navigation pattern, such as a bottom navigation bar for the most frequent destinations plus a “More” menu for secondary modules.

Suggested top-level destinations:
- Home
- Shift
- Stock
- Khata
- More

The “More” area can expose:
- Billing
- Purchases
- Lubes/store
- Accounts
- Bank reconciliation
- Staff/payroll
- Reports
- Messages
- Admin/settings

Navigation visibility is role-based. A hidden menu item is not a security control; APIs must still enforce permissions.

## Mobile workflows to implement

### 1. Mobile shift close

1. Select active outlet and shift.
2. Show assigned nozzles and suggested opening readings.
3. Enter closing readings using a numeric keypad.
4. Show litres and amount calculated for each nozzle.
5. Enter tender totals by configured payment type.
6. Enter cash count and deposits/drops.
7. Enter or link credit slips and optional vehicle details.
8. Show unresolved differences and missing data.
9. Submit for approval.
10. Show status and manager response.
11. Allow manager approval only for authorized users.

Show an unsynced badge if data is stored locally. Preserve the source reading and do not silently overwrite approved values.

### 2. Mobile quick dip

1. Select or scan tank identifier if the current app supports scanning.
2. Display tank, product and active dip-chart version.
3. Enter measured dip and timestamp.
4. Show converted volume and compare with book stock.
5. Show variance and link to source stock movements.
6. Save as draft or submit under outlet policy.

Label this as a manual operational check, not an official measurement certification.

### 3. Mobile delivery receipt

1. Select or create delivery.
2. Enter supplier, invoice, tanker/trip details and product.
3. Enter before dip and received quantity.
4. Record unloading notes, optional sample/density evidence and after dip.
5. Show invoice-vs-received-vs-tank-change comparison.
6. Submit discrepancy for review or send for approval.
7. Post stock only through the existing authorized posting flow.
8. Prevent double posting on retry.

### 4. Mobile credit sale

1. Search/select party.
2. Select vehicle if configured.
3. Show limit, current outstanding and overdue status.
4. Enter product, quantity, price and slip/reference.
5. Show total and any limit warning.
6. Require authorized override with reason if policy permits.
7. Save sale once and show it in party/vehicle ledger.

### 5. Mobile periodic bill review

- Select account, cycle and period.
- Review eligible unbilled transactions.
- Group by date or vehicle according to configuration.
- Preview lines and totals in a phone-friendly list.
- Require authorized confirmation before invoice generation.
- Prevent the same slip from appearing in more than one bill.
- Show print/download/share actions after generation.

### 6. Mobile approvals

Provide a consolidated inbox with:
- transaction type
- outlet and date
- requester
- amount/quantity and variance
- reason/evidence
- source-record links
- approve, reject/return, or request correction actions

Require reason for rejection or override. Do not allow users to approve their own transaction when maker-checker rules apply.

## Mobile UI requirements

- Design and test at narrow phone widths first, then tablet and desktop.
- Keep primary actions reachable with thumb; avoid small inline edit icons.
- Minimum comfortable touch targets and spacing; respect device safe areas.
- Use clear labels and numeric keyboards for amounts, dates, quantities and meter readings.
- Keep outlet, business date, active shift and sync state visible where relevant.
- Avoid dense desktop tables on phones. Use labelled summary cards and detail views.
- Preserve table exports and desktop power-user workflows.
- Use text/icon indicators in addition to colors for warnings and statuses.
- Provide loading, empty, validation-error, permission-denied and offline states.
- Ensure forms do not lose unsaved input when navigating accidentally.
- Use confirmation for posting, approval, reversal and other financially consequential actions.
- Avoid excessive modal dialogs; use full-screen mobile forms for multi-step tasks.
- Provide readable contrast and keyboard/accessibility support.

## PWA requirements

First inspect if PWA infrastructure already exists. If not, extend the current frontend with:

- Web app manifest with app name, short name, icons, start URL, theme and standalone display mode.
- Service worker for safe application-shell caching and update lifecycle.
- Clear install/help flow appropriate to the supported browsers.
- HTTPS deployment requirement.
- Versioned caches and a visible app-update prompt when a new version is available.
- Do not cache private API responses indiscriminately.
- Do not store passwords, payment card data or unnecessary personal information locally.

Installability requirements and browser criteria vary. Validate the final build in the browsers/devices the pilot customers use.

## Offline and sync requirements

Offline behavior must be explicit per operation. Do not promise every feature works offline.

### Suitable offline-first candidates

Subject to the existing API and security model:
- Draft nozzle readings and shift close inputs
- Draft dip readings
- Draft delivery observations
- Draft credit slips
- Draft attendance events
- Cached minimum outlet/product/nozzle configuration for an assigned shift

### Online-required or review-required actions

Keep online-required unless the current app has a safe offline authorization design:
- User/permission changes
- Final approvals and accounting postings
- Price publication
- Payroll posting
- Periodic invoice issuance
- Bank reconciliation finalization
- Role/credit-limit changes

### Sync behavior

- Store a local event with unique ID/idempotency key, user, outlet, device timestamp and local status.
- Show Pending, Syncing, Synced, Failed and Conflict states.
- Retry safely after reconnect.
- Prevent duplicate sales, receipts, stock movements or postings.
- Conflicting readings, tenders or approvals require a review task.
- Keep audit trace of device time and server receipt time.
- Provide an accessible “sync now” and retry action.
- Do not silently use last-write-wins for money or readings.

Use browser-compatible local storage appropriate to the current stack, such as IndexedDB, only if it fits the existing architecture. Encrypt or minimize locally stored sensitive data where supported by the design.

## Device capabilities

Use camera access only where it materially helps:
- Evidence/photo for delivery documents or dip evidence
- Optional meter-photo capture if OCR is already planned
- Optional barcode/QR lookup for SKU or tank identifier

Camera/OCR is assistive. Preserve the entered/recognized value and require user confirmation before saving. Do not treat OCR as the authoritative reading.

## Notifications

Use in-app notifications first. If web push is implemented:
- Request permission only after an explicit user action.
- Provide notification preferences.
- Send only relevant events based on role and outlet.
- Test installed-PWA behavior on target browsers/devices.
- Keep SMS/email providers and TRAI-related requirements in their separate notification workflow.
- Do not rely on push as the only delivery path for critical financial approvals.

## Responsive acceptance criteria

The mobile-first update is complete only when:

1. Every current module can be reached and used from a supported phone viewport.
2. No primary action requires hover.
3. No essential field or button is clipped or hidden behind horizontal page overflow.
4. Complex tables have a phone-appropriate presentation and preserve information.
5. Shift close, quick dip, credit sale, delivery entry and approval can be completed on a phone.
6. Validation errors identify the specific field and retain entered values.
7. User sees offline, pending sync, failed sync and conflict states accurately.
8. Retrying an operation cannot duplicate a financial or stock transaction.
9. Role/outlet restrictions work through direct API requests as well as the UI.
10. Desktop workflows remain functional.
11. PWA manifest/install behavior is validated on the target browser set.
12. Private information is not exposed in a shared-device or signed-out state.

## Delivery plan

### Phase 1: Mobile audit and shell

- Inspect existing app and create current mobile-responsiveness report.
- Add/finish responsive app shell, mobile navigation and role-specific home.
- Ensure authentication, session expiry and logout work well on phones.

### Phase 2: High-frequency forecourt operations

- Shift opening/closing.
- Meter readings.
- Cash/tender reconciliation.
- Quick dip.
- Credit sale.
- Offline drafts and sync status.

### Phase 3: Manager and finance tasks

- Delivery entry and approval.
- Periodic billing review.
- Customer and vehicle statements.
- Bank reconciliation review.
- Owner/manager dashboards.

### Phase 4: HR, reports and admin

- Attendance, leave, advances, payroll approval and payslips.
- Reports and exports.
- Admin user/permission screens.
- PWA update and install help.

Deliver each phase as working functionality using existing APIs and persisted data. Do not mark work complete based on responsive screenshots alone.