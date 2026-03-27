import type {
  SpendStreakResponse,
  StreakData,
  UnderBudgetStreakData,
  UpdateStreakSettingsInput,
} from "@/types/streak";

// ---------------------------------------------------------------------------
// Shared expense shape used by the pure computation functions.
// This mirrors the fields we care about from IExpense (server) and Expense (client).
// ---------------------------------------------------------------------------
export interface StreakExpense {
  amount: number;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Returns today's date as a YYYY-MM-DD string in UTC, which is the same
 * format stored in the Expense.date field.
 */
export function todayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Subtracts `days` calendar days from a YYYY-MM-DD string and returns the
 * resulting YYYY-MM-DD string. Uses UTC arithmetic to avoid DST surprises.
 */
export function subtractDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0];
}

/**
 * Detects "recurring" categories from a set of expenses.
 *
 * A category is considered recurring if it appears in at least 2 distinct
 * calendar months within the supplied expense list.  The caller should already
 * have filtered the list to the relevant look-back window (e.g. 90 days).
 *
 * Returns a Set of category name strings.
 */
export function detectRecurringExpenses(expenses: StreakExpense[]): Set<string> {
  // category -> Set of "YYYY-MM" month strings
  const categoryMonths = new Map<string, Set<string>>();

  for (const e of expenses) {
    const month = e.date.slice(0, 7); // "YYYY-MM"
    if (!categoryMonths.has(e.category)) {
      categoryMonths.set(e.category, new Set());
    }
    categoryMonths.get(e.category)!.add(month);
  }

  const recurring = new Set<string>();
  for (const [category, months] of categoryMonths.entries()) {
    if (months.size >= 2) {
      recurring.add(category);
    }
  }

  return recurring;
}

/**
 * Determines whether an expense is "impulse".
 *
 * An expense is impulse when BOTH of the following are true:
 *   1. Its category is NOT in the recurring set.
 *   2. Its amount does not match any "recurring amount" pattern — defined as an
 *      amount that appears 2+ times in the full expense list within ±20% tolerance.
 */
function isImpulseExpense(
  expense: StreakExpense,
  recurringCategories: Set<string>,
  recurringAmounts: number[]
): boolean {
  if (recurringCategories.has(expense.category)) {
    return false;
  }

  const LOW = 0.8;
  const HIGH = 1.2;
  const matchesRecurringAmount = recurringAmounts.some(
    (ra) => expense.amount >= ra * LOW && expense.amount <= ra * HIGH
  );

  return !matchesRecurringAmount;
}

/**
 * Builds the list of amounts that qualify as "recurring" — appearing 2+ times
 * in the full expense set (with ±20% tolerance between any two occurrences).
 *
 * The algorithm clusters amounts: for each expense amount, if it's within ±20%
 * of an already-seen cluster representative, it increments that cluster's count.
 * If a cluster reaches 2+ occurrences its representative amount is flagged.
 */
function buildRecurringAmounts(expenses: StreakExpense[]): number[] {
  // [representative amount, count]
  const clusters: Array<[number, number]> = [];

  for (const e of expenses) {
    let matched = false;
    for (const cluster of clusters) {
      const rep = cluster[0];
      if (e.amount >= rep * 0.8 && e.amount <= rep * 1.2) {
        cluster[1]++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push([e.amount, 1]);
    }
  }

  return clusters.filter(([, count]) => count >= 2).map(([rep]) => rep);
}

// ---------------------------------------------------------------------------
// Mourning message generator
// ---------------------------------------------------------------------------

/**
 * Generates a Gen-Z, shame-free mourning message for a broken streak.
 *
 * Returns null when there is nothing to mourn (streak just started, count 0).
 */
export function generateMourningMessage(
  streakType: "noImpulse" | "underBudget",
  count: number,
  amount: number | null,
  description?: string | null
): string | null {
  if (count === 0) return null;

  if (count === 1) {
    return `1-day streak ended — hey, even 1 day counts! 💪`;
  }

  if (streakType === "noImpulse") {
    const desc = description ? description : "that purchase";
    const amountStr = amount !== null ? `PKR ${Math.round(amount)}` : "that";
    return `Your ${count}-day no-impulse streak ended. That ${amountStr} on ${desc} — worth it though, right? 👀`;
  }

  // underBudget
  return `Your ${count}-day under-budget streak ended. Happens to the best of us 😌`;
}

// ---------------------------------------------------------------------------
// Core streak computation  (pure — no I/O, deterministic)
// ---------------------------------------------------------------------------

export interface ComputedNoImpulse {
  currentCount: number;
  startDate: string | null;
  lastBrokenDate: string | null;
  lastBrokenAmount: number | null;
  lastBrokenDescription: string | null;
}

export interface ComputedUnderBudget {
  currentCount: number;
  startDate: string | null;
  lastBrokenDate: string | null;
  lastBrokenAmount: number | null;
}

/**
 * Computes the No-Impulse streak from a list of expenses.
 *
 * Walk backward from today.  A day "passes" if it contains zero impulse
 * expenses.  Today always counts as a passing day if no impulse expense has
 * been recorded for it yet (the day isn't over).
 */
export function computeNoImpulseStreak(
  expenses: StreakExpense[]
): ComputedNoImpulse {
  if (expenses.length === 0) {
    return {
      currentCount: 0,
      startDate: null,
      lastBrokenDate: null,
      lastBrokenAmount: null,
      lastBrokenDescription: null,
    };
  }

  const recurringCategories = detectRecurringExpenses(expenses);
  const recurringAmounts = buildRecurringAmounts(expenses);

  // Group expenses by date
  const byDate = new Map<string, StreakExpense[]>();
  for (const e of expenses) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const today = todayUTC();
  let count = 0;
  let currentDate = today;
  let lastBrokenDate: string | null = null;
  let lastBrokenAmount: number | null = null;
  let lastBrokenDescription: string | null = null;

  // Walk backward up to 365 days to find where the streak breaks
  for (let i = 0; i < 365; i++) {
    const dayExpenses = byDate.get(currentDate) ?? [];
    const impulseExpenses = dayExpenses.filter((e) =>
      isImpulseExpense(e, recurringCategories, recurringAmounts)
    );

    if (impulseExpenses.length === 0) {
      // Clean day — only count it in the streak if we've already started
      // counting OR it's today (today is always included).
      // Days with zero total expenses also count as clean.
      count++;
    } else {
      // This day has impulse spending — streak breaks here
      // Record the most expensive impulse expense on this day as the break info
      const worst = impulseExpenses.reduce((a, b) =>
        b.amount > a.amount ? b : a
      );
      lastBrokenDate = currentDate;
      lastBrokenAmount = worst.amount;
      lastBrokenDescription = worst.description;
      break;
    }

    currentDate = subtractDays(currentDate, 1);
  }

  const startDate =
    count > 0 ? subtractDays(today, count - 1) : null;

  return {
    currentCount: count,
    startDate,
    lastBrokenDate,
    lastBrokenAmount,
    lastBrokenDescription,
  };
}

/**
 * Computes the Under-Budget streak from a list of expenses and a daily budget.
 *
 * Walk backward from today.  A day "passes" if the sum of expenses on that day
 * is strictly less than `dailyBudget`.
 *
 * Today is always included in the walk — if today's total is already >= budget
 * the streak breaks immediately.
 */
export function computeUnderBudgetStreak(
  expenses: StreakExpense[],
  dailyBudget: number
): ComputedUnderBudget {
  if (expenses.length === 0) {
    return {
      currentCount: 0,
      startDate: null,
      lastBrokenDate: null,
      lastBrokenAmount: null,
    };
  }

  // Group expenses by date → daily totals
  const dailyTotals = new Map<string, number>();
  for (const e of expenses) {
    dailyTotals.set(e.date, (dailyTotals.get(e.date) ?? 0) + e.amount);
  }

  const today = todayUTC();
  let count = 0;
  let currentDate = today;
  let lastBrokenDate: string | null = null;
  let lastBrokenAmount: number | null = null;

  for (let i = 0; i < 365; i++) {
    const total = dailyTotals.get(currentDate) ?? 0;

    if (total < dailyBudget) {
      count++;
    } else {
      lastBrokenDate = currentDate;
      lastBrokenAmount = total;
      break;
    }

    currentDate = subtractDays(currentDate, 1);
  }

  const startDate =
    count > 0 ? subtractDays(today, count - 1) : null;

  return {
    currentCount: count,
    startDate,
    lastBrokenDate,
    lastBrokenAmount,
  };
}

/**
 * Auto-calculates a daily budget from the last 30 days of expenses.
 * Minimum floor of PKR 100.
 */
export function autoDailyBudget(expenses: StreakExpense[]): number {
  const today = todayUTC();
  const thirtyDaysAgo = subtractDays(today, 30);

  const recent = expenses.filter((e) => e.date >= thirtyDaysAgo);
  if (recent.length === 0) return 500; // sensible default for brand-new users

  const total = recent.reduce((sum, e) => sum + e.amount, 0);
  const avg = total / 30;
  return Math.max(100, Math.round(avg));
}

// ---------------------------------------------------------------------------
// Mourning message gating — only show the message when the break is "fresh"
// (i.e. the break date is today or yesterday).
// ---------------------------------------------------------------------------

function isFreshBreak(brokenDate: string | null): boolean {
  if (!brokenDate) return false;
  const today = todayUTC();
  const yesterday = subtractDays(today, 1);
  return brokenDate === today || brokenDate === yesterday;
}

// ---------------------------------------------------------------------------
// Client-side HTTP service
// ---------------------------------------------------------------------------

const BASE_URL = "/api/streaks";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }
  return res.json() as Promise<T>;
}

/**
 * Attaches mourning messages to the raw API response based on whether each
 * streak's last break was recent.  This keeps the messages purely client-side
 * (no need to persist them on the server).
 */
function attachMourningMessages(raw: SpendStreakResponse): SpendStreakResponse {
  const noImpulseMourning = isFreshBreak(raw.noImpulse.lastBrokenDate)
    ? generateMourningMessage(
        "noImpulse",
        raw.noImpulse.currentCount,
        raw.noImpulse.lastBrokenAmount,
        raw.noImpulse.lastBrokenDescription
      )
    : null;

  const underBudgetMourning = isFreshBreak(raw.underBudget.lastBrokenDate)
    ? generateMourningMessage(
        "underBudget",
        raw.underBudget.currentCount,
        raw.underBudget.lastBrokenAmount
      )
    : null;

  return {
    ...raw,
    noImpulse: { ...raw.noImpulse, mourningMessage: noImpulseMourning },
    underBudget: { ...raw.underBudget, mourningMessage: underBudgetMourning },
  };
}

export const streakService = {
  async get(): Promise<SpendStreakResponse> {
    const raw = await handleResponse<SpendStreakResponse>(await fetch(BASE_URL));
    return attachMourningMessages(raw);
  },

  async updateSettings(
    input: UpdateStreakSettingsInput
  ): Promise<SpendStreakResponse> {
    const raw = await handleResponse<SpendStreakResponse>(
      await fetch(BASE_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return attachMourningMessages(raw);
  },

  async recalculate(): Promise<SpendStreakResponse> {
    const raw = await handleResponse<SpendStreakResponse>(
      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recalculate" }),
      })
    );
    return attachMourningMessages(raw);
  },
};
