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
| [x] | FE1 | P0 | Global 401 handling — force re-login instead of dead UI | T28a |
| [x] | FE2 | P1 | Point dev builds at the right API base URL | — |
| [x] | FE3 | P1 | Fix logout leaving `user_roles` in `localStorage` | — |
| [x] | FE4 | P1 | Handle 429 from the login rate limiter | T28a |
| [x] | FE5 | P1 | Fix revoked-token detection (checks 403, backend sends 401) | T28a |
| [x] | FE6 | P1 | Route guard for `(dashboard)` — client session + silent refresh | — |
| [x] | FE7 | P1 | Refresh client — short access + HttpOnly cookie rotation | T28b |
| [x] | FE8 | P1 | Adopt account balance / movement endpoints | T31 |
| [x] | FE9 | P2 | Single request helper in `lib/api.ts` | — |
| [ ] | FE10 | P2 | Delete API clients for endpoints the backend does not expose | — |
| [x] | FE11 | P2 | Consolidate the root markdown files into `docs/` | — |
| [ ] | FE12 | P2 | Small-fixes cleanup bundle | — |
| [ ] | FE13 | P3 | Add a test setup and wire lint/build into CI | — |
| [ ] | FE14 | FEATURE | Channels screen | T32 |
| [ ] | FE15 | FEATURE | Unified transactions screen | T33 |
| [ ] | FE16 | FEATURE | Restructure Finance UI — Overview · Accounts · Transactions · Channels | T34 |
| [x] | FE17 | FEATURE | Phase A shell — sidebar IA + empty Overview/Accounts/Transactions/Channels | design |
| [x] | FE18 | FEATURE | Hierarchical sidebar IA — domain groups, section captions, Marketing split | design D6 |
| [x] | FE19 | FEATURE | Dark top-bar nav + domain hubs (Jubelio pattern, EcomHub features) | design D7 |
| [ ] | FE20 | P2 | Default list page size = 5 | — |
| [ ] | FE21 | FEATURE | Wire Home Dashboard ops KPIs (sales / profit / by-channel) | gaps G1–G3 |
| [ ] | FE22 | P1 | Wire paginated `ad-expenses/detail` | T15 |

**P0 left:** none (FE1 Done).

---

## Documentation impact — finishing a task is not done until the docs match

**This file is the single source of truth for FE task status.** When a task completes, update in the same change:

| Always | What to do |
|---|---|
| `docs/roadmap/task-list.md` | Set the task **Status** to `Done` **and** tick its row in the Checklist. Mandatory. |

| If the change touched | Also update |
|---|---|
| Which endpoint a screen calls | `docs/menu-endpoints.md` |
| A screen's behaviour, routes, or role rules | `docs/finance/module.md` (or the relevant module doc) |
| Manual verification steps | `docs/finance/testing-checklist.md` |
| Stable conventions (not status) | `AGENTS.md` / `.cursor/rules/` — principles only |

**Do not** delete a resolved task or renumber `FE*` IDs. Append a `**Done.** YYYY-MM-DD — …` line instead.

---

## P0 — Breaks users today

### FE1 — Global 401 handling: force re-login instead of dead UI

**Category:** P0 · **Status:** Done (2026-09-26) · **Driven by:** `T28a` (backend, Done 2026-09-10)

**Problem.** `T28a` changed the JWT claim set: tokens now carry `sub` / `iss` / `aud` / `type=access` and no longer carry `username` / `user_id`. Any token issued before that change is rejected by the backend middleware. The FE has no global 401 path:

- `handleResponse` in `lib/api.ts` turns a 401 into the string `"Unauthorized. Please login again."` and throws. Nothing clears the token, and nothing redirects.
- `lib/auth.ts` keeps the token in `sessionStorage` **and** a non-httpOnly `access_token` cookie, so the rejected token survives a reload.

The result for a user holding a stale token is every screen failing with an error banner and no way out except manually clearing storage.

**Why it matters.** This is the one defect that is user-visible right now, and it gets worse under `T28b`, where access tokens expire every ~15 minutes rather than daily.

**Affected area.** `lib/api.ts`, `lib/auth.ts`, `lib/authHelpers.ts`.

**Dependencies.** None. Should land **before** `FE7`, which builds the refresh flow on top of the same interception point.

**Done (2026-09-26):** After failed refresh (or hard 401/`93` on non-login routes), clear access token + user keys and `location.replace` to `/login?redirect=…`. Login / refresh / register 401s do not redirect. Implemented together with `FE7`.

---

## P1 — Important engineering work

### FE2 — Point dev builds at the right API base URL

**Category:** P1 · **Status:** Done

**Problem.** `lib/api.ts` defaults to the production API when the env var is unset:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ecomhub-core-production.up.railway.app';
```

There is no `.env.example` in the repo, so a fresh clone runs `npm run dev` against **production** without any signal that it is doing so.

**Why it matters.** This is a finance app. A local experiment — creating a journal entry, approving an expense — silently mutates real accounting data.

**Affected area.** `lib/api.ts`, new `.env.example`, `.gitignore`, `README.md`.

**Dependencies.** None.

**Next action.** Default to `http://localhost:4000` for development, keep the production URL supplied via `NEXT_PUBLIC_API_BASE_URL` in the Vercel project, and add `.env.example` documenting the variable. Note `.gitignore` currently ignores `.env*`, so committing the example needs a `!.env.example` negation. Surface the resolved base URL in the console during development so the target is never ambiguous.

**Done (2026-09-25):** fallback in `lib/api.ts` is now `http://localhost:4000`; `.env.example` + `.env.local` document `NEXT_PUBLIC_API_BASE_URL`; `.gitignore` allows committing `.env.example`; README covers local setup; resolved base URL is logged in development as `[api] base URL: …`. Production still supplies the Railway URL via Vercel env.

---

### FE3 — Fix logout leaving `user_roles` in `localStorage`

**Category:** P1 · **Status:** Done (2026-09-26)

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

**Done (2026-09-26):** `clearUserData()` removes `user_roles`, `user_role`, and `user_id`. Called from `logout()` and from the global session-clear path in `lib/api.ts`. Topbar uses `logout()` instead of only `clearToken()`.

---

### FE4 — Handle 429 from the login rate limiter

**Category:** P1 · **Status:** Done (2026-09-26) · **Driven by:** `T28a`

**Problem.** `T28a` added rate limiting to `POST /auth/login`: 20 requests/minute per IP and 10/minute per username, answered with HTTP 429 and `business_code` `"90"`. `handleResponse` has branches for 500+, 404, 401, 403 and 400 — nothing for 429, so the user sees the raw `HTTP error! status: 429`.

**Why it matters.** Someone who mistypes a password a few times gets an error that does not explain itself or say when to retry.

**Affected area.** `lib/api.ts`, `app/(auth)/login/page.tsx`.

**Dependencies.** None.

**Next action.** Add a 429 branch with a clear "too many attempts, try again in a minute" message. Consider disabling the submit button briefly after a 429 rather than letting the user hammer a limiter that counts every attempt.

**Done (2026-09-26):** `mapErrorMessage` handles HTTP 429 with a clear retry message (used by login via shared `request`). Optional submit cooldown left for later.

---

### FE5 — Fix revoked-token detection (checks 403, backend sends 401)

**Category:** P1 · **Status:** Done (2026-09-26) · **Driven by:** `T28a`

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

**Done (2026-09-26):** Revoked detection keys on `business_code === '93'` (or message text) independent of HTTP status; session clear + re-login follows via FE1/FE7 path.

---

### FE6 — Route guard for `(dashboard)`

**Category:** P1 · **Status:** Done (2026-09-26)

**Problem.** `app/(dashboard)/layout.tsx` renders `PageWrapper` with no authentication check, and the repo has no `middleware.ts`. `lib/auth.ts` writes the `access_token` cookie with the comment "for middleware access", but the middleware it was written for does not exist. An unauthenticated visitor loads the dashboard shell and only discovers the problem when each request fails.

**Why it matters.** Flash of a working-looking app followed by a wall of errors, and the login redirect currently only happens if a user manually navigates to `/login`.

**Affected area.** `app/(dashboard)/layout.tsx` or a new `middleware.ts`.

**Dependencies.** Decide alongside `FE1` — client-side guard and server-side middleware are two answers to the same question. Note the cookie is client-set and non-httpOnly, so middleware can read it but must not treat it as trustworthy; it is a routing hint, not authorisation.

**Next action.** Pick one mechanism and remove the other's leftovers. If middleware is chosen, the cookie stays and the guard is a redirect; if a client guard is chosen, drop the cookie and rely on `sessionStorage`.

**Done (2026-09-26):** Chose **client guard** (middleware is not viable after FE7 — access JWT is `sessionStorage` only; refresh is HttpOnly). `PageWrapper` already redirected when no access token; hardened to:

1. `ensureAccessToken()` in `lib/api.ts` — use existing access token, else single-flight `POST /auth/refresh` (same path as FE7) so a **new tab** can recover the session from the refresh cookie.
2. Encode `?redirect=` and bounce unauthenticated visitors to `/login`.
3. `/login` — if session already recoverable, redirect out (relative paths only; block open redirects).

No `middleware.ts`. Leftover access-token cookie write was already removed in FE7.
---

### FE7 — Refresh-token client: short access + HttpOnly cookie rotation

**Category:** P1 · **Status:** Done (2026-09-26) · **Driven by:** `T28b` (backend) · **Breaking**

**Contract (signed with backend T28b, 2026-09-21):**

| Piece | FE responsibility |
|---|---|
| Access token | JWT in memory / `sessionStorage` only — **not** a client-writable cookie. Sent as `Authorization: Bearer`. Response field renamed: `access_token` (was `token`). |
| Refresh token | **HttpOnly Secure SameSite cookie** set by the API — FE never reads or writes it. Every auth-related `fetch` must use `credentials: 'include'`. |
| Login / Register | Persist `access_token` (+ `expires_in`); cookie arrives automatically. |
| `POST /auth/refresh` | No body. Cookie sent automatically. Response: new `access_token` (+ cookie rotated). Call once on 401, then retry the original request. |
| `POST /auth/logout` | Cookie sent automatically; clear local access token. Backend revokes the refresh row. |
| Reuse detection | If refresh returns 401 after a reuse, treat as full logout — clear access, redirect to login. Do not loop. |

**Problem.** The FE assumes one long-lived token:

- `lib/auth.ts` stores one token and writes a non-httpOnly `access_token` cookie with a hardcoded 1-day expiry — wrong for a 15m access JWT and fights the new HttpOnly refresh cookie.
- `lib/api.ts` does not send `credentials: 'include'`, so the refresh cookie never leaves the browser on cross-origin calls (Vercel → Railway).
- No 401 → refresh → retry path; concurrent 401s would fire multiple rotations and trip reuse detection.

**Why it matters.** Without this, T28b logs users out every 15 minutes (or immediately, if cookies never attach).

**Affected area.** `lib/auth.ts`, `lib/api.ts`, `app/(auth)/login/page.tsx`, `lib/authHelpers.ts`, `lib/types.ts` (`LoginResponse`).

**Dependencies.** Backend `T28b` must be deployed (or running locally) with CORS `AllowCredentials` + explicit FE origin — `AllowOrigins: "*"` cannot coexist with credentialed cookies. Build on `FE1`'s single 401 interception point; do `FE9` (single request helper) first or in the same change so retry has one home.

**Production gate.** Backend ops + this task: [`ecomhub-core/docs/roadmap/production-cutover.md`](../../../ecomhub-core/docs/roadmap/production-cutover.md). **FE7 + FE1 are CRITICAL** for the T28b cutover; FE3/FE9 IMPORTANT in the same release.

**Next action.** After T28b lands:

1. Drop the client-set `access_token` cookie; keep access JWT in memory + `sessionStorage` only.
2. Add `credentials: 'include'` to all `fetch` calls in `lib/api.ts`.
3. On 401 (except login/refresh themselves): single-flight `POST /auth/refresh`, update access token, retry once.
4. Update login/register to read `access_token` / `expires_in`.
5. Logout: call API (cookie attaches), then clear local access + user keys (`FE3`).

**Done (2026-09-26):** All five steps above in `lib/auth.ts` + `lib/api.ts` + login page. Login reads `access_token`. Refresh is single-flight via raw `fetch` + cookie. Bundled with FE1/FE3/FE5/FE9.

---

### FE8 — Adopt account balance / movement endpoints

**Category:** P1 · **Status:** Done (2026-09-26) · **Driven by:** `T31` (backend, Done 2026-09-06)

**Problem.** `T31` established that the Shopee balance endpoints the finance dashboard calls are **period net movement filtered to one channel**, not cumulative balances, and shipped replacements:

| Endpoint | Meaning | Params |
|---|---|---|
| `GET /reports/dashboard/finance/accounts/balance` | Cumulative posted balance, all channels, cash subtree (Kas `1110`, Bank `1120`, E-Wallet `1130` + children) | `as_of` optional |
| `GET /reports/dashboard/finance/accounts/movement` | Net posted movement in a date range | `start_date`, `end_date` required; `channel` optional |

`app/(dashboard)/finance/dashboard/page.tsx` still calls `getCurrentBalanceBankShopee` and `getCurrentBalanceShopeeWallet`. The legacy routes were deliberately kept alive for the FE until `T34`.

**What the figures do.** `T31`'s verification found that under the FE's current default range the new and old numbers **agree** for the cash subtree, so this is a semantics fix, not a restatement — but the old queries drop any opening balance before `start_date`, so they will diverge as history grows. Treat the switch as a change to numbers on screen and eyeball both before and after.

**Response shape.** Both return an array; balance rows are `account_code`, `account_name`, `account_type`, `is_active`, `total_debit`, `total_credit`, `current_balance`. Movement rows are identical except `net_movement` replaces `current_balance`. Sign is already normalised by account type, quiet accounts return `0`, and inactive accounts are included with `is_active: false`.

**Done (2026-09-26):** Added `AccountBalance` / `AccountMovement` types and `financeReportsApi.getAccountBalances` / `getAccountMovements`. Wired **Finance → Overview** (Total cash as sum of T31 balance rows + period debit/credit/net from movement; as-of + range pickers) and **Finance → Accounts** (`/finance/balances` table). Channel strip / Fees stay empty (G4/G5/G7). Legacy Shopee methods kept for `/finance/dashboard` until FE16. Sign not re-negated in the UI.

**Not done here.** Switching or deleting the unlinked legacy dashboard page; channel performance (FE14); transaction drill-down (FE15).

**Manual check.** Compare Overview Total cash and Accounts rows against the same `as_of` via API (or legacy dashboard under a long history range where opening balance matters).

---

## P2 — Improvements

### FE9 — Single request helper in `lib/api.ts`

**Category:** P2 · **Status:** Done (2026-09-26)

**Problem.** `get`, `post`, `put`, `patch` and `delete` each repeat the same block: read the token, strip a `Bearer ` prefix, trim, build headers, fetch, hand off to `handleResponse`. Five copies, ~25 duplicated lines each.

**Why it matters.** Every auth change — `FE1`'s 401 handling, `FE7`'s refresh-and-retry — has to be written five times or it applies inconsistently.

**Affected area.** `lib/api.ts`.

**Dependencies.** Best done **before** `FE7`, so the retry logic has one home. Keep it separate from `FE1`: do not bundle a refactor with a behaviour fix.

**Next action.** One private `request(method, endpoint, body?, options?)`; the five exported methods become thin wrappers. Public signatures must not change.

**Done (2026-09-26):** Single `request()` with credentials, refresh, and error mapping; `get/post/put/patch/delete` are thin wrappers. Landed with FE7.

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

**Category:** P2 · **Status:** Done

**Problem.** Seven markdown files sit at the repo root — `README.md`, `README_FINANCE.md`, `FINANCE_MODULE.md`, `FINANCE_QUICK_REFERENCE.md`, `IMPLEMENTATION_SUMMARY.md`, `MENU_ENDPOINTS.md`, `TESTING_CHECKLIST.md` — roughly 1,900 lines with substantial overlap, and six of the seven are untracked in git.

**Why it matters.** Untracked docs are invisible to anyone else and vanish with the working directory. Four documents describing the same finance module guarantees at least three of them are wrong after the next change.

**Affected area.** Repo root, new `docs/` structure.

**Dependencies.** None.

**Next action.** Keep `README.md` at the root as the entry point. Move the rest under `docs/`, merge `README_FINANCE.md` / `IMPLEMENTATION_SUMMARY.md` / `FINANCE_QUICK_REFERENCE.md` into one module guide, keep `MENU_ENDPOINTS.md` (it is the screen-to-endpoint map and stays useful), and **commit them**. Delivery-log phrasing — "what has been delivered", "production-ready" — should not survive the merge; write present-tense current state.

**Done (2026-09-26):** Kept root `README.md`. Merged finance delivery notes into `docs/finance/module.md` (present tense; covers current screens including journal / capital / ad / dashboards). Moved endpoint map to `docs/menu-endpoints.md` and checklist to `docs/finance/testing-checklist.md` (removed stale localStorage role instructions). Deleted `README_FINANCE.md`, `FINANCE_MODULE.md`, `FINANCE_QUICK_REFERENCE.md`, `IMPLEMENTATION_SUMMARY.md`, and the old root copies of the moved files. Updated `AGENTS.md` / docs-impact paths.

---

### FE12 — Small-fixes cleanup bundle

**Category:** P2 · **Status:** Open

One session for the trivial, independent fixes. Deliberately bundled — none deserves its own ticket.

- `UserInfo.phone` is typed `string` in `lib/types.ts`, but the backend sends `phone` as nullable with `omitempty`, so it can be absent. Type it `string | null | undefined`.
- ~~`TESTING_CHECKLIST.md` and `README_FINANCE.md` still instruct setting `localStorage.setItem('user_role', 'admin')` by hand.~~ **Done with FE11 (2026-09-26):** those docs were removed/rewritten; checklist now says login via `/auth/me`.
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

The target shape is **Overview · Accounts · Transactions · Channels**, with channel as a reporting dimension rather than a top-level split — no separate "Shopee Finance" and "TikTok Finance" page trees, so adding Lazada or Blibli is data rather than new pages. The reasoning lives in the backend backlog under `T34`. Design decisions: [`../design/jubelio-reference-ux.md`](../design/jubelio-reference-ux.md).

Order: **FE17 (shell) → FE8 → FE14 / FE15 → FE16 (wire real data / retire legacy).**

### FE17 — Phase A shell: sidebar IA + empty finance pillars

**Category:** FEATURE · **Status:** Done (2026-09-26)

**Problem.** Home Dashboard and Finance were tangled (Finance/Ad dashboards under Dashboard; Finance hub tiles; no Overview · Accounts · Transactions · Channels routes).

**Done (2026-09-26):** Sidebar IA per locked decisions D2–D5 — home `/dashboard` (empty ops KPIs), Finance peers Overview / Accounts (`/finance/balances`) / Transactions / Channels / Ad Expenses + CRUD; `/finance` → Overview; Chart of Accounts stays under Master; legacy `/finance/dashboard` unlinked; slate canvas chrome. Empty slots use `—` / gap ids (G1–G7), no invented figures.

**Next.** FE8 wires balances/overview cash; FE14/FE15 fill Channels/Transactions when T32/T33 land; FE16 retires legacy Shopee dashboard consumers.

---

### FE18 — Hierarchical sidebar IA (domain groups)

**Category:** FEATURE · **Status:** Done (2026-09-26) · **Decision:** `D6` in [`../design/jubelio-reference-ux.md`](../design/jubelio-reference-ux.md)

**Problem.** After `FE17` the sidebar was still close to a flat list, `Master Data` mixed product categories with accounting setup, and every planned integration (Shopee Open API, other channels) would have added another top-level entry. Developer asked for Jubelio-style **grouping** while explicitly keeping the dark sidebar and EcomHub's visual identity — grouping as UX inspiration, not a visual clone.

**Done (2026-09-26):** Top level is now `Dashboard · Finance · Marketing · Catalog`. Finance is subdivided by non-clickable section captions (`Views` / `Records` / `Setup`), so depth stays at two clickable levels. `Master Data` retired: Categories → Catalog, accounting setup → Finance › Setup. Ads moved to a top-level **Marketing** group **and** to matching routes — `/marketing/ad-budgets`, `/marketing/ad-expenses`. Unbuilt areas (Products, Inventory, Operations, Integrations, Settings) are deliberately not rendered.

**Note (2026-09-26):** Temporary `/finance/ad-*` → `/marketing/*` redirects in `next.config.ts` were removed; ads are Marketing routes only.

**Not changed.** No page logic, service client, API call, or role predicate. Page files were moved, not rewritten.

**Follow-ups.** `/master/categories` → `/catalog/categories` rename (needs redirect); retire the unlinked `/master` page and `/finance/dashboard` once nothing needs them; decide whether Inventory graduates to its own group when Products land.

~~Layout chrome superseded by **FE19** / **D7**~~ — domain grouping and Marketing routes from FE18 remain.

---

### FE19 — Dark top-bar nav + domain hubs

**Category:** FEATURE · **Status:** Done (2026-09-26) · **Decision:** `D7` in [`../design/jubelio-reference-ux.md`](../design/jubelio-reference-ux.md)

**Problem.** FE18 put Jubelio-style *grouping* into a sidebar. The intended reference was Jubelio's **navigation layout**: domains on a top bar, domain click → hub of cards, caret → dropdown shortcuts — while keeping EcomHub's dark identity on that bar and EcomHub's own features.

**Done (2026-09-26):** Removed `Sidebar` / `Topbar`. Added `AppNav` (dark top bar), `DomainHub`, and `lib/nav.ts`. Hubs at `/finance`, `/marketing`, `/catalog`; Finance setup at `/finance/setup`. `/finance` is a hub again (reverses D3). No page CRUD/report logic, service client, or API call changed.

---

### FE14 — Channels screen

**Category:** FEATURE · **Status:** Blocked on backend `T32`

Revenue, expense and net per channel over a date range, replacing the three near-identical ad-expense cards in `app/(dashboard)/marketing/ad-expenses/page.tsx` (moved there by `FE18`).

**Open question carried from the backend.** There is no marketplace fee account in the chart of accounts, so a truthful "Fees" amount has no source. **FE direction (2026-09-25):** the Channels layout **may** reserve a Fees row/label with a **null / empty** value; do not invent fees client-side. Tracked as gap **G4** in [`../design/ui-backend-gaps.md`](../design/ui-backend-gaps.md). Revenue / Expense / Net stay empty until `T32` lands (gap **G5**).

---

### FE15 — Unified transactions screen

**Category:** FEATURE · **Status:** Blocked on backend `T33`

One transactions feed across all accounts and channels, filterable by account, channel and date — replacing the Shopee-only feed on the finance dashboard. The same endpoint backs the Accounts drill-down ("transactions affecting this account"), so one screen and one detail view come from one client method.

**Note.** `T33` is planned in the same backend session as `T15` (bounding report endpoints) and `T16` (rewriting the partner-account self-join). Pagination on this endpoint is part of that work, so the FE should not assume today's page/limit shape survives.

---

### FE16 — Restructure the Finance UI

**Category:** FEATURE · **Status:** Blocked on `FE8`, `FE14`, `FE15` · **Backend counterpart:** `T34` · **Shell:** `FE17` Done

| Screen | Answers | Backed by | Route (shell) |
|---|---|---|---|
| **Overview** | Total Cash plus channel performance side by side | `FE8` + `FE14` | `/finance/overview` |
| **Accounts** | "Where is my money?" — balance per account, drill down to its transactions | `FE8` + `FE15` | `/finance/balances` (CoA remains `/finance/accounts`) |
| **Transactions** | Unified feed across accounts and channels | `FE15` | `/finance/transactions` |
| **Channels** | "Where is my activity coming from?" | `FE14` | `/finance/channels` |

**Current state (after FE17 / FE19).** Shell routes and top-bar hubs exist with empty placeholders. Legacy Shopee summary at `/finance/dashboard` is **unlinked** (not a v2 nav destination).

**Where the old “Finance Dashboard” totals go in v2**

| Old behaviour | v2 home | Tasks that fill it |
|---|---|---|
| Cash / balance cards | **Finance → Overview** (`/finance/overview`) + **Accounts** (`/finance/balances`) | `FE8` (T31), then Overview polish in this task |
| Channel activity | **Finance → Channels** (+ strip on Overview) | `FE14` (T32) |
| Transaction list | **Finance → Transactions** | `FE15` (T33) |
| Shopee-only page | retired | this task (`FE16`) once nothing calls the legacy routes |

So v2 does **not** keep a single “Finance Dashboard” nav item. The purpose splits across Overview / Accounts / Transactions / Channels. Until those are wired, Overview is an empty shell; the old page still exists only as a URL for migration.

Wire real data in FE8/FE14/FE15; FE16 finishes migration and retirement of `/finance/dashboard` + legacy `shopee/*` client calls.

**Retire when unreferenced.** `shopee/current-balance`, `shopee/wallet/current-balance`, `shopee/transactions`. The `ad-expenses/*` routes stay until `T32` supersedes them. **Do not ask for a backend route to be deleted while `financeApi.ts` still calls it** — the backend is holding those routes open specifically for this FE.

---

### FE20 — Default list page size = 5

**Category:** P2 · **Status:** Open

**Problem.** List screens (journal entries, accounts, operational expenses, categories, ad budgets, capital investors, etc.) use `DEFAULT_PAGE_SIZE = 10` from `lib/utils/pagination.ts`, and `PAGE_SIZE_OPTIONS` starts at 10. With growing data the first paint feels like “everything showed up”; product wants the default denser at **5** rows.

**Next action.** Change `DEFAULT_PAGE_SIZE` to `5`, add `5` to `PAGE_SIZE_OPTIONS` (e.g. `[5, 10, 20, 50, 100]`), confirm every list that uses those constants picks up the new default without per-page hardcodes. Update `docs/finance/testing-checklist.md` if it asserts page size.

**Not in scope.** Changing backend default limits; inventing pagination on screens that still call unbound `getAll()` for dropdowns only.

---

### FE21 — Wire Home Dashboard ops KPIs

**Category:** FEATURE · **Status:** Open · **Gaps:** G1–G3 in [`../design/ui-backend-gaps.md`](../design/ui-backend-gaps.md)

**Problem.** Top-bar **Dashboard** (`/dashboard`) is the ops / profit pulse (Gross sales, Discount, Returns, Net sales, Profit, COGS/ads, trend, by-channel). Shell exists (FE17) but every slot is empty. This is **not** the old Finance Dashboard — that maps to Finance Overview (see FE16). Home Dashboard needs report APIs that do not exist yet; definitions still open under design D1.

**Next action.** When KPI definitions + endpoints are agreed, wire `/dashboard` only — do not invent figures client-side. Until then keep `—` / gap ids.

**Dependencies.** Backend report work (not yet a single `T*` for ops GMV); do not block Finance Overview (`FE8` / `FE14`) on this.

---

### FE22 — Wire paginated `ad-expenses/detail`

**Category:** P1 · **Status:** Open · **Blocked on backend `T15`**

**Problem.** `GET …/ad-expenses/detail` today returns an unbounded array. Backend **T15** will change it to the same paginated envelope as `shopee/transactions` (`page` / `limit` → `PaginatedResponse`). Until then the FE cannot safely page the detail table.

**Affected area.** `lib/services/financeApi.ts` (`getAdExpensesDetail`), `app/(dashboard)/marketing/ad-expenses/page.tsx`, legacy `app/(dashboard)/finance/ad-dashboard/page.tsx` if still reachable.

**Next action.** After T15 lands: pass `page`/`limit`, unwrap `results` + totals, add the shared `Pagination` control. Do not invent client-side slicing of the old unbounded response.

**Not in scope.** Date-span validation UX (backend rejects); retiring the ad-expenses cards when T32/FE14 land.
