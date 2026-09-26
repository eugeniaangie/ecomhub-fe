# Menu → backend endpoints

Base URL: `{API_BASE}/api/v1`

Current-state map of what each screen calls. When a screen’s endpoints change, update this file in the same change.

---

## Auth (not a menu item)

| Screen | Endpoints |
|--------|-----------|
| Login | `POST /auth/login` → `access_token` + HttpOnly `refresh_token` cookie; then `GET /auth/me` |
| Register | `POST /auth/register` → same session shape as login |
| Silent renew | `POST /auth/refresh` (cookie only; `credentials: 'include'`) |
| Logout | `POST /auth/logout` (revokes refresh cookie server-side) |
| Global (dashboard) | `Authorization: Bearer <access_token>`; `(dashboard)` shell via `PageWrapper` + `ensureAccessToken()` (FE6: access token or silent refresh); on 401 → single-flight `POST /auth/refresh` then retry once; if refresh fails → clear session + redirect `/login?redirect=…` (FE1/FE7) |

See FE task **FE7** and backend **T28b**.

---

## Dashboard

### Home (`/dashboard`)

Ops / profit pulse. **No report endpoints wired yet** — KPI and chart shells render as empty (`—`). See gaps **G1–G3** in [`design/ui-backend-gaps.md`](./design/ui-backend-gaps.md).

### Finance Overview (`/finance/overview`)

- `GET /reports/dashboard/finance/accounts/balance` *(query: optional `as_of`)* — Total cash (sum of rows) + drives as-of label
- `GET /reports/dashboard/finance/accounts/movement` *(query: `start_date`, `end_date`; optional `channel` unused on this screen)* — period debit / credit / net

Channel strip and Fees remain empty (gaps **G4, G5, G7**).

### Accounts — balances (`/finance/balances`)

- `GET /reports/dashboard/finance/accounts/balance` *(optional `as_of`)* — per-account table
- `GET /reports/dashboard/finance/accounts/movement` *(required `start_date`, `end_date`)* — period debit / credit / net per account

Drill-down to transactions still needs T33 / FE15 (gap **G6**).

### Transactions (`/finance/transactions`)

Unified feed placeholder. Needs T33 / FE15. Gap **G6**. Legacy Shopee transactions remain only on the unlinked `/finance/dashboard` page.

### Channels (`/finance/channels`)

Per-channel Revenue / Expense / Net / Fees shells. Needs T32 / FE14. Fees amount stays null (G4) until fee accounts exist.

### Legacy Finance Dashboard (`/finance/dashboard`) — not in top nav

- `GET /reports/dashboard/finance/shopee/current-balance`
- `GET /reports/dashboard/finance/shopee/wallet/current-balance`
- `GET /reports/dashboard/finance/shopee/transactions` *(query: `start_date`, `end_date`, `page`, `limit` — FE uses `DEFAULT_PAGE` / `DEFAULT_PAGE_SIZE` from `lib/utils/pagination.ts`)*

---

## Finance › Setup

### Chart of Accounts (`/finance/accounts`)

- `GET /accounts`
- `GET /accounts/no_page`
- `POST /accounts`
- `PUT /accounts/:id`
- `DELETE /accounts/:id`

### Expense Categories (`/finance/expense-categories`)

- `GET /expense-categories`
- `POST /expense-categories`
- `PUT /expense-categories/:id`
- `DELETE /expense-categories/:id`

### Fiscal Periods (`/finance/fiscal-periods`)

- `GET /fiscal-periods`
- `POST /fiscal-periods`
- `PUT /fiscal-periods/:id`
- `DELETE /fiscal-periods/:id`
- `POST /fiscal-periods/:id/close`
- `POST /fiscal-periods/:id/reopen`

---

## Finance › Records

CRUD and workflow screens under the Finance sidebar group, after the Views section.

### Capital & Investors (`/finance/capital-investors`)

- `GET /capital-investors`
- `GET /capital-investors/total`
- `POST /capital-investors`
- `PUT /capital-investors/:id`
- `PATCH /capital-investors/:id/return-paid`
- `PATCH /capital-investors/:id/status`
- `DELETE /capital-investors/:id`

### Operational Expenses (`/finance/operational-expenses`)

- `GET /operational-expenses`
- `GET /expense-categories/no_page` *(dropdown)*
- `GET /accounts/no_page` *(dropdown)*
- `POST /operational-expenses`
- `PUT /operational-expenses/:id`
- `DELETE /operational-expenses/:id`
- `POST /operational-expenses/:id/approve`
- `POST /operational-expenses/:id/reject`
- `POST /operational-expenses/:id/pay`

### Journal Entries (`/finance/journal-entries`)

- `GET /journal-entries`
- `GET /journal-entries/:id`
- `GET /fiscal-periods/no_page` *(dropdown)*
- `GET /accounts/no_page` *(dropdown)*
- `POST /journal-entries`
- `PUT /journal-entries/:id`
- `DELETE /journal-entries/:id`
- `POST /journal-entries/:id/approve`
- `POST /journal-entries/:id/reject`
- `POST /journal-entries/:id/post`

---

## Marketing

### Ad Budgets (`/marketing/ad-budgets`)

- `GET /ad-budgets`
- `POST /ad-budgets`
- `PUT /ad-budgets/:id`
- `PATCH /ad-budgets/:id/spent`
- `DELETE /ad-budgets/:id`

### Ad Expenses (`/marketing/ad-expenses`)

- `GET /reports/dashboard/finance/ad-expenses/total`
- `GET /reports/dashboard/finance/ad-expenses/shopee`
- `GET /reports/dashboard/finance/ad-expenses/meta`
- `GET /reports/dashboard/finance/ad-expenses/tiktok`
- `GET /reports/dashboard/finance/ad-expenses/detail`

---

## Catalog

### Categories (`/master/categories`)

- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

Route still lives under `/master/*`; only the sidebar group changed (decision **D6**).

---

## Pages without API calls

| Path | Note |
|------|------|
| `/` | Redirect to `/dashboard` |
| `/finance` | Finance domain hub (cards only) |
| `/finance/setup` | Finance setup hub (cards only) |
| `/marketing` | Marketing domain hub |
| `/catalog` | Catalog domain hub |
| `/master` | Older standalone categories CRUD — unlinked, retire separately |

---

## In client code, unused by any page

- `GET /dashboard/summary`
- `GET/POST/PUT/DELETE /transactions`
- `GET/POST/PUT/DELETE /payment-methods`
- `GET /categories/tree`
- `GET /accounts/type/:type`
- `GET /accounts/parent/:id`
- `GET /ad-budgets/month/:month`

Candidates for cleanup under **FE10** once confirmed unused.
