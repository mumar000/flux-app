// =============================================================================
// Feature 5: "That Could've Been" Calculator
//
// This file contains three layers:
//   1. TypeScript types (shared client + server)
//   2. Pure calculation engine (no I/O — testable in isolation)
//   3. Client-side HTTP service
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComparisonItem {
  id: string;
  label: string;
  amount: number;
  emoji: string;
  enabled: boolean;
  is_default: boolean;
  createdAt: string;
}

export interface CreateComparisonItemInput {
  label: string;
  amount: number;
  emoji?: string;
}

export interface UpdateComparisonItemInput {
  id: string;
  label?: string;
  amount?: number;
  emoji?: string;
  enabled?: boolean;
}

/** A single parsed goal as needed by the calculation engine. */
export interface CalcGoal {
  id: string;
  title: string;
  emoji: string;
  target_amount: number;
  current_amount: number;
}

/** Insight types surfaced by the "That Could've Been" engine. */
export type InsightType = "goal" | "reference" | "habit";

export interface ComparisonInsight {
  type: InsightType;
  /** Human-readable message shown on the card. */
  message: string;
  emoji: string;
  /** Raw numbers for frontend rendering / tooltips. */
  detail: {
    percentage?: number;           // 0-100+
    goalTitle?: string;
    goalRemaining?: number;        // PKR remaining to hit goal
    referenceLabel?: string;
    referenceAmount?: number;
    multipleNeeded?: number;       // how many more expenses like this = reference item
    habitCategory?: string;
    habitMonthlyTotal?: number;    // PKR spent in this category this month
  };
}

export interface CalculateInsightsRequest {
  amount: number;
  category?: string;
  /** Pre-aggregated monthly total for the category (avoids a second fetch). */
  monthlyTotalForCategory?: number;
}

export interface CalculateInsightsResponse {
  insights: ComparisonInsight[];
  /** True when the user has at least one enabled comparison item.
   *  Frontend uses this to prompt setup if false. */
  hasComparisonItems: boolean;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatPKR(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
}

function formatMultiple(value: number): string {
  if (value >= 10) return Math.round(value).toString();
  if (value >= 2) return value.toFixed(1);
  return value.toFixed(2).replace(/\.?0+$/, "");
}

// ---------------------------------------------------------------------------
// Pure calculation engine
// ---------------------------------------------------------------------------

/**
 * Generates goal-based insights for a given expense amount.
 *
 * Logic:
 *   - Skips completed goals and goals with no remaining amount.
 *   - Calculates what percentage of the REMAINING amount this expense represents.
 *   - Generates a message only when the percentage is ≥ 5% (noise filter).
 *   - Caps at 2 insights, sorted by percentage descending (most impactful first).
 */
export function generateGoalInsights(
  amount: number,
  goals: CalcGoal[]
): ComparisonInsight[] {
  const active = goals.filter(
    (g) => g.current_amount < g.target_amount
  );

  const insights: Array<ComparisonInsight & { _sortKey: number }> = [];

  for (const goal of active) {
    const remaining = goal.target_amount - goal.current_amount;
    if (remaining <= 0) continue;

    const percentage = (amount / remaining) * 100;
    if (percentage < 5) continue; // below noise threshold

    let message: string;
    if (percentage >= 100) {
      message = `That would've completed your '${goal.title}' goal 🎯`;
    } else if (percentage >= 50) {
      message = `That's ${Math.round(percentage)}% of your '${goal.title}' goal (${formatPKR(remaining)} to go)`;
    } else {
      message = `That's ${Math.round(percentage)}% toward your '${goal.title}' goal`;
    }

    insights.push({
      type: "goal",
      message,
      emoji: goal.emoji || "🎯",
      detail: {
        percentage,
        goalTitle: goal.title,
        goalRemaining: remaining,
      },
      _sortKey: percentage,
    });
  }

  return insights
    .sort((a, b) => b._sortKey - a._sortKey)
    .slice(0, 2)
    .map(({ _sortKey: _, ...rest }) => rest);
}

/**
 * Generates reference-item insights for a given expense amount.
 *
 * Three message patterns:
 *   1. expense ≥ item.amount  → "That's Nx {item}" (they bought multiple)
 *   2. expense is 20–99% of item → "That's X% of {item}"
 *   3. expense is 5–19% of item  → "Just N more like this = {item}"
 *
 * Items below 5% of the expense are skipped (too far away to be meaningful).
 * Returns at most 2 insights.
 */
export function generateReferenceInsights(
  amount: number,
  items: ComparisonItem[]
): ComparisonInsight[] {
  const enabled = items.filter((i) => i.enabled);

  const insights: Array<ComparisonInsight & { _sortKey: number }> = [];

  for (const item of enabled) {
    const percentage = (amount / item.amount) * 100;

    // Skip items that represent < 5% of the expense (not useful comparison)
    if (percentage < 5) continue;

    let message: string;
    let sortKey: number;

    if (percentage >= 100) {
      const times = amount / item.amount;
      message = `That's ${formatMultiple(times)}× ${item.emoji} ${item.label}`;
      sortKey = percentage;
    } else if (percentage >= 20) {
      message = `That's ${Math.round(percentage)}% of ${item.emoji} ${item.label}`;
      sortKey = percentage;
    } else {
      // 5–19%: "N more like this = item"
      const needed = Math.ceil(item.amount / amount) - 1;
      if (needed <= 0) continue;
      message = `${needed} more like this = ${item.emoji} ${item.label}`;
      sortKey = percentage;
    }

    insights.push({
      type: "reference",
      message,
      emoji: item.emoji,
      detail: {
        percentage,
        referenceLabel: item.label,
        referenceAmount: item.amount,
        multipleNeeded:
          percentage < 100
            ? Math.ceil(item.amount / amount) - 1
            : undefined,
      },
      _sortKey: sortKey,
    });
  }

  return insights
    .sort((a, b) => b._sortKey - a._sortKey)
    .slice(0, 2)
    .map(({ _sortKey: _, ...rest }) => rest);
}

/**
 * Generates a habit insight: compares the user's *monthly total* in a category
 * against their enabled comparison items.
 *
 * This is the "You've spent PKR 4,200 on chai this month. That's one concert ticket."
 * pattern.
 *
 * Only generates a single insight (the most impactful match), since the habit
 * message already contains all the context.
 *
 * Skips if monthlyTotal <= amount (user has only logged this expense today,
 * nothing to reflect on yet).
 */
export function generateHabitInsight(
  amount: number,
  category: string,
  monthlyTotal: number,
  items: ComparisonItem[]
): ComparisonInsight | null {
  // Only meaningful once there's prior spend in the category beyond this expense
  if (monthlyTotal <= amount) return null;

  const enabled = items.filter((i) => i.enabled);
  if (enabled.length === 0) return null;

  // Find the reference item with the closest whole-number multiple
  let bestItem: ComparisonItem | null = null;
  let bestScore = Infinity;
  let bestMultiple = 0;

  for (const item of enabled) {
    const multiples = monthlyTotal / item.amount;
    if (multiples < 0.3) continue; // too small to be interesting

    // Prefer multiples close to a whole number (1.0, 2.0, etc.)
    const fractionalPart = multiples % 1;
    const distanceFromWhole = Math.min(fractionalPart, 1 - fractionalPart);
    if (distanceFromWhole < bestScore) {
      bestScore = distanceFromWhole;
      bestItem = item;
      bestMultiple = multiples;
    }
  }

  if (!bestItem) return null;

  const multipleStr =
    bestMultiple >= 2
      ? `${formatMultiple(bestMultiple)} ${bestItem.label}s`
      : bestMultiple >= 1
      ? `one ${bestItem.label}`
      : `${Math.round(bestMultiple * 100)}% of a ${bestItem.label}`;

  const message = `You've spent ${formatPKR(monthlyTotal)} on ${category} this month — that's ${multipleStr} ${bestItem.emoji}`;

  return {
    type: "habit",
    message,
    emoji: bestItem.emoji,
    detail: {
      percentage: (monthlyTotal / bestItem.amount) * 100,
      habitCategory: category,
      habitMonthlyTotal: monthlyTotal,
      referenceLabel: bestItem.label,
      referenceAmount: bestItem.amount,
    },
  };
}

/**
 * Combines all three insight generators and returns a deduplicated, ranked list.
 *
 * Ordering: goal insights → reference insights → habit insight.
 * Total capped at 3 insights to avoid overwhelming the user.
 */
export function calculateInsights(
  amount: number,
  goals: CalcGoal[],
  items: ComparisonItem[],
  category?: string,
  monthlyTotalForCategory?: number
): ComparisonInsight[] {
  const results: ComparisonInsight[] = [];

  // 1. Goal-based (most personal, most motivating)
  results.push(...generateGoalInsights(amount, goals));

  // 2. Reference-item equivalence (most concrete)
  results.push(...generateReferenceInsights(amount, items));

  // 3. Category habit (eye-opening)
  if (category && monthlyTotalForCategory !== undefined) {
    const habit = generateHabitInsight(
      amount,
      category,
      monthlyTotalForCategory,
      items
    );
    if (habit) results.push(habit);
  }

  return results.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Default comparison items seeded for new users
// Amounts are in PKR, tuned for a Pakistani urban audience.
// ---------------------------------------------------------------------------

export const DEFAULT_COMPARISON_ITEMS: Array<{
  label: string;
  amount: number;
  emoji: string;
}> = [
  { label: "Cinema Ticket", amount: 700, emoji: "🎬" },
  { label: "Café Day Out", amount: 900, emoji: "☕" },
  { label: "Airport Uber", amount: 1200, emoji: "🚕" },
  { label: "Concert Ticket", amount: 1800, emoji: "🎵" },
  { label: "Monthly App Subscriptions", amount: 500, emoji: "📱" },
  { label: "Monthly Internet Bill", amount: 2200, emoji: "🌐" },
  { label: "Pizza Night", amount: 1600, emoji: "🍕" },
];

// ---------------------------------------------------------------------------
// Client-side HTTP service
// ---------------------------------------------------------------------------

const BASE_URL = "/api/comparisons";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }
  return res.json() as Promise<T>;
}

export const comparisonService = {
  /** Fetch all comparison items for the current user. */
  async getAll(): Promise<ComparisonItem[]> {
    return handleResponse<ComparisonItem[]>(await fetch(BASE_URL));
  },

  /** Create a new comparison item. */
  async create(input: CreateComparisonItemInput): Promise<ComparisonItem> {
    return handleResponse<ComparisonItem>(
      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
  },

  /** Update label, amount, emoji, or enabled state. */
  async update(input: UpdateComparisonItemInput): Promise<ComparisonItem> {
    return handleResponse<ComparisonItem>(
      await fetch(BASE_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
  },

  /** Delete a comparison item by id. */
  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: "DELETE" })
    );
  },

  /**
   * Calculate "That Could've Been" insights for a given expense.
   *
   * `monthlyTotalForCategory` should be the sum of all expenses in the same
   * category this month (including the expense being logged) — the caller
   * computes this from cached expense data to avoid an extra round-trip.
   */
  async calculate(
    req: CalculateInsightsRequest
  ): Promise<CalculateInsightsResponse> {
    return handleResponse<CalculateInsightsResponse>(
      await fetch(`${BASE_URL}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      })
    );
  },
};
