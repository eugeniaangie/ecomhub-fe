# Menu → backend endpoints

Base URL: `{API_BASE}/api/v1`

Current-state map of what each screen calls. When a screen’s endpoints change, update this file in the same change.

---

## Auth (not a menu item)

| Screen | Endpoints |
|--------|-----------|
| Login | `POST /auth/login` → `access_token` + HttpOnly `refresh_token` cookie; then `GET /auth/me` (includes `tenant_scope`, `allowed_tenants`, `active_tenant_id` — F7d). Scoped APIs send header `X-Tenant-ID`. |
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

- `GET /reports/dashboard/finance/accounts/balance` *(query: optional `as_of`)* — Total cash (sum of rows) + drives as-of label; hero links to `/finance/balances`
- `GET /reports/dashboard/finance/accounts/movement` *(query: `start_date`, `end_date`; optional `channel` unused on this screen)* — period debit / credit / net; In / Out / Net cards link to `/finance/transactions?start_date=…&end_date=…`

Channel strip and Fees remain empty / commented out (gaps **G4, G5, G7**).

### Accounts — balances (`/finance/balances`)

- `GET /reports/dashboard/finance/accounts/balance` *(optional `as_of`)* — per-account table
- `GET /reports/dashboard/finance/accounts/movement` *(required `start_date`, `end_date`)* — period debit / credit / net per account

Drill-down: account code/name links to `/finance/transactions?account_code=…` (FE15 / T33).

### Transactions (`/finance/transactions`)

- `GET /reports/dashboard/finance/transactions` — paginated (`page`/`limit`; optional `channel` JE tag, `account_code`; required `start_date`/`end_date`). **FE15 Done (2026-09-29).** Also `GET /accounts/no_page` for the account filter dropdown. URL query `account_code` / `start_date` / `end_date` initialise the filters (Overview period cards pass the date range). Legacy Shopee transactions remain on unlinked `/finance/dashboard` until FE16.

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
- `GET /reports/dashboard/finance/ad-expenses/detail` — paginated (`page`/`limit` → `PaginatedResponse`; backend T15). FE22 Done (2026-09-29): Marketing Ad Expenses wires `Pagination`. Max date-range still deferred on BE Phase 5.

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
| `/sales` | Sales domain hub |
| `/settings` | Settings domain hub (admin+: Shopee Integration; superadmin: Tenants/Users) |
| `/shopee-auth-callback` | Shopee OAuth return — POSTs `code` + `shop_id` to Core `…/shopee/token` (F6a3) |
| `/master` | Older standalone categories CRUD — unlinked, retire separately |

Legacy FE routes (redirect): `/integrations` → `/settings`, `/integrations/shopee` → `/settings/integration/shopee`, `/sales/shopee` → `/sales/shopee/orders`, `/sales/returns` → `/sales/shopee/returns`, `/sales/ads` → `/sales/shopee/ads`.

---

## Settings — FE34 / FE36 / FE37

### Shopee Integration (`/settings/integration/shopee`) — FE37 (was Integrations)

- `GET /integrations/marketplaces/shopee/connections` — list our OAuth connections (no raw tokens); page shows status + Re-connect.
- `GET /integrations/marketplaces/shopee/authorize-url` — `{ authorize_url }`; FE opens same-tab (admin+).
- `POST /integrations/marketplaces/shopee/token` — body `{ code, shop_id }` → connected shop (no raw tokens). Called from `/shopee-auth-callback`.

### Tenants (`/settings/tenants`)

- `GET /tenants` — list (`id`, `name`, `slug`, `is_active`, optional `shopee_shop_id`)
- `POST /tenants` — body `{ name, slug, timezone? }` → created tenant (no CoA clone)
- `PATCH /tenants/:id` — body `{ is_active }` activate/deactivate
- After create/toggle: `GET /auth/me` to refresh switcher `allowed_tenants`

### Users (`/settings/users`)

- `GET /users` — paginated (`page`/`limit`/`search`); roles + first membership tenant
- `PUT /users/:id/roles` — body `{ roles: string[] }`
- `PUT /users/:id/tenant-membership` — body `{ tenant_id }` (non-superadmin target)
- `DELETE /users/:id/tenant-membership` — clear → view-only
- Tenant picker uses `GET /tenants` (active only)

---

## Sales

### Shopee Orders (`/sales/shopee/orders`) — FE25 + FE29 + FE33

- `GET /integrations/marketplaces/shopee/connections` — presence check for active tenant (no shop picker; scope via `X-Tenant-ID`).
- `GET /integrations/marketplaces/shopee/orders/preview` — live list+detail+escrow (admin+). Query: optional `shop_id` (omitted — Core defaults inside tenant), `time_from`, `time_to`, `order_status`, `fetch_all`, `cancel_bucket` (`pembatalan`|`pengembalian` approx; CANCELLED drill-down), `cancel_reason`, `exclude_pembatalan` (drop early cancel / no pickup — used on All statuses). Response: `order_count`, `total_quantity`, `total_escrow_amount`, `total_deductions`, `deduction_breakdown[]`, `sku_summary[]`, `orders[]` (+ cancel fields), `cancel_reason_options`. Overview cards: Orders · Qty · Escrow · **Total deductions** (click → breakdown) · Ads spend (links to `/sales/shopee/ads`).
- `GET /integrations/marketplaces/shopee/orders/detail` — one `order_sn` drill-down (admin+). Query: `order_sn`; optional `shop_id` omitted under tenant scope. Response: `buyer_amount`, `original_price`, `escrow_amount`, `deductions[]`, `items[]`. Row click on orders table opens modal.
- `GET /integrations/marketplaces/shopee/ads/spend/preview` — live Partner CPC ads **expense** sum (admin+, FE29). Same optional `shop_id` / `time_from` / `time_to`. Response: `total_ads_spend`, `day_count`, `used_hourly_api`. Not wallet balance; not Marketing JE ad-expenses.

### Shopee Returns (`/sales/shopee/returns`) — FE28 / Core F6d + FE33

- `GET /integrations/marketplaces/shopee/connections` — presence check (no shop picker).
- `GET /integrations/marketplaces/shopee/returns/preview` — live `get_return_list` (admin+). Query: optional `shop_id` omitted, `time_from`, `time_to`, `fetch_all=true`, optional `return_status`. Response: `return_count`, `total_quantity`, `total_refund_amount`, `sku_summary[]`, `returns[]`. Do **not** treat orders preview `cancel_bucket=pengembalian` as this screen.

### Shopee Ads (`/sales/shopee/ads`) — FE31 / Core F6f + FE33

- `GET /integrations/marketplaces/shopee/connections` — presence check (no shop picker).
- `GET /integrations/marketplaces/shopee/ads/performance/preview` — shop-level CPC performance (admin+). Query: optional `shop_id` omitted, `time_from`, `time_to`. Response: `total_ads_spend`, impressions/clicks, direct/broad GMV & orders & period ROAS, `series[]` (`series_grain` daily|hourly), optional `ads_wallet_balance` / `balance_as_of`. Overview Ads spend card links here with `start_date` / `end_date` (no `shop_id`). Not campaign/product; not F1; wallet ≠ spend.

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
