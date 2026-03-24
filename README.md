# SnapBudget

AI-powered personal finance app built with React Native and Expo. Track spending, set savings goals, scan receipts, and get personalized financial coaching — all from your phone.

## Features

- **Financial Health Score** — A 0–100 score based on spending ratio, savings rate, goal progress, and subscription efficiency
- **AI Financial Coach** — Chat with an AI coach that knows your complete financial picture and gives specific, actionable advice
- **Receipt Scanning** — Snap a photo of any receipt to auto-categorize and log transactions
- **Smart Subscriptions** — Automatically detects recurring charges and flags potentially unused subscriptions
- **Savings Goals** — Track progress toward multiple goals with projected completion dates and milestone celebrations
- **Transaction Tracking** — Auto-categorized transactions with monthly breakdowns and category filtering
- **Demo Mode** — Fully functional demo with realistic data — no API keys required

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

## Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd budget-ai

# Install dependencies
npm install

# Copy env file and fill in your keys (optional for demo mode)
cp .env.example .env

# Start the dev server
npx expo start
```

Scan the QR code with Expo Go on your phone. The app works fully in **Demo Mode** without any API keys.

## Demo Mode

Demo mode provides a complete, realistic dataset for a fictional user "Alex" in Austin, TX:

- 3 bank accounts (checking, savings, credit card)
- 90 days of transaction history with realistic merchants and patterns
- 3 savings goals (Japan Trip, Emergency Fund, New MacBook)
- 4 subscriptions with one flagged as possibly unused
- AI coach responds with contextual demo responses
- Receipt scanner returns mock parsed data

To enter demo mode: launch the app → swipe through onboarding → tap **"Try Demo"**.

## API Keys Setup

### OpenAI (for AI coach and receipt scanning)

1. Get an API key at [platform.openai.com](https://platform.openai.com)
2. Add to `.env`: `EXPO_PUBLIC_OPENAI_API_KEY=sk-...`

### Supabase (for persistent data storage)

1. Create a project at [supabase.com](https://supabase.com)
2. Add to `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Create the following tables:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  monthly_income NUMERIC DEFAULT 0,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  institution TEXT,
  type TEXT CHECK (type IN ('checking', 'savings', 'credit')),
  balance NUMERIC DEFAULT 0,
  last_synced TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  merchant TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  account_id TEXT REFERENCES accounts(id),
  is_manual BOOLEAN DEFAULT false,
  is_receipt BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Goals
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  target_date DATE NOT NULL,
  type TEXT CHECK (type IN ('savings', 'debt')),
  linked_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  data_card JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Plaid (for bank account connection)

1. Sign up at [plaid.com](https://plaid.com)
2. Add to `.env`:
   ```
   EXPO_PUBLIC_PLAID_CLIENT_ID=your-client-id
   EXPO_PUBLIC_PLAID_SECRET=your-secret
   EXPO_PUBLIC_PLAID_ENV=sandbox
   ```

## Project Structure

```
├── App.tsx                    # Entry point
├── src/
│   ├── screens/               # 10 full screens
│   ├── components/            # 14 reusable components
│   ├── navigation/            # Root + Tab navigators
│   ├── store/                 # Zustand global state
│   ├── lib/                   # API clients (Supabase, OpenAI, Plaid)
│   ├── utils/                 # Utilities (health score, receipt parsing, etc.)
│   ├── constants/             # Colors, theme, categories
│   └── types/                 # TypeScript type definitions
```

## Tech Stack

- **Framework**: React Native + Expo (SDK 55, managed workflow)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State**: Zustand
- **Backend**: Supabase (Postgres + Auth)
- **AI**: OpenAI GPT-4o
- **Banking**: Plaid
- **Language**: TypeScript (strict mode)

## Known Limitations (v1)

- Plaid Link integration is stubbed — the UI flow exists but actual bank connection requires a backend server for token exchange
- Receipt scanning requires an OpenAI API key with GPT-4o vision access
- Notifications are configured but require a physical device (not supported in Expo Go simulator)
- No authentication/login flow yet — the app uses local state and optional Supabase persistence
- Milestone animations trigger on mount rather than tracking previous progress state
- Weekly challenges are static — no backend logic to evaluate completion
- Export Data in settings is a placeholder

## License

MIT
