# UI ↔ backend gaps

**Purpose.** Track screens, fields, and metrics that the **frontend may show** (including empty / null / coming-soon) while the **backend does not yet expose** a truthful source. Prevents silent invention of accounting numbers in the UI.

**Rule.** If a figure is listed here as ungapped-only-when-API-exists: render `null` / em dash / “—” / explicit empty state. **Do not** compute substitutes from other endpoints or sum rows client-side to fake the metric.

**Status doc** — append resolutions with date; do not delete rows when filled (mark **Filled** and point to the endpoint / task).

Related: [`jubelio-reference-ux.md`](./jubelio-reference-ux.md) · FE FE14–FE16 · core T32–T34

---

## How to use

| Column | Meaning |
|---|---|
| **UI surface** | Where the user sees it |
| **Shown as** | Empty / null / placeholder label |
| **Missing backend** | What does not exist yet |
| **Unblocks** | Task / decision that fills the gap |
| **Status** | Open · Partial · Filled |

---

## Gap register

| ID | UI surface | Shown as | Missing backend | Unblocks | Status |
|---|---|---|---|---|---|
| G1 | Home Dashboard — KPI strip (gross, discount, returns, net, profit, COGS/ads, …) | Empty cards / “—” | No ops/profit report API with signed-off metric definitions | Product defs (D1) + new report endpoints | Open |
| G2 | Home Dashboard — sales vs returns trend | Empty chart frame | Trend series endpoint | Same as G1 | Open |
| G3 | Home Dashboard — by channel panel (ops view) | Empty / “—” | Channel sales/profit series for **ops** dashboard (distinct from accounting T32 if needed) | Same as G1 | Open |
| G4 | Finance → Channels (and Overview channel strip) — **Fees** line | Null / “—” / omit amount | No marketplace fee accounts; marketplace report not JE-tag T32 | CoA fees + future marketplace report (T32 Deferred; Decision 13) | Open |
| G5 | Finance → Channels — full Revenue / Expense / Net | Empty (placeholder) | True marketplace channel metrics (not JE-tag P&L) | T32 **Deferred** (2026-09-29); later integrations | Deferred |
| G6 | Finance → Transactions (unified feed) + Accounts drill-down | Wired FE15 | ~~`T33`~~ **Done** | FE15 | **Filled (2026-09-29)** |
| G7 | Finance → Overview — channel performance side-by-side | Cash (T31) wired (FE8); channel strip empty | Marketplace channel metrics (T32 Deferred) | FE14 Deferred · integrations later | Partial (2026-09-26): cash via FE8; channel strip Deferred with T32 |

**Cash / account balances** via T31 (`/accounts/balance`, `/accounts/movement`) are **not** gaps once FE8 wires them — do not list those as missing.

**Note (2026-09-29):** G5/G7 channel strip is **not** waiting on aggregating `journal_entries.channel`. That field is a JE bookkeeping tag; marketplace channel performance is a separate product (integrations). Core Decision 13 / T32 Deferred.

---

## Conventions when implementing UI ahead of API

1. Types: field optional (`number | null` or omitted). Never default money to `0` to mean “unknown” if `0` is a valid balance — prefer `null` + empty UI.
2. Labels may exist (e.g. “Fees”) so layout is stable; value stays empty until G* is Filled.
3. When an endpoint ships, mark the gap **Filled (YYYY-MM-DD)** with the path and task ID; then wire the client.

---

## Resolved / filled

| ID | Note |
|---|---|
| G7 (cash only) | **Partial (2026-09-26):** FE8 wired `/accounts/balance` + `/accounts/movement` on Overview and Accounts. Channel half of G7 remains Deferred with T32. |
| G6 | **Filled (2026-09-29):** FE15 wired `GET …/transactions` on `/finance/transactions` + Accounts → `?account_code=` drill-down. |
