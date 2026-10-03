# Feature Research Notes and Compliance Boundaries

## 1. Screenshot feature inventory

The screenshots show these PumpOne groupings:

### Pump master
- Tank master
- Dip master and dip chart
- Nozzle master
- Reset nozzle reading
- Open/stop nozzle and tank
- MIS reports

### Inventory and sales
- Daily rate
- Item group, item and unit masters
- Tax type master
- Stock quantity/value summary and stock reports/valuation
- Daily sale register
- Nozzle-wise and dip/tankwise sale registers
- Density/stock inspection calculation
- Purchase entry/register
- Sale register
- Lube stock and valuation
- Credit sales report
- Bill generation
- Direct/cash, debit/credit card and petro-card collections
- Customer/vehicle fuel and cash credit
- Meter-reading, shift-wise, salesman-wise and slip-wise data entry
- Weekly, fortnightly, monthly or periodic billing
- Consolidated bills by vehicle or date; separate vehicle bill
- Automatic bill generation
- Cash and credit memo printing

### Accounts and finance
- Account groups and customer/supplier/employee opening accounts
- Vehicle master and ledger report
- Bank/cash book, normal billing, GST billing
- Employee loan and advance
- Outstanding clearance and receipt/payment report
- Payable/receivable, balance sheet and stock valuation
- Sales summary and statement email
- Interest calculation and bill-wise outstanding
- Bank reconciliation, trading report, P&L and trial balance
- TDS reports
- Party/vehicle-wise accounting reports

### SMS panel
- Customer/supplier messages
- Welcome/account details
- Credit sale messages
- Statement generation
- Birthday, anniversary and pollution reminder messages

### HR/payroll
- Employee management
- Multiple shifts
- Leave and attendance registers
- Employee loan/advance
- Overtime
- Salary register and report
- Attendance report, payslip and MIS

### Admin panel
- Company creation
- Database backup
- User-level form permissions for add/edit/view/print
- Approval permissions for authorized signatories

## 2. Public product research

PumpOne’s public page lists many of the same modules, including nozzle/dip reading, density history, fuel and lube purchase, tankwise stock, credit billing, staff salary, accounting, bank reconciliation and reports. Its page also claims online/offline use and broad adoption; those claims are not independently validated.

Other public product pages show similar categories:
- PumpCount lists meter/dip/density, tanker purchases, shift and salesman reports, evaporation, accounts, credit billing, stock and payroll: https://petrolpumpsoftware.com/
- PumpMath describes shift-to-ledger reconciliation, credit/vehicle tracking, tank stock, bank/digital reconciliation and automated accounting: https://petromath.co.in/
- PetroPulse360 describes DSR, dip/density, customer credit, staff, GST reports and Tally export: https://petropulse360.com/petrol-pump-software-features
- PumpDesk describes meter readings, dips, deliveries, tender reconciliation, shifts and reports: https://pumpdesk.in/
- Fyond describes nozzle-wise DSR, tank dip, credit billing and cash/card/UPI reconciliation: https://www.fyond.com/petrol-pump-management-software

Interpretation: most visible modules are category expectations. Product differentiation should emphasize accurate links across source records, auditability, offline-safe workflow, clean migration and clear variance explanations.

## 3. India tax configuration caution

The screenshots use labels such as VAT/GST and GST billing. The app must not assume that every fuel product is handled under GST. Section 9(2) of the CGST Act says central tax on petroleum crude, high-speed diesel, motor spirit/petrol, natural gas and aviation turbine fuel takes effect from a date notified by Government. Confirm the currently applicable tax and invoicing treatment for the outlet, state, product and transaction before configuration.

Official references:
- CGST Act, Section 9: https://cbic-gst.gov.in/hindi/CGST-bill-e.html
- CBIC GST rate schedule: https://cbic-gst.gov.in/hindi/gst-goods-services-rates.html
- CBIC invoice rules: https://cbic-gst.gov.in/gst-invoice-rules.html

Lubes and other goods/services may have different tax treatment. Tax mappings should be effective-dated and professionally reviewed. Do not label fuel invoices “GST compliant” by default.

## 4. SMS/email compliance caution

TRAI’s sender guidance says bulk communication requires applicable principal-entity registration, registered headers and content templates, and consent workflows where required. The app should use a compliant telecom provider and store communication purpose, template version, consent/preferences and delivery status.

Official references:
- TRAI advice to senders: https://www.trai.gov.in/advice-to-senders
- TRAI TCCCPR 2018 page: https://www.trai.gov.in/tcccpr
- TRAI consent guidance: https://trai.gov.in/manage-your-consent

Do not automatically send birthdays, anniversaries, promotional messages or pollution reminders without the outlet configuring the purpose, channel and required permission. Consider the pollution reminder an optional customer service reminder; validate the exact business need and applicable data/consent rules.

## 5. Measurement and operational evidence

The Department of Consumer Affairs hosts the Legal Metrology Act and rules, including current amendments. OMC manuals also describe outlet-specific operating practices. Use them to design evidence capture, reminders and reports, but do not present the app as a legal certification or substitute for official verification.

References:
- Department of Consumer Affairs, Legal Metrology: https://consumeraffairs.nic.in/hi/acts-and-rules/legal-metrology/the-legal-metrology-act-2009
- HPCL Marketing Discipline Guidelines 2024: https://www.hindustanpetroleum.com/documents/pdf/Marketing_Discipline_Guideline_2024_24102024.pdf

## 6. Questions that screenshots do not answer

Antigravity must not invent answers. Make these configuration/discovery questions:
- How does the current app represent meters and meter resets?
- Does a shift have one selling price or can it cross a price change?
- How is sales quantity linked to a tank when multiple nozzles/products exist?
- What exact dip chart data and units does the outlet have?
- What is the recognized process for evaporation/shrinkage adjustments?
- Which products are sold, billed and taxed under which category?
- Does periodic billing include each transaction or consolidate by vehicle/date?
- Which payment-card and petro-card schemes are used?
- Which SMS/email provider and compliance setup does the customer have?
- What payroll rules, overtime rules and statutory deductions apply?
- What backup/restore capability exists in the current deployment?