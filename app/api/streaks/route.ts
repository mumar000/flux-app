import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { SpendStreak, type ISpendStreak } from "@/lib/mongodb/models";
import { getUnifiedExpenses, type ExpenseLike } from "@/lib/transactions";
import {
  computeNoImpulseStreak,
  computeUnderBudgetStreak,
  autoDailyBudget,
  type StreakExpense,
} from "@/services/streak.service";
import type { SpendStreakResponse } from "@/types/streak";

// ---------------------------------------------------------------------------
// How stale must computedAt be before we recompute automatically (ms)
// ---------------------------------------------------------------------------
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// ---------------------------------------------------------------------------
// Shape the Mongoose document into the API response format.
// Mourning messages are NOT included here — they are attached client-side
// based on whether the break is "fresh" at the moment the client renders.
// ---------------------------------------------------------------------------
function formatStreakResponse(
  doc: ISpendStreak,
  resolvedDailyBudget: number
): SpendStreakResponse {
  return {
    noImpulse: {
      currentCount: doc.noImpulse.currentCount,
      startDate: doc.noImpulse.startDate,
      lastBrokenDate: doc.noImpulse.lastBrokenDate,
      lastBrokenAmount: doc.noImpulse.lastBrokenAmount,
      lastBrokenDescription: doc.noImpulse.lastBrokenDescription,
      mourningMessage: null, // attached client-side
    },
    underBudget: {
      currentCount: doc.underBudget.currentCount,
      startDate: doc.underBudget.startDate,
      lastBrokenDate: doc.underBudget.lastBrokenDate,
      lastBrokenAmount: doc.underBudget.lastBrokenAmount,
      mourningMessage: null, // attached client-side
    },
    dailyBudget: resolvedDailyBudget,
    computedAt: doc.computedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Core server-side computation: runs pure functions and persists the result
// ---------------------------------------------------------------------------
async function computeAndSaveStreaks(
  userId: string,
  expenses: ExpenseLike[],
  existingStreak: ISpendStreak | null
): Promise<ISpendStreak> {
  // Convert Mongoose docs to the plain StreakExpense shape
  const streakExpenses: StreakExpense[] = expenses.map((e) => ({
    amount: e.amount,
    description: e.description,
    category: e.category,
    date: e.date,
  }));

  // Resolve daily budget: use stored value if set, otherwise auto-calculate
  const storedBudget = existingStreak?.dailyBudget ?? null;
  const resolvedBudget =
    storedBudget !== null ? storedBudget : autoDailyBudget(streakExpenses);

  // Run pure computation
  const noImpulse = computeNoImpulseStreak(streakExpenses);
  const underBudget = computeUnderBudgetStreak(streakExpenses, resolvedBudget);

  const now = new Date();

  // Upsert the SpendStreak document
  const updated = await SpendStreak.findOneAndUpdate(
    { userId },
    {
      $set: {
        noImpulse: {
          currentCount: noImpulse.currentCount,
          startDate: noImpulse.startDate,
          lastBrokenDate: noImpulse.lastBrokenDate,
          lastBrokenAmount: noImpulse.lastBrokenAmount,
          lastBrokenDescription: noImpulse.lastBrokenDescription,
        },
        underBudget: {
          currentCount: underBudget.currentCount,
          startDate: underBudget.startDate,
          lastBrokenDate: underBudget.lastBrokenDate,
          lastBrokenAmount: underBudget.lastBrokenAmount,
        },
        computedAt: now,
      },
    },
    { upsert: true, new: true }
  );

  return updated;
}

// ---------------------------------------------------------------------------
// GET /api/streaks
// Returns current streak state, recomputing if stale (> 30 min)
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const userId = session.user.id;

    // Fetch last 90 days of expenses for performance
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

    const expenses = await getUnifiedExpenses(userId);
    const recentExpenses = expenses.filter((expense) => expense.date >= ninetyDaysAgoStr);

    const existingStreak = await SpendStreak.findOne({ userId }).lean<ISpendStreak>();

    const isStale =
      !existingStreak ||
      Date.now() - new Date(existingStreak.computedAt).getTime() > STALE_THRESHOLD_MS;

    let streakDoc: ISpendStreak;
    if (isStale) {
      streakDoc = await computeAndSaveStreaks(userId, recentExpenses, existingStreak);
    } else {
      streakDoc = existingStreak;
    }

    const resolvedBudget =
      streakDoc.dailyBudget !== null
        ? streakDoc.dailyBudget
        : autoDailyBudget(
            recentExpenses.map((e) => ({
              amount: e.amount,
              description: e.description,
              category: e.category,
              date: e.date,
            }))
          );

    return NextResponse.json(formatStreakResponse(streakDoc, resolvedBudget));
  } catch (error) {
    console.error("[GET /api/streaks]", error);
    return NextResponse.json(
      { error: "Could not retrieve streaks" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/streaks
// Updates dailyBudget setting, then recomputes immediately
// ---------------------------------------------------------------------------
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as { dailyBudget?: unknown };
    const { dailyBudget } = body;

    // Validate: must be null (reset to auto) or a positive number
    if (dailyBudget !== undefined && dailyBudget !== null) {
      if (typeof dailyBudget !== "number" || dailyBudget <= 0) {
        return NextResponse.json(
          {
            error: "dailyBudget must be null or a positive number",
            field: "dailyBudget",
          },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    const userId = session.user.id;

    // Persist the new budget setting first
    await SpendStreak.findOneAndUpdate(
      { userId },
      { $set: { dailyBudget: dailyBudget ?? null } },
      { upsert: true }
    );

    // Fetch expenses for recompute
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

    const expenses = await getUnifiedExpenses(userId);
    const recentExpenses = expenses.filter((expense) => expense.date >= ninetyDaysAgoStr);

    const updatedExisting = await SpendStreak.findOne({ userId }).lean<ISpendStreak>();
    const streakDoc = await computeAndSaveStreaks(
      userId,
      recentExpenses,
      updatedExisting
    );

    const resolvedBudget =
      streakDoc.dailyBudget !== null
        ? streakDoc.dailyBudget
        : autoDailyBudget(
            recentExpenses.map((e) => ({
              amount: e.amount,
              description: e.description,
              category: e.category,
              date: e.date,
            }))
          );

    return NextResponse.json(formatStreakResponse(streakDoc, resolvedBudget));
  } catch (error) {
    console.error("[PATCH /api/streaks]", error);
    return NextResponse.json(
      { error: "Could not update streak settings" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/streaks
// Force-recompute with { action: "recalculate" }
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as { action?: string };

    if (body.action !== "recalculate") {
      return NextResponse.json(
        { error: 'Unknown action. Use { "action": "recalculate" }' },
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

    const expenses = await getUnifiedExpenses(userId);
    const recentExpenses = expenses.filter((expense) => expense.date >= ninetyDaysAgoStr);

    const existingStreak = await SpendStreak.findOne({ userId }).lean<ISpendStreak>();
    const streakDoc = await computeAndSaveStreaks(
      userId,
      recentExpenses,
      existingStreak
    );

    const resolvedBudget =
      streakDoc.dailyBudget !== null
        ? streakDoc.dailyBudget
        : autoDailyBudget(
            recentExpenses.map((e) => ({
              amount: e.amount,
              description: e.description,
              category: e.category,
              date: e.date,
            }))
          );

    return NextResponse.json(formatStreakResponse(streakDoc, resolvedBudget));
  } catch (error) {
    console.error("[POST /api/streaks]", error);
    return NextResponse.json(
      { error: "Could not recompute streaks" },
      { status: 500 }
    );
  }
}
