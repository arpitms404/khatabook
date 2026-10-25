# FamilyKhata 📱🇮🇳

**FamilyKhata** is a production-ready, cross-platform mobile application for Android and iOS designed for Indian families to manage shared expenses, track personal spending, split household bills, record repayments, and view consolidated monthly analytics in real time.

---

## 1. Core Architecture & Highlights

- **Integer Paise Representation**: All monetary figures are strictly persisted and computed as integer paise (`1 INR = 100 paise`). Floating-point money bugs are mathematically prevented.
- **Strict 10-Member Capacity Limit**: Enforced at the PostgreSQL database level via trigger `trg_enforce_group_member_limit`. Concurrent requests cannot exceed 10 active members.
- **Two-Party Settlement Workflow**: When a debtor records a repayment, it enters a `pending` state. The recipient member confirms receipt before debts are settled, preventing false payment records.
- **Debt Simplification**: Greedy graph minimization algorithm reduces complex circular debts into the minimum possible direct transactions.
- **Row-Level Security (RLS)**: Comprehensive PostgreSQL policies ensure users can only access their authenticated family group's data.

---

## 2. Directory Structure

```text
family-khata/
├── app/
│   ├── (auth)/             # Login, Sign-up, Password Reset
│   ├── (tabs)/
│   │   ├── index.tsx       # Home Dashboard (Budget progress, KPIs, Balances)
│   │   ├── expenses.tsx    # Filterable ledger & receipt previews
│   │   ├── balances.tsx    # Net balances & pairwise settlements
│   │   ├── reports.tsx     # Category analytics & CSV export
│   │   └── settings.tsx    # 10-member capacity & group management
│   ├── expense/            # Add / Edit Expense modal workflows
│   └── settlement/         # Settle up modal
├── components/             # Reusable UI components
├── lib/
│   ├── supabase.ts         # Supabase client with SecureStore session adapter
│   └── query-client.ts     # TanStack Query client
├── utils/
│   ├── currency.ts         # Integer paise formatting & parsing
│   ├── splits.ts           # Equal split with remainder allocation & custom splits
│   └── settlements.ts      # Net balance & greedy debt simplification
└── supabase/
    ├── migrations/         # PostgreSQL schema & RLS migrations
    ├── seed.sql            # Realistic development seed data
    └── tests/              # Database tests
```

---

## 3. Getting Started

### Prerequisites
- Node.js >= 18.0.0
- Expo CLI (`npm install -g expo-cli eas-cli`)
- A Supabase Project ([supabase.com](https://supabase.com))

### Setup Environment
Create `.env` in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Apply Supabase Database Migrations
Run the migrations in your Supabase SQL Editor:
1. `supabase/migrations/20261019000001_family_khata_schema.sql`
2. `supabase/migrations/20261019000002_rls_and_functions.sql`
3. Optionally run `supabase/seed.sql` for sample data.

### Run Locally
```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start
```
- Press `a` to open in Android Emulator
- Press `i` to open in iOS Simulator
- Scan QR code with Expo Go app on physical devices

---

## 4. Production Mobile Builds (EAS Build)

### Android APK / AAB
```bash
eas build --platform android --profile production
```

### iOS IPA
```bash
eas build --platform ios --profile production
```

---

## 5. Security & Row Level Security (RLS)

All tables have RLS enabled:
- `expenses`: Viewable only by active group members. Deletable only by creator or admin.
- `group_members`: Hard constraint blocking >10 active members per group.
- `settlements`: Can only be confirmed by recipient member or admin.
- Receipts stored in private Supabase Storage buckets with signed URL delivery.
