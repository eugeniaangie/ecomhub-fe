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
- Sidebar: **Dashboard** (one home) · Master · **Finance** (Overview, Accounts, Transactions, Channels, then CRUD)
- Remove Finance/Ad dashboards from under home Dashboard
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

### Suggested phases (still no code commitment)
| Phase | Work | Depends |
|---|---|---|
| A | IA + shell chrome | — |
| B | List pattern on Journals / Expenses | A |
| C | Finance Overview / Accounts on T31 | A, FE8 |
| D | Home Dashboard composition | A; report APIs TBD |
| E | Channels + unified Transactions | T32, T33, FE14–16 |

---

## Open decisions

Numbering matches the decision round on 2026-09-25.

### D1 — Home Dashboard metrics (direction agreed; defs still open)

**Agreed direction (2026-09-25):** layout can ship with empty / coming-soon; do **not** invent profit math in the UI. Exact KPI definitions + endpoints still TBD before wiring real numbers. Tracked as gaps **G1–G3** in [`ui-backend-gaps.md`](./ui-backend-gaps.md).

### D2 — Where Ad Expenses live (still open — pick one)

After removing “Finance Dashboard / Ad Expenses” from under home Dashboard, choose:

| Option | What the user sees |
|---|---|
| A · Under Finance | Sidebar: Finance → Ad expenses (CRUD/report page) |
| B · Fold into Channels | Ad spend appears as part of channel performance (T32); separate ad dashboard retired |
| C · Own page under Finance group | Same as A, but kept as a named peer next to Overview / Accounts |

**Not decided yet** — need an explicit A/B/C.

### D3 — Finance hub landing? — **Done (2026-09-25)**

**What this is.** When someone clicks **Finance** in the sidebar, what is the first screen?

**Option A — Hub first (Jubelio-style)**  
Landing = grid of big tiles: “Overview”, “Accounts”, “Journals”, “Expenses”, … Each tile is a short description + link. User picks where to go. Good if many people are new and need a map. Extra click before seeing numbers.

**Option B — No hub; Overview is home**  
Clicking Finance (or the first Finance item) opens **Overview** immediately (Total Cash + channel strip). Other pages live as normal sidebar children. Fewer clicks; sidebar *is* the map. Closer to T34 as written.

**Option C — Soft hub**  
Overview is default, but Overview *page* starts with a thin row of shortcuts to Accounts / Transactions / Channels — not a separate `/finance` tile page.

**Decided (2026-09-25):** **B** — langsung Finance Overview (dashboard finance), bukan menu visual / hub dulu. No separate `/finance` tile landing.

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

---

When D2 is answered, append a dated resolution under it — do not delete the option tables above.
