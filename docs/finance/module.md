# Finance module

Current-state guide for the finance screens. Status and open work live in [`docs/roadmap/task-list.md`](../roadmap/task-list.md). Screen → endpoint map: [`docs/menu-endpoints.md`](../menu-endpoints.md).

Roles come from `GET /auth/me` after login (stored via `lib/authHelpers.ts`). Do not set `user_role` / `user_id` by hand in the console — that path is obsolete and misleading.

Client-side `can*` checks only control what to render. The backend owns authorisation.

---

## Screens

| Path | What it does |
|------|----------------|
| `/finance` | Landing page with links into the module |
| `/finance/dashboard` | Shopee finance / wallet / transactions summary |
| `/finance/ad-dashboard` | Ad spend totals by platform |
| `/finance/fiscal-periods` | Fiscal period CRUD; close (admin/manager+) / reopen (superadmin) |
| `/finance/expense-categories` | Expense category CRUD |
| `/finance/accounts` | Chart of accounts — hierarchy, 7 account types, active/inactive |
| `/finance/operational-expenses` | Expense workflow: pending → approved → paid (or rejected) |
| `/finance/journal-entries` | Journal entries with approve / reject / post |
| `/finance/ad-budgets` | Ad budget CRUD and spent updates |
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

### Money and dates
- Amounts are numbers from the API; format at render with `formatCurrency` / date helpers in `lib/utils/formatters.ts`.
- Report query dates are `YYYY-MM-DD`. Do not re-derive accounting totals in the UI.

---

## Code layout

```
app/(dashboard)/finance/     # pages per screen
components/finance/          # domain UI (e.g. StatusBadge)
lib/services/financeApi.ts   # HTTP clients for finance domains
lib/types/finance.ts         # response shapes
lib/authHelpers.ts           # can* predicates
lib/utils/formatters.ts
lib/utils/constants.ts
```

Pages call service clients; services call `lib/api.ts`. Do not `fetch` from a page.

---

## Permission matrix (UI)

Approximate render rules — confirm against `lib/authHelpers.ts` and the backend before relying on them.

| Action | Typical roles |
|--------|----------------|
| View finance screens | Authenticated |
| CRUD expense categories / accounts / fiscal periods (open) | manager+ (varies by action; delete often admin+) |
| Close fiscal period | superadmin, admin, manager |
| Reopen fiscal period | superadmin |
| Submit / edit own pending expense | authenticated (pending only) |
| Approve / reject / pay expense | superadmin, admin |
| Journal approve / reject / post | see `can*JournalEntry*` |
| Ad budgets / capital investors mutations | see matching `can*` |

---

## Related docs

- [`docs/menu-endpoints.md`](../menu-endpoints.md) — what each screen calls
- [`docs/finance/testing-checklist.md`](./testing-checklist.md) — manual verification
- [`docs/roadmap/task-list.md`](../roadmap/task-list.md) — FE backlog (`FE*`)
- [`docs/design/`](../design/) — UX reference and UI/backend gaps
