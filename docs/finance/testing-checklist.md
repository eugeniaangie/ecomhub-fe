# Finance — manual testing checklist

Smoke / regression checks for finance screens. There is no automated FE test suite yet (**FE13**).

## Environment

- [ ] Backend reachable (default local base: `http://localhost:4000`; do not append `/api/v1` in `.env.local`)
- [ ] Frontend: `npm run dev`
- [ ] Logged in via `/login` (roles come from `/auth/me` — do **not** set `user_role` / `user_id` in localStorage by hand)
- [ ] Confirm console shows `[api] base URL: …` pointing at the intended host

---

## 1. Expense categories (`/finance/expense-categories`)

### CRUD
- [ ] Create category with name + description
- [ ] Edit and save
- [ ] Delete with confirmation

### Search & pagination
- [ ] Enough rows to paginate; next/prev work
- [ ] Search filters; clear resets

### Validation
- [ ] Empty / too-short name fails with a clear message

---

## 2. Fiscal periods (`/finance/fiscal-periods`)

### CRUD
- [ ] Create open period (green badge)
- [ ] Edit / delete an open period

### Workflow
- [ ] Admin or manager: Close → closed (red); edit/delete hidden
- [ ] Superadmin: Reopen → open again

### Validation & permissions
- [ ] End date ≤ start date rejected
- [ ] Staff: no Close/Reopen
- [ ] Admin/manager: Close available, Reopen not (unless superadmin)

---

## 3. Chart of accounts (`/finance/accounts`)

### CRUD & hierarchy
- [ ] Create root account (code, name, type)
- [ ] Create child under parent; indentation / “└─” shown
- [ ] Soft delete → inactive; inactive not in dropdowns

### Types & filters
- [ ] All seven types creatable; type filter and search by code/name work

---

## 4. Operational expenses (`/finance/operational-expenses`)

### CRUD
- [ ] Create with date, category, account, amount, description, receipt URL → Pending
- [ ] View detail; edit pending; amounts show as `Rp …`

### Workflow
- [ ] Admin: Approve → Approved; Reject → Rejected
- [ ] Admin: Pay on approved → Paid with paid-at
- [ ] Staff: no Approve/Reject/Pay controls

### Filters
- [ ] Search + status + category filters combine and clear

---

## 5. Journal entries (`/finance/journal-entries`)

- [ ] List loads; create draft with balanced lines
- [ ] Approve / reject / post according to role predicates
- [ ] Detail view shows lines and status

---

## 6. Ad budgets & capital investors

- [ ] `/finance/ad-budgets`: list, create, update, spent patch, delete (per role)
- [ ] `/finance/capital-investors`: list, create, update, return-paid / status, delete (per role)

---

## 7. Dashboards

- [ ] `/finance/dashboard`: balances and transactions for a date range
- [ ] `/finance/ad-dashboard`: totals / per-platform sections load without client-side totals inventing numbers

---

## 8. Landing & shell

- [ ] `/finance` links reach the screens above
- [ ] Sidebar entries match routes in `components/layout/Sidebar.tsx`

---

## 9. Cross-cutting

- [ ] Loading and API error banners are dismissible
- [ ] Unauthenticated / expired token behaviour matches current `lib/api.ts` (see **FE1** / **FE7** if broken)
- [ ] Modals: Escape / cancel close; form state resets

---

## Sign-off

| Field | Value |
|-------|--------|
| Date | |
| Tester | |
| Environment (local / staging) | |
| Result | Pass / Fail / Blocked |
| Notes | |
