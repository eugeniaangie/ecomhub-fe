# EcomHub FE — Task Backlog

Single prioritized backlog for the frontend. Status lives in the checklist below **and** in each task's **Status** line — keep both in sync when a task finishes.

**How to read this:** the checklist is the quick recap; detailed write-ups follow in **recommended execution order** (not numeric ID order). Task IDs are `FE*` and are never renumbered or reused.

**Cross-repo:** backend work is tracked separately in [`ecomhub-core/docs/roadmap/task-list.md`](../../../ecomhub-core/docs/roadmap/task-list.md) with `T*` IDs. Where an FE task exists only because a backend task landed (or is about to), the `T*` ID is named explicitly. Do not duplicate backend status here — link to it.

**Status values:** `Open` · `In progress` · `Blocked` · `Done`

| Category | Meaning |
|---|---|
| **P0** | Breaks users today / data shown is wrong |
| **P1** | Important engineering work |
| **P2** | Useful improvements, not urgent |
| **P3** | Later / optional |
| **FEATURE** | New product functionality |

---

## Checklist

| | ID | Pri | Task | Driven by |
|:---:|---|---|---|---|
| [ ] | FE1 | P0 | Global 401 handling — force re-login instead of dead UI | T28a |
| [ ] | FE2 | P1 | Point dev builds at the right API base URL | — |
| [ ] | FE3 | P1 | Fix logout leaving `user_roles` in `localStorage` | — |
| [ ] | FE4 | P1 | Handle 429 from the login rate limiter | T28a |
| [ ] | FE5 | P1 | Fix revoked-token detection (checks 403, backend sends 401) | T28a |
| [ ] | FE6 | P1 | Route guard for `(dashboard)` — no auth check exists today | — |
| [ ] | FE7 | P1 | Refresh-token client: short access token + rotation | T28b |
| [ ] | FE8 | P1 | Adopt account balance / movement endpoints | T31 |
| [ ] | FE9 | P2 | Single request helper in `lib/api.ts` | — |
| [ ] | FE10 | P2 | Delete API clients for endpoints the backend does not expose | — |
| [ ] | FE11 | P2 | Consolidate the root markdown files into `docs/` | — |
| [ ] | FE12 | P2 | Small-fixes cleanup bundle | — |
| [ ] | FE13 | P3 | Add a test setup and wire lint/build into CI | — |
| [ ] | FE14 | FEATURE | Channels screen | T32 |
| [ ] | FE15 | FEATURE | Unified transactions screen | T33 |
| [ ] | FE16 | FEATURE | Restructure Finance UI — Overview · Accounts · Transactions · Channels | T34 |

**P0 left:** FE1.

---

## Documentation impact — finishing a task is not done until the docs match

**This file is the single source of truth for FE task status.** When a task completes, update in the same change:

| Always | What to do |
|---|---|
| `docs/roadmap/task-list.md` | Set the task **Status** to `Done` **and** tick its row in the Checklist. Mandatory. |

| If the change touched | Also update |
|---|---|
| Which endpoint a screen calls | `MENU_ENDPOINTS.md` |
| A screen's behaviour, routes, or role rules | the relevant finance/module doc |
| Manual verification steps | `TESTING_CHECKLIST.md` |
| Stable conventions (not status) | `AGENTS.md` / `.cursor/rules/` — principles only |

**Do not** delete a resolved task or renumber `FE*` IDs. Append a `**Done.** YYYY-MM-DD — …` line instead.

---

## P0 — Breaks users today

### FE1 — Global 401 handling: force re-login instead of dead UI

**Category:** P0 · **Status:** Open · **Driven by:** `T28a` (backend, Done 2026-09-10)

**Problem.** `T28a` changed the JWT claim set: tokens now carry `sub` / `iss` / `aud` / `type=access` and no longer carry `username` / `user_id`. Any token issued before that change is rejected by the backend middleware. The FE has no global 401 path:

- `handleResponse` in `lib/api.ts` turns a 401 into the string `"Unauthorized. Please login again."` and throws. Nothing clears the token, and nothing redirects.
- `lib/auth.ts` keeps the token in `sessionStorage` **and** a non-httpOnly `access_token` cookie, so the rejected token survives a reload.

The result for a user holding a stale token is every screen failing with an error banner and no way out except manually clearing storage.

**Why it matters.** This is the one defect that is user-visible right now, and it gets worse under `T28b`, where access tokens expire every ~15 minutes rather than daily.

**Affected area.** `lib/api.ts`, `lib/auth.ts`, `lib/authHelpers.ts`.

**Dependencies.** None. Should land **before** `FE7`, which builds the refresh flow on top of the same interception point.

**Next action.** Centralise the 401 branch: clear the token and all user keys, then redirect to `/login?redirect=<current path>`. Do **not** redirect on the login request itself, or a wrong password becomes a redirect loop.

---

## P1 — Important engineering work

### FE2 — Point dev builds at the right API base URL

**Category:** P1 · **Status:** Open

**Problem.** `lib/api.ts` defaults to the production API when the env var is unset:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ecomhub-core-production.up.railway.app';
```

There is no `.env.example` in the repo, so a fresh clone runs `npm run dev` against **production** without any signal that it is doing so.

**Why it matters.** This is a finance app. A local experiment — creating a journal entry, approving an expense — silently mutates real accounting data.

**Affected area.** `lib/api.ts`, new `.env.example`, `.gitignore`, `README.md`.

**Dependencies.** None.

**Next action.** Default to `http://localhost:4000` for development, keep the production URL supplied via `NEXT_PUBLIC_API_BASE_URL` in the Vercel project, and add `.env.example` documenting the variable. Note `.gitignore` currently ignores `.env*`, so committing the example needs a `!.env.example` negation. Surface the resolved base URL in the console during development so the target is never ambiguous.

---

### FE3 — Fix logout leaving `user_roles` in `localStorage`

**Category:** P1 · **Status:** Open

**Problem.** `setUserRoles` writes both `user_roles` (the array) and `user_role` (first role, kept for backward compatibility). `logout()` removes only `user_role` and `user_id`:

```ts
auth.clearToken();
localStorage.removeItem('user_role');
localStorage.removeItem('user_id');
```

`user_roles` is never removed, and `getUserRoles()` reads `user_roles` first. After logging out as an admin and logging in as a viewer, the viewer keeps admin roles until `/auth/me` resolves — and permanently if that call fails, which the login page tolerates by design.

**Why it matters.** Role state decides what the UI offers. The backend still enforces its own role checks, so this is not a privilege escalation — it is buttons that appear and then fail with a 403, which reads as a broken app.

**Affected area.** `lib/authHelpers.ts`.

**Dependencies.** None. Natural pairing with `FE1` — both are "clear client auth state properly".

**Next action.** Clear every auth key in one helper (`clearUserData()`) and call it from both `logout()` and the 401 path. Also decide whether `user_role` is still needed, or whether `user_roles` alone is enough now that `/auth/me` always returns the array.

---

### FE4 — Handle 429 from the login rate limiter

**Category:** P1 · **Status:** Open · **Driven by:** `T28a`

**Problem.** `T28a` added rate limiting to `POST /auth/login`: 20 requests/minute per IP and 10/minute per username, answered with HTTP 429 and `business_code` `"90"`. `handleResponse` has branches for 500+, 404, 401, 403 and 400 — nothing for 429, so the user sees the raw `HTTP error! status: 429`.

**Why it matters.** Someone who mistypes a password a few times gets an error that does not explain itself or say when to retry.

**Affected area.** `lib/api.ts`, `app/(auth)/login/page.tsx`.

**Dependencies.** None.

**Next action.** Add a 429 branch with a clear "too many attempts, try again in a minute" message. Consider disabling the submit button briefly after a 429 rather than letting the user hammer a limiter that counts every attempt.

---

### FE5 — Fix revoked-token detection (checks 403, backend sends 401)

**Category:** P1 · **Status:** Open · **Driven by:** `T28a`

**Problem.** `handleResponse` looks for a revoked token inside the **403** branch:

```ts
} else if (response.status === 403) {
  if (errorData.message?.toLowerCase().includes('token has been revoked') ||
      errorData.business_code === '93') {
```

The backend auth middleware returns **HTTP 401** with `business_code: "93"` for a blacklisted token. The generic `errs.HTTPStatus` mapping does turn code `93` into 403, but the middleware sets the status directly, so the FE branch never matches for this case. `logout()` has the same 403-based special case.

**Why it matters.** Not visibly broken today — the 401 branch produces an acceptable message — but the dead branch is misleading, and it will be copied into the refresh logic in `FE7`, where distinguishing "expired" from "revoked" actually matters.

**Affected area.** `lib/api.ts`, `lib/authHelpers.ts`.

**Dependencies.** Fold into `FE1`; both edit the same error-mapping block.

**Next action.** Key the revoked check on `business_code === '93'` regardless of HTTP status, and confirm the actual status/body pairs against a running backend before relying on either.

---

### FE6 — Route guard for `(dashboard)`

**Category:** P1 · **Status:** Open

**Problem.** `app/(dashboard)/layout.tsx` renders `PageWrapper` with no authentication check, and the repo has no `middleware.ts`. `lib/auth.ts` writes the `access_token` cookie with the comment "for middleware access", but the middleware it was written for does not exist. An unauthenticated visitor loads the dashboard shell and only discovers the problem when each request fails.

**Why it matters.** Flash of a working-looking app followed by a wall of errors, and the login redirect currently only happens if a user manually navigates to `/login`.

**Affected area.** `app/(dashboard)/layout.tsx` or a new `middleware.ts`.

**Dependencies.** Decide alongside `FE1` — client-side guard and server-side middleware are two answers to the same question. Note the cookie is client-set and non-httpOnly, so middleware can read it but must not treat it as trustworthy; it is a routing hint, not authorisation.

**Next action.** Pick one mechanism and remove the other's leftovers. If middleware is chosen, the cookie stays and the guard is a redirect; if a client guard is chosen, drop the cookie and rely on `sessionStorage`.

---

### FE7 — Refresh-token client: short access token + rotation

**Category:** P1 · **Status:** Blocked · **Driven by:** `T28b` (backend, Open) · **Breaking**

**Problem.** `T28b` replaces the single 24-hour access JWT with a ~15-minute access token plus a persistent refresh token, adding `POST /auth/refresh` and making `POST /auth/logout` revoke server-side. The FE currently assumes one long-lived token:

- `lib/auth.ts` stores exactly one token and writes the cookie with a hardcoded 1-day expiry (`setCookie('access_token', cleanToken, 1)`) — which matches today's 24h TTL and stops matching the moment the TTL shortens.
- No request retries after a 401, so every in-flight call fails the moment the access token expires.

**Why it matters.** Without this, `T28b` logs users out every 15 minutes. The backend task is explicitly marked as breaking the FE.

**Affected area.** `lib/auth.ts`, `lib/api.ts`, `app/(auth)/login/page.tsx`, `lib/authHelpers.ts`.

**Dependencies.** **Backend `T28b` must define the contract first** — endpoint shape, refresh transport (body vs cookie), rotation semantics. Build on `FE1`'s single 401 interception point.

**Next action.** Wait for the `T28b` contract. Then: store access and refresh separately, retry a failed request **once** after a successful refresh, and serialise concurrent refreshes behind a single in-flight promise so a page issuing five parallel requests does not fire five rotations — with rotation, the losers would be revoked.

---

### FE8 — Adopt account balance / movement endpoints

**Category:** P1 · **Status:** Open · **Driven by:** `T31` (backend, Done 2026-09-06)

**Problem.** `T31` established that the Shopee balance endpoints the finance dashboard calls are **period net movement filtered to one channel**, not cumulative balances, and shipped replacements:

| Endpoint | Meaning | Params |
|---|---|---|
| `GET /reports/dashboard/finance/accounts/balance` | Cumulative posted balance, all channels, cash subtree (Kas `1110`, Bank `1120`, E-Wallet `1130` + children) | `as_of` optional |
| `GET /reports/dashboard/finance/accounts/movement` | Net posted movement in a date range | `start_date`, `end_date` required; `channel` optional |

`app/(dashboard)/finance/dashboard/page.tsx` still calls `getCurrentBalanceBankShopee` and `getCurrentBalanceShopeeWallet`. The legacy routes were deliberately kept alive for the FE until `T34`.

**What the figures do.** `T31`'s verification found that under the FE's current default range the new and old numbers **agree** for the cash subtree, so this is a semantics fix, not a restatement — but the old queries drop any opening balance before `start_date`, so they will diverge as history grows. Treat the switch as a change to numbers on screen and eyeball both before and after.

**Response shape.** Both return an array; balance rows are `account_code`, `account_name`, `account_type`, `is_active`, `total_debit`, `total_credit`, `current_balance`. Movement rows are identical except `net_movement` replaces `current_balance`. Sign is already normalised by account type, quiet accounts return `0`, and inactive accounts are included with `is_active: false`.

**Affected area.** `lib/services/financeApi.ts`, `lib/types/finance.ts` (needs `AccountBalance` / `AccountMovement` — the existing `AccountTransactionBalance` has neither `account_code` nor `is_active`), `app/(dashboard)/finance/dashboard/page.tsx`, `MENU_ENDPOINTS.md`.

**Dependencies.** None — the endpoints exist. Do **not** delete the legacy client methods here; `T34` retires the routes once nothing calls them.

**Next action.** Add the two typed client methods and switch the dashboard's balance cards over. Label the card as a balance "as of" a date rather than tied to the range picker, since a balance is cumulative.

---

## P2 — Improvements

### FE9 — Single request helper in `lib/api.ts`

**Category:** P2 · **Status:** Open

**Problem.** `get`, `post`, `put`, `patch` and `delete` each repeat the same block: read the token, strip a `Bearer ` prefix, trim, build headers, fetch, hand off to `handleResponse`. Five copies, ~25 duplicated lines each.

**Why it matters.** Every auth change — `FE1`'s 401 handling, `FE7`'s refresh-and-retry — has to be written five times or it applies inconsistently.

**Affected area.** `lib/api.ts`.

**Dependencies.** Best done **before** `FE7`, so the retry logic has one home. Keep it separate from `FE1`: do not bundle a refactor with a behaviour fix.

**Next action.** One private `request(method, endpoint, body?, options?)`; the five exported methods become thin wrappers. Public signatures must not change.

---

### FE10 — Delete API clients for endpoints the backend does not expose

**Category:** P2 · **Status:** Open

**Problem.** `lib/api.ts` exports `dashboardApi`, `transactionsApi`, `paymentMethodsApi` and `accountsApi` (plus the legacy `categoriesApi` wrapper). None is imported anywhere under `app/` or `components/`, and the routes they call — `/dashboard/summary`, `/transactions`, `/payment-methods`, `/accounts` without the `/api/v1` prefix — are commented out in the backend's `cmd/endpoint.go`. They would 404 if called.

**Why it matters.** They read as available functionality. The real chart-of-accounts client is `accountsFinanceApi` in `lib/services/financeApi.ts`, and the near-identical `accountsApi` name is an easy wrong import.

**Affected area.** `lib/api.ts`, `lib/types.ts` (the types that become unused).

**Dependencies.** None. Verify nothing imports them at the time of deletion, not just today.

**Next action.** Delete the dead clients and their orphaned types. Keep `authApi`. Decide separately whether `categoriesApi` is still needed or whether every caller can use `masterCategoryApi` directly.

---

### FE11 — Consolidate the root markdown files into `docs/`

**Category:** P2 · **Status:** Open

**Problem.** Seven markdown files sit at the repo root — `README.md`, `README_FINANCE.md`, `FINANCE_MODULE.md`, `FINANCE_QUICK_REFERENCE.md`, `IMPLEMENTATION_SUMMARY.md`, `MENU_ENDPOINTS.md`, `TESTING_CHECKLIST.md` — roughly 1,900 lines with substantial overlap, and six of the seven are untracked in git.

**Why it matters.** Untracked docs are invisible to anyone else and vanish with the working directory. Four documents describing the same finance module guarantees at least three of them are wrong after the next change.

**Affected area.** Repo root, new `docs/` structure.

**Dependencies.** None.

**Next action.** Keep `README.md` at the root as the entry point. Move the rest under `docs/`, merge `README_FINANCE.md` / `IMPLEMENTATION_SUMMARY.md` / `FINANCE_QUICK_REFERENCE.md` into one module guide, keep `MENU_ENDPOINTS.md` (it is the screen-to-endpoint map and stays useful), and **commit them**. Delivery-log phrasing — "what has been delivered", "production-ready" — should not survive the merge; write present-tense current state.

---

### FE12 — Small-fixes cleanup bundle

**Category:** P2 · **Status:** Open

One session for the trivial, independent fixes. Deliberately bundled — none deserves its own ticket.

- `UserInfo.phone` is typed `string` in `lib/types.ts`, but the backend sends `phone` as nullable with `omitempty`, so it can be absent. Type it `string | null | undefined`.
- `TESTING_CHECKLIST.md` and `README_FINANCE.md` still instruct setting `localStorage.setItem('user_role', 'admin')` by hand. Roles have come from `/auth/me` since the login flow landed; the instructions are stale and now actively misleading.
- Debug `console.log` calls in `lib/authHelpers.ts` are dev-gated but noisy; decide whether they stay.
- `app/admin/` is an empty directory with no route in it.

**Dependencies.** None. The doc items overlap with `FE11` — do them in whichever lands first, not both.

---

## P3 — Later

### FE13 — Add a test setup and wire lint/build into CI

**Category:** P3 · **Status:** Open

**Problem.** No test runner, no test files, no CI. `package.json` has `dev`, `build`, `start`, `lint`; nothing runs automatically.

**Why it matters.** Same root cause the backend recorded as `T7`: every change is verified by hand, so regressions are found by users. The highest-value targets here are pure logic, not components — the permission helpers in `lib/authHelpers.ts` (around 40 `can*` functions, all branching on roles), the error mapping in `handleResponse`, and — once `FE7` lands — refresh-and-retry.

**Affected area.** New test config, `package.json`, CI workflow.

**Dependencies.** None, but more valuable after `FE7` exists to be tested.

**Next action.** Vitest plus Testing Library, start with `authHelpers`, add a CI job running `npm run lint` and `npm run build` on push.

---

## FEATURE — Finance UI restructure

The target shape is **Overview · Accounts · Transactions · Channels**, with channel as a reporting dimension rather than a top-level split — no separate "Shopee Finance" and "TikTok Finance" page trees, so adding Lazada or Blibli is data rather than new pages. The reasoning lives in the backend backlog under `T34`.

Order: **FE8 → FE14 / FE15 → FE16.**

### FE14 — Channels screen

**Category:** FEATURE · **Status:** Blocked on backend `T32`

Revenue, expense and net per channel over a date range, replacing the three near-identical ad-expense cards in `app/(dashboard)/finance/ad-dashboard/page.tsx`.

**Open question carried from the backend.** There is no marketplace fee account in the chart of accounts, so a "Fees" metric has no source data. The screen ships as Revenue / Expense / Net unless the accounts are created first — do not design a Fees column on the assumption it will exist.

---

### FE15 — Unified transactions screen

**Category:** FEATURE · **Status:** Blocked on backend `T33`

One transactions feed across all accounts and channels, filterable by account, channel and date — replacing the Shopee-only feed on the finance dashboard. The same endpoint backs the Accounts drill-down ("transactions affecting this account"), so one screen and one detail view come from one client method.

**Note.** `T33` is planned in the same backend session as `T15` (bounding report endpoints) and `T16` (rewriting the partner-account self-join). Pagination on this endpoint is part of that work, so the FE should not assume today's page/limit shape survives.

---

### FE16 — Restructure the Finance UI

**Category:** FEATURE · **Status:** Blocked on `FE8`, `FE14`, `FE15` · **Backend counterpart:** `T34`

| Screen | Answers | Backed by |
|---|---|---|
| **Overview** | Total Cash plus channel performance side by side | `FE8` + `FE14` |
| **Accounts** | "Where is my money?" — balance per account, drill down to its transactions | `FE8` + `FE15` |
| **Transactions** | Unified feed across accounts and channels | `FE15` |
| **Channels** | "Where is my activity coming from?" | `FE14` |

**Current state.** `app/(dashboard)/finance/` has `dashboard/`, `ad-dashboard/`, `accounts/`, `journal-entries/` and the supporting CRUD pages. The Shopee-specific report methods in `lib/services/financeApi.ts` are the last consumers of the legacy routes.

**Retire when unreferenced.** `shopee/current-balance`, `shopee/wallet/current-balance`, `shopee/transactions`. The `ad-expenses/*` routes stay until `T32` supersedes them. **Do not ask for a backend route to be deleted while `financeApi.ts` still calls it** — the backend is holding those routes open specifically for this FE.
