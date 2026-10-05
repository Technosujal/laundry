# Open Questions for the Client

## Status

- Revision: 1
- Purpose: durable register of questions that only the client (store owner) can answer.
- Rule: nothing here may be guessed, defaulted, or silently resolved. A question leaves this file only when the client answers it, and the answer is then recorded as a decision in `PROJECT_STATE.md`.
- Context: the delivery team does not own this data. Every item below was raised by evidence in the supplied WDF POS and LaundroPortal exports, not by preference.

Part 1 is written for the client in plain business language and can be sent as-is. Part 2 holds the technical backing for the delivery team.

---

# Part 1 — Questions for the client

## A. Highest value: about $33,000 of 2025 work is missing from your sales reports

**What we found.** Your WDF system produced two reports for 2025 that do not agree. The annual sales workbook totals **$42,102.22**. But your own order and production reports account for roughly **$33,000 more** in completed laundry that never appears in that sales total.

We traced it. Thirty-one orders from 2025 are recorded as *processed* in your production report but are **absent from your sales figures entirely**. These are not small orders:

- The 31 missing orders average **$1,063 each and 788 lbs each**.
- Your typical order averages **$47 and 34 lbs**.
- Seventeen of them are individually over $1,000.
- They occur throughout the year, not in one bad week.

**Our question:** **Do you bill any commercial or wholesale customers on account — invoiced later — rather than taking payment at the till?**

We believe the answer is yes, because your sales workbook only counts orders by the date they were *paid*, and your system reports "On Account" as $0.00 with the accounts-receivable sheet completely empty. We also see a "Hilton Hotel" department that shows only **$47.59 of sales for the whole of 2025**, which cannot be right for a hotel contract.

**Why it matters to you.** If we build your revenue dashboard on the sales workbook alone, it will understate your 2025 business by about $33,000 and your largest commercial customers will be invisible in every chart. Separately, if that commercial work is genuinely being done but not landing in your sales reporting, that may be worth checking on the business side regardless of this project.

**What we need:** confirmation of how commercial/on-account work is billed and recorded, and whether there is a separate invoicing or accounts-receivable system we have not seen.

## B. Which "sales" number is the real one?

Your 2025 financial report shows **two different totals for Net Sales**: **$42,105.00** on its summary page and **$42,102.22** on its detail page. The Excel version of the same report disagrees with the PDF again on tax and on the grand total.

We have verified that the **$42,102.22** figure is the one that matches the underlying line-by-line data exactly. The PDF summary page does not even add up against its own printed components.

**Our question:** when you say "sales" for the year, which number do you consider correct — and is that how your accountant treats it?

**Why it matters.** We will not display a sales figure until you tell us which basis is authoritative. Whichever you choose, we will show the difference rather than quietly picking one.

## C. What time zone does the store run on?

Your exports are dated in a way that suggests the reporting day does not run midnight-to-midnight — the 2025 report window runs from 01:00 on 1 January to 00:59 on 1 January the following year.

**Our question:** what time zone should the store's business day use, and does your day start at midnight?

**Why it matters.** Every "today", "this week", "this month" and "this year" figure depends on this. Orders near midnight and near year-end can land in the wrong period if we guess.

## D. We need one more export: dryer cycles

The daily machine-cycle file you gave us covers **washers only** — all 30 dryers show revenue but no cycles. We initially thought dryers might not report cycles at all.

They do. Your LaundroPortal monthly summary shows dryer cycles clearly, split into "full" and "top-off" cycles. The washer-only file is simply a filtered export.

This matters more than it sounds: in the sample month we looked at, **top-off dryer cycles were 76% of all machine cycles**. Any usage figure built on the washer-only file would miss three quarters of the activity in your store.

**Our request:** please export the machine-cycle history again **including dryers**, for the same 2025 date range — ideally keeping "full" and "top-off" cycles separate, as your summary report does.

**Our question:** should a "top-off" cycle count as a full cycle in your usage figures, or be counted separately? They are not the same thing and we do not want to blend them without your say-so.

## E. Your 2025 timesheet total is roughly seven times too high

Your timesheet reports **19,478 hours** worked in 2025 across 6 staff. That cannot be right — a single full-time year is about 2,080 hours.

We traced the cause. **53 entries are longer than 24 hours**, and those 53 alone account for **85% of all recorded time**. Three of them are extreme:

- one entry runs from 29 December 2025 to 12 August 2026 — **226 days**
- one runs 21 September 2025 to 2 May 2026 — **223 days**
- one runs 3 August 2025 to 5 January 2026 — **155 days**

Those three entries alone are 74% of your entire year's recorded labour. Six further entries have zero duration.

Strip out everything over 16 hours and the remaining 417 entries total **2,677 hours**, which looks like a realistic part-time crew.

**Our questions:** are these missed clock-outs that were closed manually later? And how do you want them handled — excluded from labour reporting, corrected to an assumed shift length, or flagged for a manager to fix?

**Why it matters.** We will not publish hours, labour cost, or staff productivity figures until you decide. We will not delete the entries either way — they stay visible and counted in a data-quality total.

**A note on your clocks.** While checking this we confirmed your system records time across daylight-saving changes correctly, which tells us your store runs on a clock that observes daylight saving. That is useful — but we still need you to confirm the actual time zone (question C).

## F. "Free Starts" — we now know what they are, but not how you want them counted

Your LaundroPortal data shows **$41,380.50** of "free starts" for 2025. We have confirmed from your own monthly summary that these are **management card starts** — the two figures match exactly, so "free starts" and "management card starts" are the same thing.

So the definition is settled. What isn't:

**Our questions:** what do you use management cards for — staff, maintenance and testing, customer goodwill, or something else? And should that $41,380.50 appear in your reporting as a cost, as a discount given away, or be left out of revenue entirely?

**Why it matters.** At roughly $41,000 a year this is not a rounding error, and where we put it changes what your revenue and margin figures look like.

## G. Customer privacy: what are your rules?

The account file contains **17,177 customer records** including names, emails, phone numbers, card numbers and balances.

**Our questions:** how long should customer personal data be retained, who is allowed to see it in the app, and should it be masked for managers?

**Why it matters.** This is the most sensitive data in the project and we will not put it into the live application until you set the rules.

## H. Smaller confirmations

1. **Manager access to Inventory** — should a manager be able to open the Inventory area, or is it owner-only? Your approved screen design shows managers an Inventory tile, but the access rules do not grant it.
2. **Customer matching across systems** — your WDF customers and your LaundroPortal card accounts cannot be reliably linked: 56% of card accounts have no email or phone at all, and some phone numbers are shared by up to 24 different accounts. Is there any customer or account number common to both systems?
3. **Void report** — the supplied report shows 30 of 34 voided transactions. Can a complete export be provided?
4. **Banned accounts** — 1,156 card accounts are marked "Banned". Should banned customers be shown, hidden, or flagged in the app?
5. **Forecasting** — is forecasting wanted, and if so what should be forecast first?
6. **API access** — when can we get WDF and LaundroPortal API credentials and documentation? Until then the app cannot show live data.

---

# Part 2 — Technical backing for the delivery team

| Ref | Question | Linked unknown | Evidence | Blocks |
|---|---|---|---|---|
| A | Commercial/on-account billing | BU-009 | 31 production orders absent from workbook, $32,957.70 / 24,415 lbs; reconciliation closes to $507.27 (0.52%); empty `AR Summary (On Account)` sheet; `On Account $0.00`; Hilton Hotel department $47.59/yr | All revenue, AOV, weight metrics |
| B | Authoritative Net Sales basis | BU-010 | XLSX $42,102.22 reconciles to line items exactly; PDF summary $42,105.00 fails its own internal sum by $0.03; Tax 1 differs $2.82; Grand Total differs $5.57 | Any Net Sales metric |
| C | Store timezone and day boundary | BU-007 | Workbook window `2025-01-01 01:00:00` → `2026-01-01 00:59:00` | All time bucketing |
| D | Dryer cycle export + top-off semantics | new | Dryer cycles exist: July 2026 summary reports dryers 387 full + 18,246 top-off. Supplied daily CSV is washer-scoped only. Top-off was 76% of all cycles in that sample (PR-012) | Utilisation, revenue-per-cycle |
| E | Timesheet anomaly treatment | existing Phase 0 finding, quantified 2026-09-15 | 53 entries >24h carry 85.4% of all recorded time; 3 entries (155/223/226 days) carry 74.5%; 6 zero-duration, 0 negative; plausible remainder 2,677.3 h of 19,478.3 h. Durations disagree with recomputed clock times on 25.8% of entries (seconds truncation), so reported durations must be used | Workforce hours, labour cost, performance |
| F | Free Starts accounting treatment | existing finding, **definition resolved 2026-09-15** | `Free Starts` proven identical to `Management Card Starts`: July 2026 reports 3,462 / $4,350.40 under both labels. 2025 value $41,380.50. Treatment (cost, discount, or excluded) remains a client decision | Any revenue reconciliation including free starts |
| G | Personal-data retention/masking | BU-004 | 17,177 account rows with name/email/phone/card/balance; $88,372.45 outstanding balances | Production data handling, any customer view |
| H1 | Manager Inventory authorization | BU-008 | DEC-021 grants the launch card; server area policy does not grant the area | Manager Inventory journey |
| H2 | Cross-system customer identifier | existing | 56.4% of accounts have neither email nor phone; contact values shared by up to 24 accounts | Customer identity bridge |
| H3 | Complete void export | existing | PDF shows 30 of 34 entries; no CSV supplied | Void drill-down |
| H4 | Banned account treatment | new | `Account Status` is a sparse flag; 1,156 accounts set to `Banned` (PR-014) | Customer display rules |
| H5 | Forecasting target/method | BU-005 | No approved target or horizon | Forecasting work |
| H6 | Vendor API access | DEC-015 | No contract, credentials, pagination, or identifier semantics received | Phase 3 completion, live data |

## Handling rules

- Questions A, B, C and G are hard gates. No dependent figure may be published before they are answered.
- Answers are recorded as decisions in `PROJECT_STATE.md` and the corresponding `BU-` entry is closed there, not here.
- Where an answer changes an approved decision, raise it as a conflict under the authority order in `AGENT_START.md` rather than editing the decision silently.
- Work that continues regardless: source profiling, contract and schema design, data-free UI, ingestion for sources whose semantics are already proven, and any regression or verification work.
