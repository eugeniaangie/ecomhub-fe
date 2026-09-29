# Finance module

Current-state guide for the finance screens. Status and open work live in [`docs/roadmap/task-list.md`](../roadmap/task-list.md). Screen → endpoint map: [`docs/menu-endpoints.md`](../menu-endpoints.md). Design IA: [`docs/design/`](../design/). UI ahead of API: [`docs/design/ui-backend-gaps.md`](../design/ui-backend-gaps.md).

Roles come from `GET /auth/me` after login (stored via `lib/authHelpers.ts`). Do not set `user_role` / `user_id` by hand in the console — that path is obsolete and misleading.

Client-side `can*` checks only control what to render. The backend owns authorisation.

---

## Information architecture (2026-09-26)

Chrome is a **dark top bar** with domains `Dashboard · Catalog · Marketing · Finance` (decision **D7** in [`../design/`](../design/); grouping from **D6**). Clicking a domain opens a **hub** of feature cards; the caret opens the same list as a dropdown.

- **Home** `/dashboard` — ops / profit pulse (empty until report APIs; gaps G1–G3). Leaf in the top bar (no hub).
- **Finance** `/finance` — hub cards: Overview, Accounts, Transactions, Channels, Journal Entries, Operational Expenses, Capital & Investors. Gear → `/finance/setup` (Chart of Accounts, Expense Categories, Fiscal Periods).
- **Accounts** on the hub is **balances** (`/finance/balances`), not Chart of Accounts.
- **Marketing** `/marketing` — hub: Ad Budgets, Ad Expenses (`/marketing/ad-*`). Old `/finance/ad-*` FE paths are gone (no redirect).
- **Catalog** `/catalog` — hub: Categories (`/master/categories` for now).
- Legacy Shopee summary at `/finance/dashboard` remains reachable by URL but is **not** in the top nav.

---

## Screens

| Path | What it does |
|------|----------------|
| `/dashboard` | Home ops dashboard — empty KPI / trend shells |
| `/finance` | Finance domain hub (feature cards) |
| `/finance/setup` | Finance setup hub — CoA, expense categories, fiscal periods |
| `/finance/overview` | Finance Overview — Total cash + period movement (FE8 / T31); channel strip empty until T32 |
| `/finance/balances` | Account balances + period movement (FE8 / T31); click account → Transactions filter (FE15) |
| `/finance/transactions` | Unified posted lines — date / channel-tag / account filters + pagination (FE15 / T33) |
| `/finance/channels` | Per-channel financial view — empty until T32 / FE14; Fees slot null (G4) |
| `/marketing/ad-expenses` | Ad spend totals by platform (was `/finance/ad-dashboard`) |
| `/finance/dashboard` | Legacy Shopee finance / wallet / transactions summary (unlinked) |
| `/finance/fiscal-periods` | Fiscal period CRUD; close (admin/manager+) / reopen (superadmin) |
| `/finance/expense-categories` | Expense category CRUD |
| `/finance/accounts` | Chart of accounts — hierarchy, 7 account types, active/inactive |
| `/finance/operational-expenses` | Expense workflow: pending → approved → paid (or rejected) |
| `/finance/journal-entries` | Journal entries with approve / reject / post |
| `/marketing/ad-budgets` | Ad budget CRUD and spent updates (was `/finance/ad-budgets`) |
| `/finance/capital-investors` | Capital investors CRUD, return-paid / status patches |

Unimplemented product areas (inventory, orders, P&L reports, etc.) are listed in the root [`README.md`](../../README.md), not here.

---

## Behaviour notes

### Fiscal periods
- End date must be after start date.
- Closed periods cannot be edited or deleted in the UI.
- Close: `superadmin` / `admin` / `manager`. Reopen: `superadmin` only.

### Chart of accounts
- Types: asset, liability, equity, revenue, expense, contra_asset, contra_liability (badge colours in `lib/utils/constants.ts`).
- Parent–child hierarchy; soft delete → inactive.
- Identified by stable `account_code` on the API.

### Operational expenses
- Staff and above can create; edit/delete only while `pending`.
- Approve / reject: `superadmin` / `admin` while pending.
- Pay: `superadmin` / `admin` while approved.
- Receipt is a URL field today (no file upload).

### Journal entries
- Draft → approved → posted (reject also available).
- Permission predicates: `canApproveJournalEntry`, `canRejectJournalEntry`, `canPostJournalEntry`, etc. in `lib/authHelpers.ts`.
- Lines must balance (debits = credits) before submit.

### Ad budgets / Ad expenses (now under Marketing)
- Ad Budgets: planning CRUD, `/marketing/ad-budgets`. Still calls the `/ad-budgets` API.
- Ad Expenses dashboard: report totals by platform, `/marketing/ad-expenses`; still uses `ad-expenses/*` until T32 supersedes.

### Capital investors
- Status and return-paid patches as exposed by the API.

---

## Roles (render hints only)

See `lib/authHelpers.ts`. Backend enforces the real rules.

---

## Related

- Gaps G1–G7: [`docs/design/ui-backend-gaps.md`](../design/ui-backend-gaps.md)
- Shell / IA task: **FE17** in the backlog
