# Roadmap, Risks and Discovery

## 1. Phase plan

### Discovery (2–4 weeks)

- Interview owners, managers, attendants and CAs.
- Observe real shift close and delivery receipt.
- Gather anonymized registers, DSRs, invoices, statements and accounting exports.
- Confirm business date conventions, price change handling and meter exceptions.
- Validate hardware and available vendor integrations.
- Produce clickable wireframes and a data dictionary.

### MVP pilot

- Single outlet per tenant.
- Forecourt setup, meter sales, shift close, tenders, delivery/dip/stock, khata, staff basics, expenses, audit and reports.
- Shadow the existing register process before becoming the source of truth.
- Pilot with 3–5 outlets and weekly review.

### Release 2

- Multi-outlet.
- Supplier and OMC reconciliation.
- Bank/digital settlement matching.
- Accounting exports.
- Lubricant inventory, payroll and document vault.

### Release 3

- Validated equipment/payment integrations.
- OCR with human approval.
- Fleet portal, scheduled reporting and forecasting.
- Native app only if PWA/device needs require it.

## 2. Validation questions

1. Which country/state and OMCs are targeted first?
2. What is the exact process for shift opening and closing?
3. Are readings captured per nozzle, dispenser or shift summary?
4. How are meter rollover/reset and dispenser replacement handled?
5. How are fuel prices changed and what happens if price changes mid-shift?
6. Is tank stock authoritative from manual dip, ATG or another register?
7. Which density/sampling and verification records are maintained?
8. How are credit customers, vehicles, receipts and disputes handled?
9. How are supplier/OMC invoices and statement differences reconciled?
10. Which accounting package and exports does the CA require?
11. What hardware and internet constraints exist at the forecourt?
12. What languages and support model will staff need?
13. What price and onboarding model would dealers accept?

## 3. Risks

| Risk | Response |
|---|---|
| Staff see entry as extra work | Shadow real workflow, reduce typing, import/integrate where validated |
| Historical records are inconsistent | Guided migration, opening-balance confirmation, source provenance |
| Offline edits conflict | Idempotent event sync and explicit conflict review |
| Equipment interfaces differ | Build adapter boundary; verify each integration contract |
| Tax/compliance changes | Versioned configuration, professional review, avoid unsupported claims |
| Fraud/shared logins | Individual accounts, role limits, audit events, maker-checker approvals |
| OCR introduces wrong values | Preserve original file, confidence display and human approval |
| Support costs overwhelm margins | Standard onboarding, migration tools and partner channels |

## 4. Pilot metrics

- Time from shift end to approved close.
- Percent of shifts closed on same day.
- Missing reading/dip frequency.
- Cash variance frequency and resolution time.
- Delivery discrepancy resolution time.
- Digital settlement match rate and age.
- Credit overdue balance and collection time.
- Weekly active outlets and staff usage.
- Sync conflict/failure rate.
- Support requests per outlet.
- Pilot-to-paid conversion and retention.

## 5. Suggested packaging hypothesis

- Starter: one outlet, shift close, dip/stock, basic khata and exports.
- Growth: reconciliation, staff, lubricants, accounting exports and automation.
- Network: multi-outlet dashboards, consolidated reporting, integrations and support options.

Competitor pricing changes; interview customers and calculate onboarding/support cost before setting price. Offer data migration/onboarding separately if it has meaningful delivery cost.