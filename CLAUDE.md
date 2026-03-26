# Rizqly - Development Guidelines

> A living reference for building and maintaining the Rizqly codebase.
> Read this before writing code. Follow these patterns for consistency.

---

## Table of Contents

- [Product Context](#product-context)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API State Management (TanStack Query)](#api-state-management-tanstack-query)
- [Clean Code Architecture](#clean-code-architecture)
- [Service Layer](#service-layer)
- [API Route Conventions](#api-route-conventions)
- [Error Handling](#error-handling)
- [Component Patterns](#component-patterns)
- [Styling & Design System](#styling--design-system)
- [File & Naming Conventions](#file--naming-conventions)
- [Code Examples](#code-examples)

---

## Product Context

Rizqly is a Gen-Z personal finance & expense management app with two experiences:

- **Mobile App** (primary) - Fast, emotional, addictive. Daily companion. Dark mode, glassmorphism, emoji-driven.
- **Desktop Dashboard** (secondary) - Calm, analytical, minimal. Weekly review & planning.

Both share brand identity (colors, typography, icons, tone) but differ in layout, navigation, and interaction density.

**Target user:** Gen Z (18-28), mobile-first, checks phone daily, uses desktop occasionally.

**Design philosophy:**
- Mobile = lifestyle app, not fintech. Everything within 2 taps.
- Desktop = clean command center, not a corporate dashboard.
- Never: old-school finance UI, heavy tables, corporate dashboards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js 4 (Google OAuth) |
| State | TanStack Query (React Query) |
| UI Primitives | Radix UI |
| Charts | Recharts |

---

## Project Structure

```
app/
  api/                    # API routes (one folder per resource)
    auth/[...nextauth]/   # NextAuth configuration
    expenses/             # Expense CRUD
    categories/           # Category CRUD
    banks/                # Bank account CRUD
    profile/              # User profile
  (routes)/               # Page routes
    budget/               # Main dashboard
    settings/             # User settings
    auth/                 # Login page

components/
  mobile/                 # Mobile-specific components
  desktop/                # Desktop-specific components
  shared/                 # Shared across both experiences

hooks/                    # Custom React hooks
  queries/                # TanStack Query hooks (data fetching)
  mutations/              # TanStack Query mutation hooks
  use*.ts                 # Other custom hooks

lib/
  mongodb/                # Database connection & models
    client.ts             # MongoClient singleton
    mongoose.ts           # Mongoose connection helper
    models.ts             # All Mongoose schemas/models

services/                 # Business logic layer (no React)
  expense.service.ts      # Expense operations
  category.service.ts     # Category operations
  bank.service.ts         # Bank operations

types/                    # TypeScript type definitions
utils/                    # Pure utility functions
```

**Key rule:** Components render UI. Hooks manage state. Services handle business logic. Keep them separate.

---

## API State Management (TanStack Query)

### Why TanStack Query

Raw `useEffect` + `fetch` + `useState` leads to bugs: race conditions, stale data, no caching, manual loading/error states. TanStack Query solves all of this with declarative data fetching, automatic caching, background refetching, and built-in optimistic updates.

### Query Key Conventions

Use a factory pattern for query keys to keep them consistent and enable targeted invalidation:

```typescript
// lib/queryKeys.ts
export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
    list: (filters?: { month?: string; category?: string }) =>
      ['expenses', 'list', filters] as const,
    detail: (id: string) => ['expenses', 'detail', id] as const,
    stats: (month?: string) => ['expenses', 'stats', month] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
  },
  banks: {
    all: ['banks'] as const,
    list: () => ['banks', 'list'] as const,
  },
  profile: {
    current: ['profile'] as const,
  },
} as const;
```

### Query Hook Pattern

Every data-fetching hook lives in `hooks/queries/` and follows this structure:

```typescript
// hooks/queries/useExpenses.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { expenseService } from '@/services/expense.service';

export function useExpenses(filters?: { month?: string; category?: string }) {
  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: () => expenseService.getAll(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes before refetch
  });
}

export function useExpenseStats(month?: string) {
  return useQuery({
    queryKey: queryKeys.expenses.stats(month),
    queryFn: () => expenseService.getStats(month),
    staleTime: 1000 * 60 * 5,
  });
}
```

### Mutation Hook Pattern with Optimistic Updates

Mutations live in `hooks/mutations/` and always include:
1. Optimistic update for instant UI feedback
2. Rollback on error
3. Cache invalidation on success

```typescript
// hooks/mutations/useAddExpense.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { expenseService } from '@/services/expense.service';
import type { Expense, CreateExpenseInput } from '@/types/expense';

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expenseService.create(input),

    // Optimistic update: show the expense immediately
    onMutate: async (newExpense) => {
      // Cancel in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all });

      // Snapshot current data for rollback
      const previousExpenses = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.list()
      );

      // Optimistically add to cache with a temporary ID
      queryClient.setQueryData<Expense[]>(
        queryKeys.expenses.list(),
        (old = []) => [
          {
            id: `temp-${Date.now()}`,
            ...newExpense,
            createdAt: new Date().toISOString(),
          } as Expense,
          ...old,
        ]
      );

      return { previousExpenses };
    },

    // Rollback on error
    onError: (_err, _newExpense, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(
          queryKeys.expenses.list(),
          context.previousExpenses
        );
      }
    },

    // Refetch to sync with server truth
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
```

### When to Use Optimistic Updates

| Scenario | Use Optimistic? | Why |
|----------|----------------|-----|
| Adding an expense | Yes | User expects instant feedback |
| Deleting an expense | Yes | Item should disappear immediately |
| Updating profile | No | Rare action, can wait for confirmation |
| Fetching data | N/A | Queries, not mutations |

### Provider Setup

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2,       // 2 min before background refetch
            gcTime: 1000 * 60 * 30,          // 30 min cache lifetime
            retry: 2,
            refetchOnWindowFocus: true,       // Sync when user returns to tab
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## Clean Code Architecture

### Separation of Concerns

```
Component (UI)  -->  Hook (state + coordination)  -->  Service (logic)  -->  API
```

- **Components** render JSX, handle user interactions, call hooks. No fetch calls, no business logic.
- **Hooks** coordinate state, call services, return data + actions to components.
- **Services** contain business logic, API calls, data transformation. No React imports.

### Why This Matters

When business logic lives in components:
- You can't test it without rendering
- You can't reuse it across mobile and desktop
- Components grow to 500+ lines and become unmaintainable

When logic lives in services:
- Test business logic independently
- Share between mobile and desktop experiences
- Components stay small and focused on rendering

### Rules

1. **No `fetch()` in components.** Always go through a hook or service.
2. **No `useState` for server data.** Use TanStack Query instead.
3. **Hooks should be thin.** They wire up TanStack Query to services. Heavy logic goes in services.
4. **Services are pure TypeScript.** No `useState`, no `useEffect`, no JSX. Just functions.
5. **One hook per concern.** Don't make a single hook that manages expenses, categories, and banks.

---

## Service Layer

Services live in `services/` and handle all API communication and data transformation:

```typescript
// services/expense.service.ts
import type { Expense, CreateExpenseInput } from '@/types/expense';

const BASE_URL = '/api/expenses';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const expenseService = {
  async getAll(filters?: { month?: string; category?: string }): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.month) params.set('month', filters.month);
    if (filters?.category) params.set('category', filters.category);

    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    return handleResponse<Expense[]>(await fetch(url));
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    return handleResponse<Expense>(
      await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    );
  },

  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: 'DELETE' })
    );
  },

  async getStats(month?: string) {
    const expenses = await this.getAll(month ? { month } : undefined);
    return calculateMonthlyStats(expenses);
  },
};

function calculateMonthlyStats(expenses: Expense[]) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return { totalSpent, byCategory, count: expenses.length };
}
```

### Service Rules

- One service file per resource (`expense.service.ts`, `category.service.ts`)
- Export a single object with all methods (not individual functions)
- Handle HTTP response parsing in a shared `handleResponse` helper
- Keep data transformation logic in the service, not in hooks or components
- Services are stateless - no caching (TanStack Query handles that)

---

## API Route Conventions

Every API route follows this pattern:

```typescript
// app/api/[resource]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb/mongoose';
import { ResourceModel } from '@/lib/mongodb/models';

export async function GET(req: Request) {
  // 1. Auth check (always first)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Connect to DB
    await dbConnect();

    // 3. Query with user isolation
    const data = await ResourceModel.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // 4. Transform _id to id for client consumption
    const formatted = data.map(({ _id, ...rest }) => ({
      id: _id.toString(),
      ...rest,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[GET /api/resource]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Rules

1. **Always check auth first.** Every route starts with `getServerSession`.
2. **Always scope by userId.** Never return data from other users.
3. **Always transform `_id` to `id`.** MongoDB uses `_id`, clients expect `id`.
4. **Always wrap in try/catch.** Log errors server-side, return generic messages to client.
5. **Use appropriate HTTP status codes.** 200 success, 201 created, 400 bad input, 401 unauthorized, 404 not found, 500 server error.
6. **Validate input on POST/PATCH.** Check required fields exist before database operations.

---

## Error Handling

### API Layer

```typescript
// Consistent error response shape
type ApiError = {
  error: string;        // User-facing message
  code?: string;        // Machine-readable code (e.g., 'DUPLICATE_ENTRY')
  field?: string;       // Which field caused the error (for validation)
};
```

### Client Layer

TanStack Query handles error states automatically. Access via the `error` property:

```typescript
function ExpenseList() {
  const { data, error, isLoading } = useExpenses();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage message={error.message} />;

  return <>{data.map(expense => <ExpenseCard key={expense.id} expense={expense} />)}</>;
}
```

### Rules

1. **Never use `alert()` for errors.** Use inline error UI or toast notifications.
2. **Never swallow errors silently.** Always log or display them.
3. **Show user-friendly messages.** "Could not save expense. Please try again." not "TypeError: Cannot read property 'id' of undefined".
4. **Retry automatically for network errors.** TanStack Query does this by default (2 retries).

---

## Component Patterns

### Component Structure

Every component follows this order:

```typescript
'use client';

// 1. External imports
import { useState } from 'react';
import { motion } from 'framer-motion';

// 2. Internal imports (hooks, services, types, components)
import { useExpenses } from '@/hooks/queries/useExpenses';
import type { Expense } from '@/types/expense';

// 3. Types for this component's props
interface ExpenseCardProps {
  expense: Expense;
  onDelete?: (id: string) => void;
}

// 4. Component
export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false);

  // Derived values
  const formattedAmount = formatCurrency(expense.amount);

  // Handlers
  const handleDelete = () => onDelete?.(expense.id);

  // Render
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* JSX */}
    </motion.div>
  );
}
```

### Rules

1. **Named exports only.** `export function Component()` not `export default`.
2. **One component per file.** Small helper components in the same file are fine if they're only used there.
3. **Props interface above the component.** Named `ComponentNameProps`.
4. **No inline styles.** Use Tailwind classes.
5. **Use Framer Motion for animations.** Import `motion` and use `motion.div`, `AnimatePresence`, etc.
6. **Mobile components in `components/mobile/`.** Desktop in `components/desktop/`. Shared in `components/shared/`.

---

## Styling & Design System

### Design Tokens (CSS Variables)

```css
--background: #0F0F11;
--card-bg: #1A1B2E;
--accent-lime: #CCFF00;
--accent-coral: #FF6B6B;
--text-main: #FFFFFF;
--text-muted: #8F90A6;
```

### Rules

1. **Dark mode first.** Background `#0F0F11`, text `#FFFFFF`.
2. **Glassmorphism for cards.** Use the `.glass` utility class for frosted glass effect.
3. **Custom border radius.** Use `rounded-[20px]` or `rounded-[32px]` for the Rizqly look.
4. **Framer Motion for all animations.** Entry animations, micro-interactions, transitions.
5. **Mobile-first responsive.** Design for mobile, then add desktop breakpoints.
6. **Icons > text.** Use emojis for categories. Prefer visual indicators over labels.

### Category Colors & Emojis

```typescript
const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍔', Transport: '🚕', Shopping: '🛍️',
  Bills: '📄', Entertainment: '🎬', Health: '💊',
  Education: '📚', Groceries: '🛒', Other: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6B6B', Transport: '#4ECDC4', Shopping: '#45B7D1',
  Bills: '#96CEB4', Entertainment: '#FFEAA7', Health: '#DDA0DD',
  Education: '#98D8C8', Groceries: '#F7DC6F', Other: '#BB8FCE',
};
```

---

## File & Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `BalanceCard.tsx` |
| Hooks | camelCase with `use` prefix | `useExpenses.ts` |
| Services | kebab-case with `.service` suffix | `expense.service.ts` |
| Types | kebab-case or grouped in `types/` | `expense.ts` |
| Utils | camelCase | `expenseParser.ts` |
| API routes | folder per resource | `api/expenses/route.ts` |
| Pages | folder with `page.tsx` | `budget/page.tsx` |
| Query keys | centralized in `lib/queryKeys.ts` | - |

### Import Order

1. React / Next.js
2. Third-party packages (`framer-motion`, `@tanstack/react-query`, `@radix-ui/*`)
3. Internal: hooks, services, utils
4. Internal: components
5. Internal: types
6. Styles (if any)

---

## Code Examples

### Example 1: Full Query + Mutation Hook with Optimistic Delete

This shows the complete pattern for deleting an expense with instant UI feedback:

```typescript
// hooks/mutations/useDeleteExpense.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { expenseService } from '@/services/expense.service';
import type { Expense } from '@/types/expense';

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseService.delete(id),

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all });

      const previousExpenses = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.list()
      );

      // Remove from cache immediately
      queryClient.setQueryData<Expense[]>(
        queryKeys.expenses.list(),
        (old = []) => old.filter((e) => e.id !== deletedId)
      );

      return { previousExpenses };
    },

    onError: (_err, _id, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(
          queryKeys.expenses.list(),
          context.previousExpenses
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
```

### Example 2: Custom Hook Separating Logic from UI

This hook encapsulates all expense form logic so the component only handles rendering:

```typescript
// hooks/useExpenseForm.ts
import { useState, useCallback } from 'react';
import { useAddExpense } from '@/hooks/mutations/useAddExpense';
import { useCategories } from '@/hooks/queries/useCategories';
import { useBanks } from '@/hooks/queries/useBanks';
import { parseExpense } from '@/utils/expenseParser';
import type { CreateExpenseInput } from '@/types/expense';

export function useExpenseForm(onSuccess?: () => void) {
  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: banks = [] } = useBanks();
  const addExpense = useAddExpense();

  const parsedPreview = rawInput.length > 2 ? parseExpense(rawInput) : null;

  const submit = useCallback(async () => {
    setError(null);

    const parsed = parseExpense(rawInput);
    if (!parsed) {
      setError('Could not understand that. Try "500 lunch from meezan"');
      return;
    }

    const input: CreateExpenseInput = {
      amount: parsed.amount,
      description: parsed.description,
      category: parsed.category,
      bank_account: parsed.bankAccount,
      raw_input: parsed.rawInput,
      date: new Date().toISOString().split('T')[0],
    };

    addExpense.mutate(input, {
      onSuccess: () => {
        setRawInput('');
        onSuccess?.();
      },
      onError: (err) => {
        setError(err.message);
      },
    });
  }, [rawInput, addExpense, onSuccess]);

  const reset = useCallback(() => {
    setRawInput('');
    setError(null);
  }, []);

  return {
    rawInput,
    setRawInput,
    parsedPreview,
    categories,
    banks,
    error,
    isSubmitting: addExpense.isPending,
    submit,
    reset,
  };
}
```

The component using this hook stays clean:

```tsx
// components/mobile/QuickExpenseInput.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useExpenseForm } from '@/hooks/useExpenseForm';

interface QuickExpenseInputProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickExpenseInput({ isOpen, onClose }: QuickExpenseInputProps) {
  const {
    rawInput, setRawInput, parsedPreview,
    error, isSubmitting, submit, reset,
  } = useExpenseForm(() => onClose());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] bg-[var(--card-bg)] p-6"
        >
          <input
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder='Try "500 lunch from meezan"'
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-white"
            autoFocus
          />

          {parsedPreview && (
            <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-[var(--text-muted)]">
              {parsedPreview.category} - Rs. {parsedPreview.amount}
            </div>
          )}

          {error && <p className="mt-2 text-sm text-[var(--accent-coral)]">{error}</p>}

          <button
            onClick={submit}
            disabled={isSubmitting || !rawInput}
            className="mt-4 w-full rounded-2xl bg-[var(--accent-lime)] py-3 font-semibold text-black"
          >
            {isSubmitting ? 'Saving...' : 'Add Expense'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Example 3: Service Layer with Typed Responses

Shows how to structure a service that other resources can follow:

```typescript
// services/category.service.ts
import type { Category, CreateCategoryInput } from '@/types/category';

const BASE_URL = '/api/categories';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    return handleResponse<Category[]>(await fetch(BASE_URL));
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    return handleResponse<Category>(
      await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    );
  },

  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: 'DELETE' })
    );
  },
};
```

### Example 4: API Route with Input Validation

```typescript
// app/api/expenses/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb/mongoose';
import { Expense } from '@/lib/mongodb/models';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate required fields
    const { amount, description, category, date } = body;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number', field: 'amount' },
        { status: 400 }
      );
    }
    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required', field: 'description' },
        { status: 400 }
      );
    }

    await dbConnect();

    const expense = await Expense.create({
      userId: session.user.id,
      amount,
      description: description.trim(),
      category: category || 'Other',
      bank_account: body.bank_account || '',
      raw_input: body.raw_input || '',
      date: date || new Date().toISOString().split('T')[0],
    });

    return NextResponse.json(
      {
        id: expense._id.toString(),
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        bank_account: expense.bank_account,
        date: expense.date,
        created_at: expense.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/expenses]', error);
    return NextResponse.json({ error: 'Could not save expense' }, { status: 500 });
  }
}
```

### Example 5: Composing Hooks in a Page Component

Shows how a page stays clean by delegating all logic to hooks:

```typescript
// app/budget/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/queries/useExpenses';
import { useExpenseStats } from '@/hooks/queries/useExpenses';
import { BalanceCard } from '@/components/mobile/BalanceCard';
import { SpendingPieChart } from '@/components/mobile/SpendingPieChart';
import { QuickExpenseInput } from '@/components/mobile/QuickExpenseInput';
import { FloatingActionButton } from '@/components/mobile/FloatingActionButton';

export default function BudgetPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: stats } = useExpenseStats();
  const [showInput, setShowInput] = useState(false);

  if (authLoading || isLoading) return <LoadingSkeleton />;
  if (!user) return <RedirectToAuth />;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--background)] px-4 pb-24 pt-12"
    >
      <BalanceCard stats={stats} />
      <SpendingPieChart expenses={expenses} />

      <FloatingActionButton onClick={() => setShowInput(true)} />
      <QuickExpenseInput
        isOpen={showInput}
        onClose={() => setShowInput(false)}
      />
    </motion.main>
  );
}
```

---

## Quick Reference Checklist

Before submitting code, verify:

- [ ] No `fetch()` calls in components (use hooks/services)
- [ ] No `useState` for server data (use TanStack Query)
- [ ] API routes check auth and scope by `userId`
- [ ] MongoDB `_id` transformed to `id` in API responses
- [ ] Errors shown in UI, not via `alert()`
- [ ] Animations use Framer Motion
- [ ] Components are in the correct folder (mobile/desktop/shared)
- [ ] New query hooks use the `queryKeys` factory
- [ ] Mutations include optimistic updates where appropriate
- [ ] TypeScript types defined for all props and API payloads
