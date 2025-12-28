# EcomHub - Internal Dashboard

## Menu Structure

### 📊 DASHBOARD
- **Overview** (sales, stock, alerts)
  - *Status: Not yet implemented*

---

### 🏢 MASTER DATA
Master data untuk data referensi yang digunakan di seluruh sistem.

- **👤 Users & Roles**
  - *Status: Not yet implemented*
  
- **📁 Categories**
  - *Status: ✅ Implemented*
  - Path: `/master/categories`
  - Description: Manage product categories with hierarchical structure

- **🎨 Product Attributes**
  - *Status: Not yet implemented*

- **💰 Pricing Rules**
  - *Status: Not yet implemented*

- **🏦 Accounts (Chart of Accounts)**
  - *Status: ✅ Implemented*
  - Path: `/finance/accounts`
  - Description: Manage chart of accounts with hierarchical structure and 7 account types

- **📋 Expense Categories**
  - *Status: ✅ Implemented*
  - Path: `/finance/expense-categories`
  - Description: Organize expenses into categories for better tracking

---

### 📦 INVENTORY
- **🛍️ Products**
  - Product List
  - Add Product
  - Product Variants
  - *Status: Not yet implemented*

- **📊 Stock Management**
  - Current Stock
  - Stock Movements
  - Stock Opname
  - *Status: Not yet implemented*

- **⚠️ Low Stock Alerts**
  - *Status: Not yet implemented*

---

### 🛒 ORDERS (Future)
- Order List
- Process Orders
- Fake Orders / Fraud
- *Status: Not yet implemented*

---

### 🏪 MARKETPLACE (Future)
- Connected Stores
- Sync Products
- Settlements
- *Status: Not yet implemented*

---

### 💰 FINANCIAL
Modul keuangan untuk mengelola transaksi, anggaran, dan laporan keuangan.

#### 💸 Transactions
- **Income**
  - *Status: Not yet implemented*

- **Expenses**
  - *Status: Not yet implemented*

- **Transfers**
  - *Status: Not yet implemented*

- **Journal Entries**
  - *Status: ✅ Implemented*
  - Path: `/finance/journal-entries`
  - Description: Double-entry bookkeeping with approval workflow

#### 💵 Operational Expenses
- *Status: ✅ Implemented*
- Path: `/finance/operational-expenses`
- Description: Track and approve operational expenses with workflow

#### 💳 Account Balances
- *Status: Not yet implemented*
- (Can be derived from Chart of Accounts)

#### 🎯 Budget Planning (Optional)
- **Ad Budgets**
  - *Status: ✅ Implemented*
  - Path: `/finance/ad-budgets`
  - Description: Track marketing and advertising budgets per platform

- **Monthly Budgets**
  - *Status: Not yet implemented*

#### 🤝 Capital & Investors
- *Status: ✅ Implemented*
- Path: `/finance/capital-investors`
- Description: Manage capital investments and investor relationships

#### 📊 Financial Reports
- **Profit & Loss**
  - *Status: Not yet implemented*

- **Cash Flow**
  - *Status: Not yet implemented*

- **Balance Sheet**
  - *Status: Not yet implemented*

#### 📅 Fiscal Periods
- *Status: ✅ Implemented*
- Path: `/finance/fiscal-periods`
- Description: Manage fiscal periods, close and reopen accounting periods

---

### 📈 REPORTS
- Sales Report
- Stock Report
- Product Performance
- Expense Summary
- *Status: Not yet implemented*

---

### ⚙️ SETTINGS
- Profile
- Store Settings
- Integrations (Shopee API)
- Preferences
- *Status: Not yet implemented*

---

## Implementation Status

### ✅ Implemented Modules
1. **Master Data**
   - Categories
   - Chart of Accounts
   - Expense Categories

2. **Financial**
   - Fiscal Periods
   - Operational Expenses
   - Ad Budgets
   - Capital Investors
   - Journal Entries

### 🚧 In Progress
- None currently

### 📋 Planned
- Dashboard Overview
- Users & Roles
- Product Attributes
- Pricing Rules
- Inventory Management
- Orders Management
- Marketplace Integration
- Financial Reports
- General Reports
- Settings

---

## Notes

- Master Data modules are for reference data that doesn't change frequently
- Financial modules handle transactions, budgets, and financial reporting
- Future modules (Orders, Marketplace) are marked as "Future" in the menu structure
- Some modules may be optional based on business needs (e.g., Budget Planning)
