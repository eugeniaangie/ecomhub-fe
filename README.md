# EcomHub Frontend

Frontend dashboard for an internal e-commerce management system (ecomhub-core). Built with Next.js, TypeScript, and Tailwind CSS.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks
- **Authentication**: JWT (stored in sessionStorage + cookie for middleware)
- **API Communication**: fetch API
- **Deployment**: Vercel / Netlify ready

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### 🧪 Testing Without Backend (Development Mode)

In development mode, you can test the application without a running backend:

**Test Credentials:**
- **Email**: `admin@test.com`
- **Password**: `admin123`

The login page will show a blue development mode banner with a "Fill Test Credentials" button for quick testing. When using these credentials, the app will use mock data instead of making real API calls.

**Note**: This feature only works in development mode (`NODE_ENV=development`). In production, you must use the real backend API.

## 📁 Project Structure

```
ecomhub-fe/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Protected dashboard layout
│   │   ├── page.tsx              # Dashboard home (financial summary)
│   │   ├── finance/
│   │   │   └── page.tsx          # Financial records (income/expense)
│   │   └── master/
│   │       └── page.tsx          # Master data management
│   │
│   ├── globals.css
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── Topbar.tsx            # Top navigation bar
│   │   └── PageWrapper.tsx       # Dashboard page wrapper
│   │
│   └── ui/
│       ├── Button.tsx            # Reusable button component
│       ├── Input.tsx             # Form input component
│       ├── Modal.tsx             # Modal dialog component
│       └── Card.tsx              # Card container component
│
├── lib/
│   ├── api.ts                    # API client wrapper
│   ├── auth.ts                   # Authentication helpers
│   └── types.ts                  # TypeScript type definitions
│
├── middleware.ts                 # Route protection middleware
├── .env.local                    # Environment variables (create this)
└── README.md
```

## 🔐 Authentication

The application uses JWT-based authentication:

- Login page at `/login`
- JWT token stored in sessionStorage (client-side) and cookie (for middleware)
- Protected routes are automatically redirected to login if unauthenticated
- Token expiration handled gracefully with redirect to login

## 🎯 Features

### Phase 1 - Financial MVP

- **Authentication**
  - Login page with JWT authentication
  - Protected routes with middleware
  - Logout functionality

- **Dashboard**
  - Monthly financial summary
  - Total income, expense, and net profit cards
  - Simple, clean UI

- **Financial Records**
  - Income and expense transaction lists
  - Create, edit, and delete transactions
  - Category-based filtering
  - Payment method and account tracking

- **Master Data**
  - Categories management (income/expense)
  - Payment methods management
  - Accounts management (cash, bank, e-wallet)

## 🔗 API Integration

The frontend expects a REST API backend with the following structure:

- **Base URL**: Configured via `NEXT_PUBLIC_API_BASE_URL` environment variable
- **Authentication**: JWT token sent via `Authorization: Bearer <token>` header
- **Response Format**: 
  ```json
  {
    "data": T,
    "message": "string"
  }
  ```

### API Endpoints Used

- `POST /auth/login` - User authentication
- `GET /dashboard/summary?month=YYYY-MM` - Dashboard summary
- `GET /transactions?type=income|expense` - List transactions
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction
- `GET /categories?type=income|expense` - List categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category
- `GET /payment-methods` - List payment methods
- `POST /payment-methods` - Create payment method
- `PUT /payment-methods/:id` - Update payment method
- `DELETE /payment-methods/:id` - Delete payment method
- `GET /accounts` - List accounts
- `POST /accounts` - Create account
- `PUT /accounts/:id` - Update account
- `DELETE /accounts/:id` - Delete account

## 🎨 UI Principles

- Clean, dashboard-first design
- No over-animation
- Mobile responsive
- Focus on clarity and usability
- Consistent color scheme (blue primary, green for income, red for expenses)

## 🚢 Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variable `NEXT_PUBLIC_API_BASE_URL`
4. Deploy

### Netlify

1. Push your code to GitHub
2. Import project in Netlify
3. Add environment variable `NEXT_PUBLIC_API_BASE_URL`
4. Deploy

## 📝 Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 🔒 Security Notes

- JWT tokens are stored in sessionStorage (client-side) and cookies (for middleware)
- In production, consider using http-only cookies set by the backend for better security
- All API requests include the JWT token in the Authorization header
- Protected routes are enforced by middleware

## 📄 License

Private - Internal use only
