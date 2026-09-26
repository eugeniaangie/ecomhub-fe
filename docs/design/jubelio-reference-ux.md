# Jubelio reference UX — analysis & EcomHub blueprint

**Status:** Notes only (no implementation) · **Date:** 2026-09-24  
**Reference:** [Jubelio v2](https://v2.jubelio.com) — Dashboard, Keuangan hub, Jurnal list  
**Interactive canvas:** `ecomhub-core` workspace canvases → `jubelio-ux-ecomhub-blueprint.canvas.tsx`

This is a design note, not a delivery log. Product split locked by developer:

- **Home Dashboard** = ops / profit pulse (inspired by Jubelio Dashboard)
- **Finance** = accounting (cash, accounts, journals, channels) — not GMV cards

Related backlog: FE14–FE16 / core T32–T34 (Finance IA). Do not treat this note as completing those tasks. **UI ahead of API:** [`ui-backend-gaps.md`](./ui-backend-gaps.md).

---

## What we observed

### Shell
- Top horizontal mega-nav (module dropdowns) + logo + dashboard shortcut icon
- Utilities (notifications, profile) far right
- Page canvas: cool light gray; content: white rounded surfaces

### Dashboard (ops/profit)
1. Title left · **Filter** right (opens right drawer)
2. KPI grid **3×2**: GMV, Discount, Return, Net Sales, Profit, COGS
3. Trend band (~2/3) + side ranking (~1/3); in-card tabs (amount vs count)
4. Lower rankings: Best Stores · Best-Selling Product · Best Category
5. Filter fields: date range, time period, **channel**, store, product · Apply / Reset

### Keuangan hub
- Equal discovery cards (icon + title + one-line description): Akun, Hutang, Piutang, Kas & Bank, Aset, Jurnal, Transaksi Rutin, Laporan

### Jurnal list
- Breadcrumb → title + Export / Import / **+ Tambah Baru**
- **Left filter rail** (search, type, status radios, dates, Reset)
- **Right table** (doc no. as link, dates, amount, description, type) + refresh + page size

### Why it feels clean
One job per horizontal band · gray canvas vs white panels · blue accent only for active/primary/link · filters own a panel · KPI→trend→detail density cascade · consistent gutters and radii

---

## 1. Adapt (UX / layout principles)

| Principle | EcomHub use |
|---|---|
| Split ops Dashboard vs Finance | Home = profit/ops; Finance = accounting |
| Title + primary action row | List/detail chrome |
| Filter owns a surface | Rail on lists; drawer on dashboards |
| KPI → trend → detail | Home dashboard; Finance Overview can mirror with cash + channel |
| In-card tabs | Alternate cuts without new routes |
| Optional module hub cards | Finance discovery landing |
| Breadcrumb | Orient without relying only on sidebar |
| Document ID as link | Journals / expenses |
| Calm in-card error | Failed metric does not collapse layout |
| Channel as filter dimension | Aligns with T34 — channel ≠ page tree |

**Keep** EcomHub left sidebar + topbar — do not switch to Jubelio top mega-nav.

---

## 2. Make different (branding / chrome)

- Own mark and accent (not cloud logo / their blue)
- No WhatsApp FAB, trial pill, marketing overlays
- English product chrome (**locked 2026-09-25** — stay English; not bilingual)
- User chip quieter than “YOUR LOGO HERE”
- Flatter internal-tool surfaces OK if preferred over commercial shadows

---

## 3. Skip

- Top mega-nav for every domain
- Store / Product filters before catalog exists
- Putting GMV-style KPIs under Finance
- Hub tiles as the *only* Finance IA (still want Overview · Accounts · Transactions · Channels)
- Nesting Finance Dashboard + Ad Expenses under home Dashboard (current FE sidebar — confusing)
- Blind-copy KPI set (profit/COGS/fees need CoA decisions; see core T32 fee question)
- Edu / connect-store marketing chrome

---

## 4. EcomHub blueprint (conceptual)

### Shell
- Sidebar: **Dashboard** (one home) · Master · **Finance** (Overview, Accounts, Transactions, Channels, **Ad Expenses**, then CRUD)
- Remove Finance/Ad dashboards from under home Dashboard (**D2 = C**, 2026-09-26 — Ad Expenses stays a named Finance peer)
- Calmer page background + white content panels

### Home Dashboard
- Filter: date · period · channel (v1)
- KPI strip (labels TBD vs real APIs): gross / discount / returns / net / profit / COGS-or-ads
- Trend + by-channel panel
- Layout can ship before metrics exist — **no fake accounting math in the UI**

### Finance
- Overview: Total Cash (T31) + channel performance (T32)
- Accounts / Transactions / Channels per T34
- Optional hub tiles for discovery only — **superseded (2026-09-25):** D3 = no hub; Finance opens on Overview.

### List / CRUD
- Breadcrumb · title · secondary + primary actions
- Left filter rail · right table (ID as link)

### Suggested phases
| Phase | Work | Depends | Status |
|---|---|---|---|
| A | IA + shell chrome | — | **Done (2026-09-26)** — FE17 |
| B | List pattern on Journals / Expenses | A | Open |
| C | Finance Overview / Accounts on T31 | A, FE8 | Open |
| D | Home Dashboard composition (real metrics) | A; report APIs TBD | Shell empty KPIs exist; defs open (D1) |
| E | Channels + unified Transactions | T32, T33, FE14–16 | Shell routes exist; data blocked |

---

## Open decisions

Numbering matches the decision round on 2026-09-25.

### D1 — Home Dashboard metrics (direction agreed; defs still open)

**Agreed direction (2026-09-25):** layout can ship with empty / coming-soon; do **not** invent profit math in the UI. Exact KPI definitions + endpoints still TBD before wiring real numbers. Tracked as gaps **G1–G3** in [`ui-backend-gaps.md`](./ui-backend-gaps.md).

### D2 — Where Ad Expenses live — **Done (2026-09-26)**

After removing “Finance Dashboard / Ad Expenses” from under home Dashboard, choose:

| Option | What the user sees |
|---|---|
| A · Under Finance | Sidebar: Finance → Ad expenses (CRUD/report page) |
| B · Fold into Channels | Ad spend appears as part of channel performance (T32); separate ad dashboard retired |
| C · Own page under Finance group | Same as A, but kept as a named peer next to Overview / Accounts |

**Decided (2026-09-26):** **C** — Ad Expenses remains its own page, listed as a **named peer** under the Finance sidebar group (alongside Overview, Accounts, Transactions, Channels, CRUD), **not** nested under home Dashboard. Do not fold solely into Channels for now; T32 may still surface ad spend later without retiring this page.

~~Superseded later the same day by **D6** — ads moved out of Finance into a top-level **Marketing** group.~~ The reasoning above still holds for *not* folding ads into Channels; only the parent group changed.

### D3 — Finance hub landing? — **Done (2026-09-25)**

**What this is.** When someone clicks **Finance** in the sidebar, what is the first screen?

**Option A — Hub first (Jubelio-style)**  
Landing = grid of big tiles: “Overview”, “Accounts”, “Journals”, “Expenses”, … Each tile is a short description + link. User picks where to go. Good if many people are new and need a map. Extra click before seeing numbers.

**Option B — No hub; Overview is home**  
Clicking Finance (or the first Finance item) opens **Overview** immediately (Total Cash + channel strip). Other pages live as normal sidebar children. Fewer clicks; sidebar *is* the map. Closer to T34 as written.

**Option C — Soft hub**  
Overview is default, but Overview *page* starts with a thin row of shortcuts to Accounts / Transactions / Channels — not a separate `/finance` tile page.

**Decided (2026-09-25):** **B** — langsung Finance Overview (dashboard finance), bukan menu visual / hub dulu. No separate `/finance` tile landing.

~~Superseded same day by **D7** — hub berkartu restored as the Jubelio navigation pattern (option A).~~ `/finance` is the Finance hub again; Overview is one card among others.

### D4 — Marketplace fees in T32? — **Done (2026-09-25)** direction

**What T32 wants to show per channel:** roughly Revenue, Expense, Net — and optionally a **Fees** line (Shopee/TikTok commission, admin fee, etc.).

**The problem.** In the chart of accounts today we have sales accounts (e.g. `4111` Penjualan Shopee), ad spend (`5221` Shopee Ads), shipping, bank charges — **but no account whose job is “marketplace commission / admin fee”.** So the backend cannot honestly compute a Fees KPI without guessing which existing expense lines are fees (dangerous for money).

| Option | Meaning | Consequence |
|---|---|---|
| A · No Fees line for now | T32 ships **Revenue / Expense / Net** only | Unblocks T32/Channels UI; fees later when CoA is ready |
| B · Add fee accounts first | Create e.g. Shopee fee / TikTok fee accounts; say where *past* fee postings live (or start clean going forward) | Fees KPI becomes real; needs a CoA + data decision before T32 SQL |
| C · UI slot now, value null | FE may reserve a Fees label/row; amount stays empty/`null` until CoA + API exist | Layout stable; no fake numbers; tracked as gap **G4** |

**Decided (2026-09-25):** **C** — boleh ada slot Fees (dan metric UI lain yang belum punya API) di layout; **isi nullable / kosong**. Jangan hitung pengganti di FE. Backend tetap tidak mengarang fee sampai CoA siap. Register: [`ui-backend-gaps.md`](./ui-backend-gaps.md).

CoA fee accounts (former option B) remain a **later** backend decision — see core Decision 11.

### D5 — UI language — **Done (2026-09-25)**

**Decided:** English only. Not bilingual.

### D6 — Sidebar information architecture — **Done (2026-09-26)** · supersedes **D2**

**Why raised.** After the Phase A shell landed, the sidebar was still a flat-ish list: every feature sat close to the top level, `Master Data` mixed product categories with accounting setup, and the planned work (Shopee Open API and other channel integrations) would each have added another top-level entry. The developer asked for Jubelio-style *grouping* — hierarchical domains — while explicitly keeping the **dark sidebar and EcomHub's visual identity**. Grouping concept only; not a visual clone.

**Decided structure (live today):**

```
Dashboard                → /dashboard
Finance
  Views    → Overview · Accounts (/finance/balances) · Transactions · Channels
  Records  → Journal Entries · Operational Expenses · Capital & Investors
  Setup    → Chart of Accounts · Expense Categories · Fiscal Periods
Marketing  → Ad Budgets (/marketing/ad-budgets) · Ad Expenses (/marketing/ad-expenses)
Catalog    → Categories (/master/categories)
```

**Rules this encodes (the point of the change):**

1. **Top level = business domains, few of them.** A new feature joins an existing domain unless it is a new noun of the business.
2. **Two clickable levels maximum.** Further grouping uses non-clickable section captions (`Views` / `Records` / `Setup`) inside an expanded group — not a third accordion.
3. **Marketplaces never become top-level.** Shopee / TikTok / future channels go under **Integrations** (connection, API keys, sync); their money is read through **Finance › Channels**, consistent with core `T34` treating channel as a reporting dimension.
4. **Unbuilt areas are not rendered.** Catalog › Products/Inventory, Operations, Integrations and Settings stay out of the sidebar until they have a screen — no dead ends.

**Consequences accepted:**

- **`Master Data` retired as a top-level group.** Categories moved under **Catalog**; Chart of Accounts, Expense Categories and Fiscal Periods moved under **Finance › Setup** because only Finance consumes them. Route `/master/categories` unchanged for now; a later `/catalog/*` rename would need redirects.
- **Ads moved to Marketing** — supersedes D2's "peer under Finance". Routes moved to `/marketing/ad-budgets` and `/marketing/ad-expenses`. Temporary redirects from old `/finance/ad-*` paths were later dropped (FE-only; no prod bookmarks to preserve).
- `app/(dashboard)/master/page.tsx` (an older standalone categories CRUD) is now unlinked, like `/finance/dashboard`. Left in place; retire separately.
- No page logic, service client, or API call changed.

**Still open:** when Products/Inventory land, decide whether Inventory graduates to its own top-level group or stays inside Catalog. When Shopee Ads Automation (core `F1`) lands, Marketing is already the right home.

~~Layout half of D6 superseded by **D7**~~ — domain grouping and Marketing split stay; the *chrome* moves from dark sidebar + section captions to dark top bar + domain hubs.

### D7 — Top-bar navigation + domain hubs — **Done (2026-09-26)** · supersedes **D3** and the layout half of **D6**

**Why raised.** Developer clarified the Jubelio reference was for the **navigation layout pattern**, not for renaming menus inside a sidebar. Clarification: keep EcomHub's **dark** chrome, but place it **on top** (not a side rail). Domain click → hub with feature cards; caret → dropdown shortcuts. Features, grouping and visual identity remain EcomHub's.

**Live pattern:**

```
[ dark top bar: EcomHub | Dashboard | Finance ▾ | Marketing ▾ | Catalog ▾ | Logout ]
     ↓ click domain label
[ hub page: title + card grid (+ gear → Finance setup) ]
     ↓ click card or dropdown item
[ existing feature page — unchanged logic ]
```

**What changed in code:** `AppNav` + `DomainHub` replace `Sidebar` / `Topbar`. Hubs at `/finance`, `/marketing`, `/catalog`. Finance setup at `/finance/setup` (Chart of Accounts, Expense Categories, Fiscal Periods). `/finance` no longer redirects to Overview. Nav config lives in `lib/nav.ts`.

**What did not change:** page CRUD/report logic, service clients, API calls, Marketing routes (`/marketing/ad-*`), or EcomHub accent (`#6A89A7`).

---

When further decisions appear, append dated resolutions — do not delete the option tables above.
