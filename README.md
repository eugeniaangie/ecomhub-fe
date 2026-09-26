# EcomHub - Internal Dashboard

## Local development

1. Copy `.env.example` to `.env.local` (already gitignored).
2. Point at a local backend (default if unset):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Do not append `/api/v1` — that prefix is added in `lib/api.ts`. Restart `next dev` after changing the env. In development the resolved base URL is logged to the browser/server console as `[api] base URL: …`.

Production (Vercel) must set `NEXT_PUBLIC_API_BASE_URL` to the Railway API host (e.g. `https://ecomhub-core-production.up.railway.app`).

---

## Navigation structure

Dark **top bar** + domain **hubs** (decision **D7** in [`docs/design/`](docs/design/)).  supplies the navigation *pattern*; menus and features are EcomHub's.

```
[ EcomHub | Dashboard | Finance ▾ | Marketing ▾ | Catalog ▾ | Logout ]

Finance hub          Overview · Accounts · Transactions · Channels
                     Journal Entries · Operational Expenses · Capital & Investors
                     ⚙ Setup → Chart of Accounts · Expense Categories · Fiscal Periods

Marketing hub        Ad Budgets · Ad Expenses

Catalog hub          Categories
```

Rules that keep this from sprawling:

1. **Top level = domains, few of them.** A new feature joins an existing domain unless it is a new noun of the business.
2. **Domain label → hub; caret → dropdown** of the same items. No third accordion level.
3. **Marketplaces never become top-level.** Connections go under **Integrations**; money is read through **Finance › Channels** (backend `T34`).
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
| Catalog | Domain hub | `/catalog` |
| Catalog | Categories | `/master/categories` |

Unlinked but still reachable by URL: `/finance/dashboard` (legacy Shopee summary) and `/master` (older standalone categories CRUD). Ads live only under `/marketing/*`.

"Shell" means the layout exists and figures render empty on purpose — see [`docs/design/ui-backend-gaps.md`](docs/design/ui-backend-gaps.md).

---

## Planned areas (not in the top bar yet)

| Area | Likely contents | Home in the IA |
|---|---|---|
| Catalog | Products, Product Attributes, Pricing Rules, Inventory | inside **Catalog** (Inventory may graduate to its own domain) |
| Operations | Orders, Fulfillment, Fraud review | new top-level **Operations** |
| Integrations | Shopee Open API, TikTok, other channels, sync status, settlements | new top-level **Integrations** |
| Settings | Users & Roles, Profile, Preferences | new top-level **Settings** |
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
