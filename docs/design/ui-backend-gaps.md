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
| G4 | Finance → Channels (and Overview channel strip) — **Fees** line | Null / “—” / omit amount | No marketplace fee `account_code`s; T32 must not invent fees | CoA fee accounts + T32 (core Decision 11) | Open |
| G5 | Finance → Channels — full Revenue / Expense / Net | Empty until T32 lands | `T32` channel performance endpoint | T32 | Open |
| G6 | Finance → Transactions (unified feed) + Accounts drill-down | Empty list / keep legacy Shopee feed until migrate | `T33` unified transactions endpoint | T33 · FE15 | Open |
| G7 | Finance → Overview — channel performance side-by-side | Cash (T31) can be real; channel strip empty until T32 | T32 | T32 · FE8/FE16 | Open |

**Cash / account balances** via T31 (`/accounts/balance`, `/accounts/movement`) are **not** gaps once FE8 wires them — do not list those as missing.

---

## Conventions when implementing UI ahead of API

1. Types: field optional (`number | null` or omitted). Never default money to `0` to mean “unknown” if `0` is a valid balance — prefer `null` + empty UI.
2. Labels may exist (e.g. “Fees”) so layout is stable; value stays empty until G* is Filled.
3. When an endpoint ships, mark the gap **Filled (YYYY-MM-DD)** with the path and task ID; then wire the client.

---

## Resolved / filled

_(none yet)_
