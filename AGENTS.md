# AGENTS.md — EcomHub FE

Entry point for AI agents working on this repository. Read this before making any change.

This file holds **stable principles and long-lived rules** — a map and a set of guardrails. It is deliberately not a record of the repository's current condition: open defects, known gaps and planned work live in [`docs/roadmap/task-list.md`](docs/roadmap/task-list.md) and change as the codebase improves.

**Do not add a task, bug, or temporary concern to this file.** Record it in the backlog instead.

---

## What EcomHub FE is

The internal admin dashboard for EcomHub — a multi-channel e-commerce business (Shopee, TikTok, general operations). It is the only user interface for the accounting system exposed by the backend API.

Screens cover master data (categories), and the finance module: chart of accounts, fiscal periods, journal entries, operational expenses, expense categories, capital investors, ad budgets, and financial dashboards.

**The numbers on these screens are accounting figures.** A formatting bug, a wrong date range, or a mislabelled card is a wrong financial statement as far as the person reading it is concerned. Treat anything that renders money as high-risk.

---

## Relationship to the backend

The backend lives in the sibling repository [`ecomhub-core`](../ecomhub-core) — a Go HTTP API doing double-entry accounting. This repo holds **no business logic and no persistence**; it renders what the API returns and sends back what the user types.

- **The API is the contract.** Before writing a client method, read the actual handler or the generated Swagger in `ecomhub-core` — do not infer the response shape from the endpoint name or from an existing TypeScript interface, which may be stale.
- **The backend owns authorisation.** Role checks in this repo decide what to *render*; the server decides what is *permitted*. Never treat a client-side role check as a security boundary, and never work around a 403 in the UI.
- **Backend work is tracked with `T*` IDs** in `ecomhub-core/docs/roadmap/task-list.md`. When a backend change forces FE work, the FE backlog entry names the `T*` ID. Status is not duplicated across repos — link to it.
- **Backend route removals are coordinated.** Some endpoints stay alive only because this FE still calls them. Migrate off a route first; ask for its deletion second.

---

## Technology stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) — version pinned in `package.json` |
| Language | TypeScript |
| UI | React, Tailwind CSS |
| Data fetching | `fetch` via the `lib/api.ts` wrapper — no data-fetching library |
| State | React local state — no global store |
| Auth | Bearer JWT issued by the backend, held client-side |
| Deploy | Vercel |

There is intentionally no Redux, React Query, or component library. **Adding one is an architectural decision, not an implementation detail** — propose it, do not introduce it inside another change.

---

## High-level architecture

```
app/ (routes) → lib/services/*Api → lib/api.ts → backend HTTP API
```

| Directory | Responsibility |
|---|---|
| `app/(auth)/` | Unauthenticated routes — login |
| `app/(dashboard)/` | Authenticated routes; `layout.tsx` wraps them in the app shell |
| `components/ui/` | Generic, domain-free primitives — `Button`, `Input`, `Modal`, `Card`, `Pagination`, `DatePicker` |
| `components/layout/` | App shell — `AppNav`, `DomainHub`, `PageWrapper` |
| `components/<domain>/` | Domain-specific components (`finance/`, `categories/`) |
| `lib/api.ts` | HTTP wrapper: base URL, auth header, response envelope unwrapping, error mapping |
| `lib/services/` | Endpoint clients grouped by domain |
| `lib/types/` | TypeScript shapes mirroring API responses |
| `lib/auth.ts` | Token storage |
| `lib/authHelpers.ts` | Role reads and `can*` permission predicates |
| `lib/utils/` | Formatters, pagination defaults, constants |

**Preserve this layering.** Pages call service clients; service clients call `lib/api.ts`. A page must not call `fetch` directly, and a service client must not reach into component state.

---

## Project conventions

- **One place for HTTP concerns.** Base URL, auth header, error mapping and the response envelope belong in `lib/api.ts`. If a fix has to be applied in more than one method, fix the duplication first, separately.
- **Response envelope.** The backend wraps everything in `{ code, business_code, status, message, data }`; `lib/api.ts` returns `data`. Paginated responses put `{ results, page, limit, total_pages, total_results }` inside `data`.
- **Business codes matter.** The backend sends a `business_code` alongside the HTTP status (`"00"` success, `"93"` unauthorized, `"94"` unauthenticated, `"90"` rate limited). Where both are available, branch on the business code — HTTP status alone has been ambiguous in practice.
- **Types mirror the API, they do not reinterpret it.** Optional and nullable fields on the Go side must be optional in TypeScript. A field the API can omit is not `string`.
- **Money is a number from the API.** Format at the render boundary with the shared formatters; never re-derive a total in the UI that the API already computes, and never round before display.
- **Dates are `YYYY-MM-DD` on the wire.** Report endpoints take `start_date` / `end_date`; entity timestamps come back as ISO datetimes.
- **Permissions live in `lib/authHelpers.ts`.** Add a `can*` predicate there rather than inlining a role check in a component, and keep it matching the role rules the backend actually enforces.
- **Follow the surrounding code.** Patterns are inconsistent in places; match the local file and note the inconsistency rather than reformatting it.

---

## Where documentation lives

| Topic | Document |
|---|---|
| **Task backlog and live status** | [`docs/roadmap/task-list.md`](docs/roadmap/task-list.md) |
| **Deploy / move host / Shopee ops** | [`../ecomhub-core/docs/IMPORTANT_NOTES.md`](../ecomhub-core/docs/IMPORTANT_NOTES.md) |
| Menu → endpoint map | [`docs/menu-endpoints.md`](docs/menu-endpoints.md) |
| Menu structure and implementation status | [`README.md`](README.md) |
| Finance module behaviour and role rules | [`docs/finance/module.md`](docs/finance/module.md) |
| Manual verification steps | [`docs/finance/testing-checklist.md`](docs/finance/testing-checklist.md) |
| Backend API contract | `ecomhub-core` — handlers plus generated Swagger |

Task IDs are `FE*` and are stable. Use them when discussing work.

---

## Working with known findings

The repository's current condition lives in the backlog, not in this file.

- **Check the backlog before investigating.** If a problem you notice is already recorded, work from it and refer to it by ID.
- **Do not re-report a recorded task as a new discovery.**
- **Do not fix an unrelated finding opportunistically** inside another change. Note it and move on.
- **Treat every entry as possibly outdated.** Confirm against the current code before acting — status records what was *intended*, not what is true.

---

## Required workflow before making changes

Full detail in [`.cursor/rules/ai-workflow.mdc`](.cursor/rules/ai-workflow.mdc). In short:

1. **Investigate** — read the page, the service client and the backend handler. Check the backlog.
2. **Plan** — for anything beyond a trivial change, state the approach and wait for confirmation.
3. **Implement** — smallest change that solves the stated task. No unrelated refactoring.
4. **Validate** — `npm run lint` and `npm run build` at minimum. These prove it compiles and passes static checks; they do not prove the screen is correct. There is no test suite, so anything behavioural needs manual verification in the browser — say what you checked and what you did not.

---

## Rules for changes that affect displayed figures

Applies to the finance dashboards, any report client method, and any formatter used for money.

- **Switching an endpoint can change the number on screen.** Say so explicitly, and compare before and after against the same data rather than assuming equivalence.
- **A balance and a period movement are different quantities.** A balance is cumulative from inception; a movement is bounded by a date range. Do not label one as the other, and do not wire a cumulative figure to the range picker.
- **Do not compute accounting values in the UI.** Summing rows client-side to produce a total the API also returns will eventually disagree with it, silently.
- **Preserve the account's own sign convention.** The API normalises sign by account type; re-negating in the UI produces plausible, wrong numbers.

---

## When to update documentation

Documentation is a point-in-time snapshot written in the present tense. Updating it is part of finishing a task, not a follow-up.

[`docs/roadmap/task-list.md`](docs/roadmap/task-list.md) is the **single source of truth for task status**; its "Documentation impact" section lists which files each kind of change affects.

**Do not:**
- Delete a resolved task or renumber `FE*` IDs. Append resolution with a date instead.
- Record a new bug or temporary concern in this file or in `.cursor/rules/` — those hold stable principles. A temporary condition written as a permanent rule becomes wrong the moment it is fixed.
- Update docs speculatively for changes that were only proposed.
