import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { ComparisonItem, Expense, Goal } from "@/lib/mongodb/models";
import {
  calculateInsights,
  type CalcGoal,
  type ComparisonItem as ComparisonItemType,
  type CalculateInsightsResponse,
} from "@/services/comparison.service";

// ---------------------------------------------------------------------------
// POST /api/comparisons/calculate
//
// Body:
//   amount                    number   required  — the expense amount in PKR
//   category                  string   optional  — expense category for habit insight
//   monthlyTotalForCategory   number   optional  — caller can pre-supply this to
//                                                   avoid the extra aggregation query
//
// Response: CalculateInsightsResponse
//   insights           ComparisonInsight[]   — up to 3 ranked insights
//   hasComparisonItems boolean               — whether user has enabled items
//                                              (frontend uses this to prompt setup)
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Parse + validate body ---
  let body: {
    amount?: unknown;
    category?: unknown;
    monthlyTotalForCategory?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { amount, category, monthlyTotalForCategory } = body;

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "amount must be a positive number", field: "amount" },
      { status: 400 }
    );
  }
  if (category !== undefined && typeof category !== "string") {
    return NextResponse.json(
      { error: "category must be a string", field: "category" },
      { status: 400 }
    );
  }
  if (
    monthlyTotalForCategory !== undefined &&
    (typeof monthlyTotalForCategory !== "number" || monthlyTotalForCategory < 0)
  ) {
    return NextResponse.json(
      {
        error: "monthlyTotalForCategory must be a non-negative number",
        field: "monthlyTotalForCategory",
      },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const userId = session.user.id;

    // --- Fetch user data in parallel ---
    const [rawItems, rawGoals] = await Promise.all([
      ComparisonItem.find({ userId }).lean(),
      Goal.find({ userId, completed: false }).lean(),
    ]);

    // --- Resolve monthly category total if not provided by caller ---
    let resolvedMonthlyTotal: number | undefined =
      typeof monthlyTotalForCategory === "number"
        ? monthlyTotalForCategory
        : undefined;

    if (
      resolvedMonthlyTotal === undefined &&
      typeof category === "string" &&
      category.trim()
    ) {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const agg = await Expense.aggregate<{ total: number }>([
        {
          $match: {
            userId,
            category: category.trim(),
            date: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      resolvedMonthlyTotal = agg[0]?.total ?? 0;
    }

    // --- Shape raw DB documents into the types the engine expects ---
    const items: ComparisonItemType[] = rawItems.map((i: any) => ({
      id: i._id.toString(),
      label: i.label,
      amount: i.amount,
      emoji: i.emoji,
      enabled: i.enabled,
      is_default: i.is_default,
      createdAt: i.createdAt?.toISOString() ?? "",
    }));

    const goals: CalcGoal[] = rawGoals.map((g: any) => ({
      id: g._id.toString(),
      title: g.title,
      emoji: g.emoji ?? "🎯",
      target_amount: g.target_amount,
      current_amount: g.current_amount,
    }));

    // --- Run the pure calculation engine ---
    const insights = calculateInsights(
      amount,
      goals,
      items,
      typeof category === "string" ? category.trim() : undefined,
      resolvedMonthlyTotal
    );

    const response: CalculateInsightsResponse = {
      insights,
      hasComparisonItems: items.some((i) => i.enabled),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[POST /api/comparisons/calculate]", err);
    return NextResponse.json(
      { error: "Failed to calculate comparison insights" },
      { status: 500 }
    );
  }
}
