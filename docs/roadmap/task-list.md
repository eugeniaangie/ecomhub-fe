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
| [x] | FE10 | P2 | Delete API clients for endpoints the backend does not expose | — |
| [x] | FE11 | P2 | Consolidate the root markdown files into `docs/` | — |
| [x] | FE12 | P2 | Small-fixes cleanup bundle | — |
| [x] | FE13 | P3 | Add a test setup and wire lint/build into CI | — |
| [ ] | FE14 | FEATURE | Channels screen | T32 **Deferred** |
| [x] | FE15 | FEATURE | Unified transactions screen | T33 Done |
| [ ] | FE16 | FEATURE | Restructure Finance UI — Overview · Accounts · Transactions · Channels | T34 |
| [x] | FE17 | FEATURE | Phase A shell — sidebar IA + empty Overview/Accounts/Transactions/Channels | design |
| [x] | FE18 | FEATURE | Hierarchical sidebar IA — domain groups, section captions, Marketing split | design D6 |
| [x] | FE19 | FEATURE | Dark top-bar nav + domain hubs (Jubelio pattern, EcomHub features) | design D7 |
| [x] | FE20 | P2 | Default list page size = 5 | — |
| [ ] | FE21 | FEATURE | Wire Home Dashboard ops KPIs (sales / profit / by-channel) | gaps G1–G3 |
| [x] | FE22 | P1 | Wire paginated `ad-expenses/detail` | T15 Done |
| [x] | FE23 | P1 | Finance Overview framing — balance as hero, cash flow clearly not a balance | — |
| [x] | FE24 | FEATURE | Shopee OAuth callback + Connect UI | Core F6a |
| [x] | FE25 | FEATURE | Shopee orders preview / mini-recap UI | Core F6b0 |
| [ ] | FE26 | FEATURE | Progressive Shopee preview (SKU/buyer first, escrow second) | Core F6b0.1 |
| [ ] | FE27 | P3 | Responsive / narrow-viewport layout (phone-sized window) | UX |
| [x] | FE28 | FEATURE | Shopee Returns page | Core F6d |
| [x] | FE29 | FEATURE | Shopee Ads spend card on Sales overview | Core F6e |

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

**Category:** P2 · **Status:** Done (2026-09-26)

**Problem.** `lib/api.ts` exports `dashboardApi`, `transactionsApi`, `paymentMethodsApi` and `accountsApi` (plus the legacy `categoriesApi` wrapper). None is imported anywhere under `app/` or `components/`, and the routes they call — `/dashboard/summary`, `/transactions`, `/payment-methods`, `/accounts` without the `/api/v1` prefix — are commented out in the backend's `cmd/endpoint.go`. They would 404 if called.

**Why it matters.** They read as available functionality. The real chart-of-accounts client is `accountsFinanceApi` in `lib/services/financeApi.ts`, and the near-identical `accountsApi` name is an easy wrong import.

**Affected area.** `lib/api.ts`, `lib/types.ts` (the types that become unused).

**Dependencies.** None. Verify nothing imports them at the time of deletion, not just today.

**Next action.** Delete the dead clients and their orphaned types. Keep `authApi`. Decide separately whether `categoriesApi` is still needed or whether every caller can use `masterCategoryApi` directly.

**Done (2026-09-26):** Removed `dashboardApi`, `transactionsApi`, `paymentMethodsApi`, `accountsApi`, and legacy `categoriesApi` from `lib/api.ts`. Kept `authApi` and `masterCategoryApi` (all category screens already use the latter). Deleted orphaned types from `lib/types.ts`: `Transaction*` / `Category` / `PaymentMethod` / legacy `Account` / `DashboardSummary`.

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

**Category:** P2 · **Status:** Done (2026-09-26)

One session for the trivial, independent fixes. Deliberately bundled — none deserves its own ticket.

- `UserInfo.phone` is typed `string` in `lib/types.ts`, but the backend sends `phone` as nullable with `omitempty`, so it can be absent. Type it `string | null | undefined`.
- ~~`TESTING_CHECKLIST.md` and `README_FINANCE.md` still instruct setting `localStorage.setItem('user_role', 'admin')` by hand.~~ **Done with FE11 (2026-09-26):** those docs were removed/rewritten; checklist now says login via `/auth/me`.
- Debug `console.log` calls in `lib/authHelpers.ts` are dev-gated but noisy; decide whether they stay.
- `app/admin/` is an empty directory with no route in it.

**Dependencies.** None. The doc items overlap with `FE11` — do them in whichever lands first, not both.

**Done (2026-09-26):** `UserInfo.phone` → `phone?: string | null`. Removed debug `console.log` / `console.warn` from `getUserRoles` and `hasAnyRole`. Deleted empty `app/admin/` (and nested `categories/`). Doc item already done via FE11.

---

## P3 — Later

### FE13 — Add a test setup and wire lint/build into CI

**Category:** P3 · **Status:** Done (2026-09-29)

**Problem.** No test runner, no test files, no CI. `package.json` has `dev`, `build`, `start`, `lint`; nothing runs automatically.

**Why it matters.** Same root cause the backend recorded as `T7`: every change is verified by hand, so regressions are found by users. The highest-value targets here are pure logic, not components — the permission helpers in `lib/authHelpers.ts` (around 40 `can*` functions, all branching on roles), the error mapping in `handleResponse`, and — once `FE7` lands — refresh-and-retry.

**Affected area.** New test config, `package.json`, CI workflow.

**Dependencies.** None, but more valuable after `FE7` exists to be tested.

**Next action.** Vitest plus Testing Library, start with `authHelpers`, add a CI job running `npm run lint` and `npm run build` on push.

**Done (2026-09-29):** Vitest + jsdom + Testing Library (`vitest.config.ts`, `vitest.setup.ts`). Scripts: `npm test` / `npm run test:watch`. Seed suite `lib/authHelpers.test.ts` (roles storage, `hasAnyRole` / admin checks, journal + operational-expense permission edges). CI: `.github/workflows/ci.yml` runs `lint` → `test` → `build` on push/PR to `main`/`master`. `handleResponse` / refresh-retry coverage deferred to a follow-up when worth extracting testable units. **Config note (same day):** dropped `@vitejs/plugin-react` / `vite-tsconfig-paths` — they pulled Vite 8 types against Vitest’s Vite 7; path alias `@` is set in `vitest.config.ts` instead.

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

**Category:** FEATURE · **Status:** Deferred · **Was blocked on backend `T32`**

Revenue, expense and net per channel over a date range, replacing the three near-identical ad-expense cards in `app/(dashboard)/marketing/ad-expenses/page.tsx` (moved there by `FE18`).

**Open question carried from the backend.** There is no marketplace fee account in the chart of accounts, so a truthful "Fees" amount has no source. **FE direction (2026-09-25):** the Channels layout **may** reserve a Fees row/label with a **null / empty** value; do not invent fees client-side. Tracked as gap **G4** in [`../design/ui-backend-gaps.md`](../design/ui-backend-gaps.md). Revenue / Expense / Net stay empty until `T32` lands (gap **G5**).

**Deferred (2026-09-29):** Backend **T32** deferred — do not wire Channels to "P&L by `je.channel`". That tag is for classifying journals, not true Shopee/TikTok marketplace performance. Keep the Channels / Overview channel strip as empty placeholders (G5/G7). Real channel metrics later via marketplace/ads integrations; until then Ad Expenses page stays the interim ads view.

---

### FE15 — Unified transactions screen

**Category:** FEATURE · **Status:** Done (2026-09-29) · **Backend:** T33 Done (2026-09-29)

One transactions feed across all accounts and channels, filterable by account, channel and date — replacing the Shopee-only feed on the finance dashboard. The same endpoint backs the Accounts drill-down ("transactions affecting this account"), so one screen and one detail view come from one client method.

**Note.** Backend **T15** is Done (2026-09-26) — report date parse + paginated `ad-expenses/detail` / `shopee/transactions` with `COUNT(*) OVER ()`. ~~**T33** / **T16** remain open.~~

**Backend (T33 Done, 2026-09-29):** `GET /reports/dashboard/finance/transactions?start_date&end_date&page&limit` with optional `channel` (JE tag) and `account_code`. Envelope = `PaginatedResponse` of `AccountTransaction` (includes `channel`). Legacy `shopee/transactions` still exists until FE16 retires it.

**Next action.** Add client method + wire `/finance/transactions` and Accounts drill-down; do not invent client-side paging of the old Shopee-only feed.

**Done (2026-09-29):** `financeReportsApi.getTransactions` + `channel` on `AccountTransaction`. `/finance/transactions` — date range (default ledger start → today), channel-tag + account filters, pagination, This month / From start. Accounts (`/finance/balances`) links code/name → `?account_code=`. Gap **G6** closed for FE wiring. Legacy Shopee feed still on unlinked `/finance/dashboard` until FE16.
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

**Category:** P2 · **Status:** Done (2026-09-29)

**Problem.** List screens (journal entries, accounts, operational expenses, categories, ad budgets, capital investors, etc.) use `DEFAULT_PAGE_SIZE = 10` from `lib/utils/pagination.ts`, and `PAGE_SIZE_OPTIONS` starts at 10. With growing data the first paint feels like “everything showed up”; product wants the default denser at **5** rows.

**Next action.** Change `DEFAULT_PAGE_SIZE` to `5`, add `5` to `PAGE_SIZE_OPTIONS` (e.g. `[5, 10, 20, 50, 100]`), confirm every list that uses those constants picks up the new default without per-page hardcodes. Update `docs/finance/testing-checklist.md` if it asserts page size.

**Not in scope.** Changing backend default limits; inventing pagination on screens that still call unbound `getAll()` for dropdowns only.

**Done (2026-09-29):** `DEFAULT_PAGE_SIZE = 5`; `PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]`. All list screens that `useState(DEFAULT_PAGE_SIZE)` pick it up; no per-page hardcodes of `10` found. Testing checklist had no page-size assertion to rewrite.

---

### FE21 — Wire Home Dashboard ops KPIs

**Category:** FEATURE · **Status:** Open · **Gaps:** G1–G3 in [`../design/ui-backend-gaps.md`](../design/ui-backend-gaps.md)

**Problem.** Top-bar **Dashboard** (`/dashboard`) is the ops / profit pulse (Gross sales, Discount, Returns, Net sales, Profit, COGS/ads, trend, by-channel). Shell exists (FE17) but every slot is empty. This is **not** the old Finance Dashboard — that maps to Finance Overview (see FE16). Home Dashboard needs report APIs that do not exist yet; definitions still open under design D1.

**Next action.** When KPI definitions + endpoints are agreed, wire `/dashboard` only — do not invent figures client-side. Until then keep `—` / gap ids.

**Dependencies.** Backend report work (not yet a single `T*` for ops GMV); do not block Finance Overview (`FE8` / `FE14`) on this.

---

### FE22 — Wire paginated `ad-expenses/detail`

**Category:** P1 · **Status:** Done (2026-09-29) · **Backend:** T15 Done (2026-09-26)

**Problem.** ~~`GET …/ad-expenses/detail` today returns an unbounded array. Backend **T15** will change it to the same paginated envelope as `shopee/transactions` (`page` / `limit` → `PaginatedResponse`). Until then the FE cannot safely page the detail table.~~

**Backend (T15 Done, 2026-09-26):**
- Response is `PaginatedResponse` (`data.results`, `page`, `limit`, `total_*`); query params `page` / `limit` (same pattern as `shopee/transactions`). Bare-array callers break until this task wires them.
- Report dates: required `YYYY-MM-DD`, `end_date >= start_date` → `CODE_ERR_VALIDATION` (400). Optional `as_of` on balances parsed the same way.
- **Deferred on BE (Phase 5 — not a FE blocker):** no maximum date-range cap yet. Decade-wide ranges still accepted by the API; do not build FE UX that assumes a max-span error until the backend ships one.

**Affected area.** `lib/services/financeApi.ts` (`getAdExpensesDetail`), `app/(dashboard)/marketing/ad-expenses/page.tsx`. Legacy `app/(dashboard)/finance/ad-dashboard` no longer exists (routes live under Marketing).

**Next action.** Pass `page`/`limit`, unwrap `results` + totals, add the shared `Pagination` control. Do not invent client-side slicing of the old unbounded response. Surface backend date validation errors as-is (400) — no max-span messaging until BE Phase 5.

**Not in scope.** Inventing a client-side max date-range; retiring the ad-expenses cards when T32/FE14 land.

**Done (2026-09-29):** `getAdExpensesDetail` takes `page`/`limit` and returns `PaginatedResponseFinance<AccountTransaction>`. Marketing Ad Expenses: summary cards stay date-scoped; detail table uses shared `Pagination` (default page size from FE20). Date changes reset to page 1. Backend 400 validation messages shown as-is.

---

### FE23 — Finance Overview framing: balance as hero, cash flow clearly not a balance

**Category:** P1 · **Status:** Done (2026-09-29) · **Backend:** none (presentation only, T31 endpoints unchanged)

**Problem.** Developer read the Overview / Accounts figures as "the shop has done Rp 80-something million" when the real cash position was Rp 1.702.732. The numbers were correct; the framing invited the wrong reading:

- `Total cash` was rendered at `text-2xl` while `In (debit)` / `Out (credit)` were `text-xl` — only one step apart, so the much longer movement digits (Neobank debit Rp 43.320.649 + Shopee Wallet debit Rp 44.874.967 ≈ Rp 88 jt) dominated the page over a Rp 1,7 jt balance.
- `Total cash` sat in a three-column row with two grey `GapPlaceholder` slots (G4/G5), so the hero row looked like the empty row and the movement row looked like the real data.
- Labels `In (debit)` / `Out (credit)` / `Net movement` are accounting vocabulary; the "this is not a balance" caveat was `text-xs text-gray-400` **below** the figures.
- Overview showed no per-account balances, so the only on-screen comparison for the large movement totals lived on another page.

**Why it matters.** Money that *passed through* a cash account is unbounded by the balance — a rekening can cycle Rp 88 jt and hold Rp 1,7 jt. Presenting both at near-equal visual weight, with the larger one unlabelled in plain language, reads as revenue or business size to a non-accountant.

**Verified (2026-09-29, read-only SQL against live DB).** Cash subtree, `as_of = 2026-09-29`, movement range `2025-11-01 → 2026-09-29`: Neobank balance **Rp 1.851.254** (debit 43.320.649 / credit 41.469.395), Shopee Seller Wallet **−Rp 148.522** (debit 44.874.967 / credit 45.023.489), all other cash accounts 0. Total cash **Rp 1.702.732**. The movement query joins `journal_entry_lines → journal_entries` per `account_id` only — **no double counting**; the pasted 43 jt / 44 jt figures were the Period movement table, not the Balances table.

**Done (2026-09-29):** `app/(dashboard)/finance/overview/page.tsx` only — presentation, no new endpoint, no figure recomputed in the UI, sign still not re-negated.

1. `Total cash` is a full-width hero at `text-4xl`, wrapped in a `Link` to `/finance/balances`, with plain-language subtitle ("What is actually left in Kas + Bank + E-Wallet, cumulative through the as-of date").
2. Per-account balance breakdown (`account_code` · `account_name` · `current_balance`) rendered inside the hero from the same `getAccountBalances` rows, so Rp 1.851.254 / −Rp 148.522 are visible without leaving Overview. All in-scope rows are shown, including zeros — nothing filtered.
3. Movement cards demoted to `text-lg` and relabelled **Money in** / **Money out** / **Net change**, with `debit` / `credit` / `in minus out` as sub-captions. Card title now states it explicitly: "Cash flow in this period — money that moved, not your balance".
4. `GapPlaceholder` slots (G4/G5) moved to their own two-column row so they no longer share the hero row.
5. Page description rewritten to lead with the balance/flow distinction; also corrected the stale "Channel strip waits on T32" to "T32 deferred" (T32 was deferred 2026-09-29).

**Follow-up (2026-09-29):** G4/G5 Overview slots first marked `disabled` on `GapPlaceholder`, then **commented out of the render tree** after the grey cards still cluttered the page — JSX left in place with a note; `GapPlaceholder` import parked beside it. Re-enable by uncommenting both. `EmptyPanel` Channel performance below is unchanged. `disabled` prop on `GapPlaceholder` remains for other screens. Same day: Total cash hero downsized (`text-2xl`, tighter padding) and per-account rows as compact `text-xs` notes so Cash flow fits above the fold without scrolling. Labels restored to In (debit) / Out (credit) / Net movement. **(2026-09-30):** Period movement In/Out/Net cards link to `/finance/transactions?start_date&end_date` for the current range; Transactions reads those URL params (with `account_code`).

**Rejected.** Channel filter on the Overview cash-flow card — `/accounts/balance` has no `channel` parameter by design (T27 sign-off rule 2: balance is all channels), a bank balance is not channel-specific, and `je.channel` is a bookkeeping tag rather than marketplace performance (Core Decision 13 / T32 Deferred). Developer chose to skip it (2026-09-29) rather than add a channel figure that reads as channel performance.

**Validated.** `npm run lint` and `npm run build` clean. Figures come from the same two endpoints as before, so no displayed value changed — only size, label and placement. **Unverified:** visual layout in a browser at each breakpoint (no test suite; needs manual check per the checklist).

---

### FE24 — Shopee OAuth callback + Connect UI

**Category:** FEATURE · **Status:** Done · **Backend:** F6a (Done 2026-09-30)

**Problem.** Shopee Partner OAuth must redirect to our FE after shop approval. Redirect URL is locked (2026-09-30):

- Full path: `https://ecomhub-fe.vercel.app/shopee-auth-callback`
- Partner Console Live Redirect URL Domain: `ecomhub-fe.vercel.app` (domain only — fill in Shopee console manually)

**Scope (when unblocked):**
1. App Router page `app/.../shopee-auth-callback` — read `code` + `shop_id` from query; later POST to Core token-exchange (F6a3).
2. Connect Shopee control (admin / superadmin only for now) that opens the signed authorize URL from Core F6a1.
3. Role note: Core roles today are `superadmin` / `admin` / `manager` only — interim Connect gate = admin+. Ads-operator access without full admin is a later product decision (no `ads-manager` role yet).

**Next action.** Sales sync = Core F6b.

**Done (2026-09-30):**
- `shopeeAuthApi.getAuthorizeUrl` → Core authorize-url.
- **Integrations** domain in top nav: hub `/integrations`, **Shopee** `/integrations/shopee` with Connect (gated by `canConnectShopeeShop` = admin/superadmin) — same-tab `window.location.assign(authorize_url)`.
- Callback `/shopee-auth-callback` reads `code` + `shop_id` and **POSTs** `shopeeAuthApi.exchangeToken` (Core F6a3). Shows connected shop id / token expiry — not raw tokens.
- **Done (2026-09-30):** `shopeeAuthApi.listConnectedShops` + Integrations page shows active shops / Re-connect (not a blank Connect every visit).

**Not done here.** Automatic RefreshAccessToken before sales sync (F6b); non-admin operator role.

---

### FE25 — Shopee orders preview / mini-recap UI

**Category:** FEATURE · **Status:** Done · **Backend:** Core **F6b0** (Done 2026-09-30; escrow + `fetch_all` / `order_status` / totals / `sku_summary`)

**Problem.** Shop is connectable (FE24) but operators still hit Core/Postman for live order + escrow numbers. Need a thin Integrations UI for month-ish preview before full F6b1 formulas / recap screen.

**API (do not invent shapes — read Core handler):**
```http
GET /api/v1/integrations/marketplaces/shopee/orders/preview
  ?shop_id=&time_from=&time_to=&fetch_all=true&order_status=COMPLETED
```
- `total_escrow_amount`, `total_buyer_amount`, `order_count`
- `sku_summary[]`: `sku`, `quantity`, `order_count`
- `orders[]`: per-order `escrow_amount`, status, SKUs, …
- Span: ≤15d without `fetch_all`; ≤31d with `fetch_all=true` (Core splits ≤15d windows)
- Roles: admin / superadmin (same as Connect)

**Scope:**
1. Client method on `shopeeAuthApi` (or sibling) via `lib/api.ts` — no raw `fetch` in the page.
2. On `/integrations/shopee` (or a child route): month/range picker → call preview with `fetch_all=true` + default `order_status=COMPLETED` (toggleable).
3. Show totals (escrow primary; buyer GMV secondary/labelled) + SKU qty table + optional order list.
4. Gate with `canConnectShopeeShop` (or matching predicate). Empty state if no connection.

**Out of scope:** full spreadsheet formulas (Core F6b1 / F6c), income_detail payout ledger, ads, journal posting.

**Next action.** Implement after Core smoke of month preview looks good; keep `menu-endpoints.md` in sync.

**Cross-ref:** Core [`SHOPEE_MONTHLY_RECAP.md`](../../../ecomhub-core/docs/guides/SHOPEE_MONTHLY_RECAP.md) · F6c still the later full recap screen.

**Done (2026-09-30):** New top-nav **Sales** domain — hub `/sales`, **Shopee Orders** `/sales/shopee`. `shopeeAuthApi.previewOrders` + connections shop picker; date range ≤31d; `fetch_all=true`; default status `COMPLETED`; totals / SKU table / order list. Connect stays under Integrations.

**Note (2026-09-30):** Core parallel escrow (concurrency 8) — **no FE change**; same preview response, faster wall time only. Progressive UX = **FE26** (Open), only if still feels slow after parallel.

**Note (2026-09-30):** Cancel bucket UI only when status=`CANCELLED`. On **All statuses**: checkbox `exclude_pembatalan` (default on) — drops early cancel / no pickup; not the returns (pengembalian) page.

**Note (2026-10-02):** Product next after FE25 = **FE28** (pengembalian), not F6b1 recap. See Core F6d.

---

### FE26 — Progressive Shopee preview (SKU/buyer first, escrow second)

**Category:** FEATURE · **Status:** Open · **Backend:** Core **F6b0.1** (not built yet — see Core `SHOPEE_MONTHLY_RECAP.md` § Performance)

**Problem.** Even with parallel escrow, a full month preview is one blocking request until all `get_escrow_detail` finish. Operators care about SKU qty + buyer GMV immediately; total escrow can land a beat later.

**Approach (when unblocked):**
1. **Fast call** — list+detail only (or `include_escrow=false`): show `sku_summary`, `total_buyer_amount`, order rows without escrow; escrow card = loading.
2. **Slow call** — escrow enrich (same range/filters): fill `total_escrow_amount` + per-order `escrow_amount`.
3. Do **not** invent a “totals-only” path that still hits every escrow — that does not reduce latency.

**Depends on.** Core exposing the split (query flag on preview and/or a thin enrich endpoint). Until then, leave FE25 as single-shot.

**Out of scope.** Order mirror DB / month snapshot (Core “Later” — only if live still hurts). Full F6b1 formulas.

**Next action.** Park until operator says month load still too slow after parallel escrow smoke. **Not** the current Shopee priority — F6d / FE28 pengembalian is ahead.

---

### FE27 — Responsive / narrow-viewport layout

**Category:** P3 · **Status:** Open · **Noted:** 2026-09-30

**Problem.** UI is not flexible on a small window (approx. phone width). Layouts stack / overlap — filters, cards, tables, and top-bar chrome fight for space. Observed when shrinking the desktop browser; not a dedicated mobile-app product requirement yet.

**Why it matters (low).** Operators mostly use desktop; phone-sized is occasional. Still worth fixing so narrow laptop / side-by-side windows do not look broken.

**Affected area (likely).** Top-bar nav / hubs, Sales → Shopee Orders filters + tables, Finance filter rows, Integrations connect page — audit breakpoints rather than one-off hacks.

**Out of scope.** Native mobile app; redesigning IA for phone-first.

**Next action.** When picked up: screenshot/reproduce at ~375px width, then stack filters vertically, allow horizontal scroll on tables, and tighten AppNav so domains do not crush.

---

### FE28 — Shopee Returns page

**Category:** FEATURE · **Status:** Done · **Backend:** Core **F6d** · **Priority (2026-10-02):** next Shopee FE after FE25 (ahead of F6b1 recap and FE26)

**Problem.** Orders preview can approx-label some cancels as `pengembalian` via `pickup_done_time` / `TO_RETURN`, but that is **not** Seller Centre returns. Operators need a dedicated **Sales → Shopee Returns** submenu with real return requests.

**UX (locked with Core F6d, 2026-10-02; label English 2026-10-02):** same overview shape as Shopee Orders —
1. Nav: Sales → **Shopee Returns** (`/sales/returns`; wire in `lib/nav.ts`). UI copy English — not “Pengembalian”.
2. Filters: shop + month / date range (≤31d).
3. Cards: return count · total pcs · **total refund nominal**.
4. Detail: SKU(s), qty, reason / text_reason, refund amount, status, `order_sn`, `return_sn`; plus useful extras Core returns (reassessed reason, solution, logistics/due when present).
5. Client via `lib/api.ts` — **no** client-side refund math; **no** raw `fetch`.

**API (Core).** Primary Shopee call: `v2.returns.get_return_list`. Not dispute/confirm in v0. See Core [`API_SHOPEE_SALES.md`](../../../ecomhub-core/docs/guides/API_SHOPEE_SALES.md) § F6d.

**Out of scope:** full monthly recap (F6b1), ads automation (F1), auto journal, seller dispute/confirm actions, treating cancel approx as returns SoT.

**Depends on.** Core F6d — **`GET …/returns/preview` Done (2026-10-02)**. Prefer Core **T35** awareness for clearer Partner errors. Update `menu-endpoints.md` when wired.

**Next action.** — (Done)

**Done (2026-10-02):** Sales → **Shopee Returns** `/sales/returns` (sibling of Orders so nav active state stays clean; UI label English — not “Pengembalian”). `shopeeAuthApi.previewReturns` → Core `…/returns/preview` with `fetch_all=true`. Cards: return count · total pcs · total refund. SKU summary + returns table (reason, solution, logistics/due). No client-side refund math.

---

### FE29 — Shopee Ads spend card on Sales overview

**Category:** FEATURE · **Status:** Done (2026-10-02) · **Backend:** Core **F6e** · **Noted:** 2026-10-02 · **After:** FE28

**Problem.** Sales → Shopee Orders shows orders / qty / escrow / buyer GMV, but not **Shopee Ads spend** for the same day or month filter. Operators want order · escrow · ads spend side by side. Top-up/payment (isi saldo + pajak) has no Partner API — do not invent it. This is **spend**, not F1 automation and not Marketing Ad Expenses (JE).

**Scope (when Core F6e endpoint exists):**
1. Same shop + date range as orders preview (day or ≤31d month).
2. One summary card: **Ads spend** = Core `total_ads_spend` (or equivalent) — **nominal only**; no client-side math from JE or top-up.
3. Client method via `lib/api.ts` / `integrationsApi`.

**Out of scope:** campaign tables, ROAS controls (F1), Meta ads, top-up UI, full F6b1 formulas.

**Depends on.** Core F6e.

**Done (2026-10-02):** `shopeeAuthApi.previewAdsSpend` → `GET …/ads/spend/preview`; fifth card on `/sales/shopee` via `Promise.allSettled` (orders still show if ads fails). Footnote: live Partner CPC expense, not wallet/JE.
