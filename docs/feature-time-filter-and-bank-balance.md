# Feature Spec — Time Period Filtering & Bank Balance Tracking

> **Status:** Draft — for review before implementation  
> **Scope:** `/budget` page (primary), `/dashboard` page (mirrors same changes)  
> **Target:** Gen-Z mobile-first experience on Rizqly

---

## Table of Contents

1. [What's Broken Today](#1-whats-broken-today)
2. [Feature 1 — Time Period Filter](#2-feature-1--time-period-filter)
3. [Feature 2 — Live Bank Balance](#3-feature-2--live-bank-balance)
4. [Feature 3 — Balance Impact Preview](#4-feature-3--balance-impact-preview)
5. [Schema Changes](#5-schema-changes)
6. [API Changes](#6-api-changes)
7. [New Files](#7-new-files)
8. [Changed Files](#8-changed-files)
9. [What We Are NOT Doing](#9-what-we-are-not-doing)

---

## 1. What's Broken Today

| Problem | Where | Why it hurts |
|---|---|---|
| Month is hardcoded to `currentMonthKey` | `budget/page.tsx:111` | User can never see last month or YTD |
| `Bank` has no `balance` field | `lib/mongodb/models.ts:62` | "Net by Account" is computed from flow, not real balance |
| `BankCarousel` shows "% of total spent" | `BankCarousel.tsx:51` | Misleading — looks like an expense share, not a balance |
| `AddExpenseModal` hardcodes `bankAccount: "Cash"` | `AddExpenseModal.tsx:148` | Every expense hits Cash regardless of what user picked |
| No bank picker in expense modal | `AddExpenseModal.tsx` | User can't assign expense to the right account |

---

## 2. Feature 1 — Time Period Filter

### 2.1 User-facing behaviour

The current static header label `"April 2026"` becomes a tappable period selector. Four chips sit horizontally below the title, always visible without scrolling:

```
This Month   Last Month   Year to Date   Custom
```

- Tapping a chip instantly re-fetches transactions for that range.
- The header label updates to reflect the active period.
- "Custom" opens a bottom sheet with a from/to month picker (not a full date picker — month granularity is enough for a finance app).
- The currently selected chip is highlighted with `#CCFF00` border + subtle glow.

**Label copy per period:**

| Chip | Header label example |
|---|---|
| This Month | April 2026 |
| Last Month | March 2026 |
| Year to Date | Jan – Apr 2026 |
| Custom (Mar–Nov) | Mar – Nov 2025 |

### 2.2 How data flows

```
PeriodSelector (state: activePeriod)
  → usePeriodFilter(activePeriod)   ← new hook, derives { month?, startDate?, endDate? }
  → useTransactions(filters)        ← existing hook, already accepts { month? }
  → useTransactionStats(filters)    ← existing hook
```

For "Year to Date" the hook passes `startDate=YYYY-01-01` and no `endDate` (open-ended up to today). The API needs two new optional query params: `startDate` and `endDate` (both `YYYY-MM-DD`).

### 2.3 Transaction list behaviour per period

| Period | List title | Show All button |
|---|---|---|
| This Month | "Recent Transactions" | Shows if > 5 |
| Last Month | "March Transactions" | Shows all by default (historical, no "recent" concept) |
| Year to Date | "All Transactions" | Paginated — show 20, load more |
| Custom | "Mar – Nov Transactions" | Shows all |

### 2.4 Month-over-month delta pills

When "Last Month" or "Year to Date" is active, the Income and Expense cards show a delta vs. the equivalent prior period:

```
┌─────────────────────────────┐
│  ↓  Income                  │
│  Rs. 45,000                 │
│  ▲ 12% vs March             │  ← small pill, #86EFAC for positive, #FF8B8B for negative
└─────────────────────────────┘
```

Delta is computed client-side — fetch current period stats + prior period stats in parallel, subtract.

### 2.5 Component design — `PeriodSelector`

```
Location: components/mobile/PeriodSelector.tsx
Props:
  activePeriod: Period
  onChange: (p: Period) => void

type Period =
  | { type: 'this_month' }
  | { type: 'last_month' }
  | { type: 'ytd' }
  | { type: 'custom'; start: string; end: string }  // YYYY-MM
```

Visual spec:
- Horizontal scroll row, `gap-2`, `px-6`
- Each chip: `rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest`
- Inactive: `bg-white/5 text-white/40 border border-white/8`
- Active: `bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/40 shadow-[0_0_12px_rgba(204,255,0,0.15)]`
- No scrollbar visible (`no-scrollbar` utility)
- Framer Motion `layoutId` spring animation on the active highlight

---

## 3. Feature 2 — Live Bank Balance

### 3.1 The problem in plain terms

Right now `BankCarousel` shows how much was spent per account in the selected period. This is *flow* (a delta), not a *balance* (an absolute number). A user who spends Rs. 2,000 from Meezan this month sees "Rs. 2,000" on the card — but that tells them nothing about how much is actually in Meezan.

We need a real balance that persists across months and updates on every transaction.

### 3.2 How balance is maintained

**On expense creation:**
```
Bank.findOneAndUpdate(
  { userId, name: bank_account },
  { $inc: { balance: -amount } }
)
```

**On income creation:**
```
Bank.findOneAndUpdate(
  { userId, name: bank_account },
  { $inc: { balance: +amount } }
)
```

**On transaction delete:**  
Reverse the delta. The existing DELETE handler in `app/api/transactions/route.ts` fetches the document before deleting — use that to determine direction and amount, then apply the reverse `$inc`.

**Initial balance (new bank accounts):**  
When a user creates a bank account, prompt for an optional "starting balance" (default 0). This is a one-time setup field, not a recurring input.

### 3.3 BankCarousel redesign

Current card shows: emoji, name, "Rs. X,XXX", progress bar (% of spend), "X% of total"

New card shows:

```
┌──────────────────────────────┐
│  🏦                    Meezan│
│                              │
│  Balance                     │
│  Rs. 48,500                  │
│                              │
│  ──────────────────── (bar)  │
│  -Rs. 1,500 this month       │
└──────────────────────────────┘
```

- **Top line:** emoji + bank name (right-aligned, truncated)
- **Middle:** "Balance" label (white/40) + actual balance amount (white, extrabold)
- **Bar:** Shows this-month net flow as a directional bar. Green fill = net positive (income > expense). Red fill = net negative. Bar width = absolute net / max net across all banks.
- **Bottom line:** Net flow for the selected period. e.g. `-Rs. 1,500 this month` in white/40.

Balance goes **red** (`#FF8B8B`) when it drops below zero. This is the only place in the app that uses red text on a number that isn't a category label — it's intentional and unmissable.

### 3.4 "All Accounts" total card

Prepend one summary card to the carousel (not scrollable — pinned or above the carousel):

```
┌──────────────────────────────┐
│  💰  Total Balance           │
│  Rs. 1,24,300                │
│  across 3 accounts           │
└──────────────────────────────┘
```

Style: slightly larger, `#CCFF00` glow, same glass card.

---

## 4. Feature 3 — Balance Impact Preview

### 4.1 In `AddExpenseModal`

**Current problem:** bank is hardcoded to `"Cash"`. User has no way to pick which account an expense comes from.

**New flow:**

After the numpad and category picker, add a bank picker row — same horizontal chip design as categories:

```
Meezan  JazzCash  Cash  SadaPay  +
```

When a bank is selected and an amount is entered, show a one-line preview below the picker:

```
Meezan  Rs. 48,500  →  Rs. 47,200  after this expense
```

Design of preview row:
- `text-xs`, `text-white/40`
- Current balance in white/60, arrow `→` in white/20, post-expense balance in white/80 (or `#FF8B8B` if it goes negative)
- Animated with Framer Motion `AnimatePresence` — only appears once amount > 0 and bank is selected
- If balance would go negative: preview turns `#FF8B8B` + small warning label `"⚠ Balance will go negative"`

### 4.2 In the success / insights screen (step 2 of `AddExpenseModal`)

After logging, the existing "Logged!" confirmation screen already shows the amount. Add one line below it:

```
✅  Logged!
    Rs. 1,300 added

    Meezan Bank  Rs. 48,500 → Rs. 47,200
```

This appears as a small pill row, not a full card. Animates in with a 0.15s delay after the main success banner.

---

## 5. Schema Changes

### `IBank` — add `balance`

```typescript
// lib/mongodb/models.ts

export interface IBank extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  balance: number;        // ← NEW. Running total in PKR.
  createdAt: Date;
}

const BankSchema = new Schema<IBank>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    balance: { type: Number, default: 0 },   // ← NEW
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
```

**Migration:** Existing bank documents get `balance: 0` by default (MongoDB sparse behaviour). No destructive migration needed. Optionally run a one-off script to backfill from historical transactions — nice-to-have, not required for launch.

---

## 6. API Changes

### `GET /api/transactions` — new query params

| Param | Type | Example | Notes |
|---|---|---|---|
| `month` | `YYYY-MM` | `2026-03` | existing |
| `direction` | `income\|expense` | `expense` | existing |
| `startDate` | `YYYY-MM-DD` | `2026-01-01` | new |
| `endDate` | `YYYY-MM-DD` | `2026-04-14` | new, defaults to today |

When `startDate` is present, `month` is ignored. Both params are optional independently.

### `POST /api/transactions` — balance side-effect

After `Transaction.create(...)`, run atomically:

```typescript
const delta = direction === 'income' ? amount : -amount;
await Bank.findOneAndUpdate(
  { userId: session.user.id, name: bank_account },
  { $inc: { balance: delta } }
);
```

If no matching bank is found (e.g. bank name was typed free-form), silently skip — do not fail the transaction.

### `DELETE /api/transactions` — balance reversal

Before deleting, fetch the document to read `direction` and `amount`. After deletion:

```typescript
const delta = deletedTx.direction === 'income' ? -deletedTx.amount : deletedTx.amount;
await Bank.findOneAndUpdate(
  { userId: session.user.id, name: deletedTx.bank_account },
  { $inc: { balance: delta } }
);
```

### `GET /api/banks` — return `balance`

The existing route returns the full bank document minus `__v`. Since `balance` will exist on the model, it returns automatically. No route change needed — just verify the return shape.

### `POST /api/banks` — accept optional `initialBalance`

```typescript
// body: { name: string; initialBalance?: number }
const newBank = await Bank.create({
  userId: session.user.id,
  name: data.name,
  balance: data.initialBalance ?? 0,
});
```

---

## 7. New Files

| File | Purpose |
|---|---|
| `components/mobile/PeriodSelector.tsx` | Chip row for time period selection |
| `hooks/usePeriodFilter.ts` | Converts `Period` type → `{ month?, startDate?, endDate? }` query filters |
| `types/period.ts` | `Period` union type, shared across components and hooks |

---

## 8. Changed Files

| File | Change |
|---|---|
| `lib/mongodb/models.ts` | Add `balance: Number` to `BankSchema` + `IBank` interface |
| `app/api/transactions/route.ts` | Add `startDate`/`endDate` params to GET; add balance `$inc` to POST and DELETE |
| `app/api/banks/route.ts` | Accept `initialBalance` in POST body |
| `app/budget/page.tsx` | Replace `currentMonthKey` constant with `Period` state; wire `PeriodSelector`; pass period-derived filters to hooks; add delta pills to income/expense cards |
| `app/dashboard/page.tsx` | Same changes as budget page (they are currently identical) |
| `hooks/queries/useTransactions.ts` | Extend filter type to accept `startDate`/`endDate` |
| `services/transaction.service.ts` | Extend `getAll()` params to pass `startDate`/`endDate` |
| `components/mobile/BankCarousel.tsx` | Redesign card to show stored balance + period net flow |
| `components/mobile/AddExpenseModal.tsx` | Add bank picker row; show balance impact preview; fix hardcoded `"Cash"` |
| `services/bank.service.ts` | Expose `balance` field in `Bank` interface |

---

## 9. What We Are NOT Doing

These are intentionally excluded to keep scope tight:

- **Full date picker** — month granularity is enough. Day-level custom ranges add complexity for marginal value.
- **Balance history / graph** — balance over time requires a separate audit log collection. Out of scope.
- **Push notifications for low balance** — requires a background job runner. Out of scope.
- **Multi-currency** — PKR only.
- **Backfilling existing transactions into bank balances** — balance starts at 0 (or user-provided initial balance) from the day the feature ships. Historical re-computation is a separate migration script.
- **Shared / joint accounts** — single-user balances only.
