# EcomHub - Internal Dashboard

[![Visitors](https://api.visitorbadge.io/api/visitors?path=eugeniaangie%2Fecomhub-fe&label=Visitors&countColor=%236A89A7)](https://github.com/eugeniaangie/ecomhub-fe)

> Visitor count is a third-party README view counter (increments when the badge loads). It is **not** GitHub Insights clone stats and does not identify visitors.

## Local development

1. Copy `.env.example` to `.env.local` (already gitignored).
2. Point at a local backend (default if unset):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Do not append `/api/v1` — that prefix is added in `lib/api.ts`. Restart `next dev` after changing the env. In development the resolved base URL is logged to the browser/server console as `[api] base URL: …`.

```bash
npm run dev    # local app
npm run lint
npm test       # Vitest (authHelpers and growing unit suite)
npm run build
```

CI (GitHub Actions) runs `lint` → `test` → `build` on push/PR to `main`/`master`.

Production (Vercel) must set `NEXT_PUBLIC_API_BASE_URL` to the Railway API host (e.g. `https://ecomhub-core-production.up.railway.app`).

**Deploy / move host / Shopee redirect:** see Core [`docs/IMPORTANT_NOTES.md`](../ecomhub-core/docs/IMPORTANT_NOTES.md) (CORS, cookies, Vercel env, Partner Console domain).

---

## Navigation structure

Dark **top bar** + domain **hubs** (decision **D7** — top-bar domains, hub cards, caret dropdown). Menus and features are EcomHub's.

```
[ EcomHub | Dashboard | Catalog ▾ | Marketing ▾ | Sales ▾ | Finance ▾ | Settings ▾ | Logout ]

Finance hub          Overview · Accounts · Transactions · Channels
                     Journal Entries · Operational Expenses · Capital & Investors
                     ⚙ Setup → Chart of Accounts · Expense Categories · Fiscal Periods

Marketing hub        Ad Budgets · Ad Expenses

Sales hub            Shopee Orders · Shopee Returns · Shopee Ads
                     (paths under `/sales/shopee/…`; TikTok later as `/sales/tiktok/…`)

Catalog hub          Categories

Settings hub         Shopee Integration (Connect shop via Partner OAuth)
                     Tenants · Users (superadmin)
```

Rules that keep this from sprawling:

1. **Top level = domains, few of them.** A new feature joins an existing domain unless it is a new noun of the business.
2. **Domain label → hub; caret → dropdown** of the same items. No third accordion level.
3. **Marketplaces never become top-level.** Connections go under **Settings › Shopee Integration**; sales previews under **Sales**; money is read through **Finance › Channels** (backend `T34`).
4. **Unbuilt areas are not rendered** in the top bar until they have a screen.

---

## Implemented screens

| Domain | Screen | Path |
|---|---|---|
| Dashboard | Home (ops shell — figures pending APIs) | `/dashboard` |
| Finance | Domain hub | `/finance` |
| Finance | Setup hub | `/finance/setup` |
| Finance | Overview (shell) | `/finance/overview` |
| Finance | Accounts / balances (shell) | `/finance/balances` |
| Finance | Transactions (shell) | `/finance/transactions` |
| Finance | Channels (shell) | `/finance/channels` |
| Finance | Journal Entries | `/finance/journal-entries` |
| Finance | Operational Expenses | `/finance/operational-expenses` |
| Finance | Capital & Investors | `/finance/capital-investors` |
| Finance | Chart of Accounts | `/finance/accounts` |
| Finance | Expense Categories | `/finance/expense-categories` |
| Finance | Fiscal Periods | `/finance/fiscal-periods` |
| Marketing | Domain hub | `/marketing` |
| Marketing | Ad Budgets | `/marketing/ad-budgets` |
| Marketing | Ad Expenses | `/marketing/ad-expenses` |
| Sales | Domain hub | `/sales` |
| Sales | Shopee Orders (preview) | `/sales/shopee/orders` |
| Sales | Shopee Returns | `/sales/shopee/returns` |
| Sales | Shopee Ads | `/sales/shopee/ads` |
| Catalog | Domain hub | `/catalog` |
| Catalog | Categories | `/master/categories` |
| Settings | Domain hub | `/settings` |
| Settings | Shopee Integration | `/settings/integration/shopee` |
| Settings | Tenants (superadmin) | `/settings/tenants` |
| Settings | Users (superadmin) | `/settings/users` |
| Settings | Shopee OAuth callback | `/shopee-auth-callback` |

Unlinked but still reachable by URL: `/finance/dashboard` (legacy Shopee summary) and `/master` (older standalone categories CRUD). Ads live only under `/marketing/*`.

"Shell" means the layout exists and figures render empty on purpose — see [`docs/design/ui-backend-gaps.md`](docs/design/ui-backend-gaps.md).

---

## Planned areas (not in the top bar yet)

| Area | Likely contents | Home in the IA |
|---|---|---|
| Catalog | Products, Product Attributes, Pricing Rules, Inventory | inside **Catalog** (Inventory may graduate to its own domain) |
| Operations | Orders, Fulfillment, Fraud review | new top-level **Operations** (Shopee order preview lives under **Sales** for now) |
| Settings | TikTok / other channel connects, sync status, settlements (Shopee Connect is live under **Settings › Shopee Integration**) | inside **Settings** |
| Settings | Profile (later) | top-level **Settings** (Tenants / Users / Shopee Integration live) |
| Finance reports | Profit & Loss, Cash Flow, Balance Sheet | **Finance** hub cards |

Status for frontend work is tracked in [`docs/roadmap/task-list.md`](docs/roadmap/task-list.md), not here.

---

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/roadmap/task-list.md`](docs/roadmap/task-list.md) | FE backlog and live status (`FE*`) |
| [`docs/finance/module.md`](docs/finance/module.md) | Finance screens, roles, behaviour |
| [`docs/menu-endpoints.md`](docs/menu-endpoints.md) | Screen → API endpoint map |
| [`docs/finance/testing-checklist.md`](docs/finance/testing-checklist.md) | Manual verification |
| [`docs/design/`](docs/design/) | UX reference, navigation decisions, UI/backend gaps |
| [`AGENTS.md`](AGENTS.md) | Conventions for contributors / agents |
