import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { DailyRizq, Expense } from "@/lib/mongodb/models";

// --- Card generation templates ---

interface CardTemplate {
  type: "insight" | "challenge" | "question" | "comparison";
  emoji: string;
  title: string;
  body: string;
  tone: string;
}

function formatPKR(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
}

function generateCards(expenses: {
  thisWeek: { amount: number; category: string; description: string; date: string }[];
  lastWeek: { amount: number; category: string; description: string; date: string }[];
  thisMonth: { amount: number; category: string; description: string; date: string }[];
  yesterday: { amount: number; category: string; description: string; date: string }[];
}): CardTemplate[] {
  const cards: CardTemplate[] = [];

  // Stats
  const weekTotal = expenses.thisWeek.reduce((s, e) => s + e.amount, 0);
  const lastWeekTotal = expenses.lastWeek.reduce((s, e) => s + e.amount, 0);
  const monthTotal = expenses.thisMonth.reduce((s, e) => s + e.amount, 0);
  const yesterdayTotal = expenses.yesterday.reduce((s, e) => s + e.amount, 0);

  // Category breakdown this week
  const weekByCategory: Record<string, number> = {};
  expenses.thisWeek.forEach((e) => {
    weekByCategory[e.category] = (weekByCategory[e.category] || 0) + e.amount;
  });
  const topCategory = Object.entries(weekByCategory).sort(([, a], [, b]) => b - a)[0];

  // Category breakdown this month
  const monthByCategory: Record<string, number> = {};
  expenses.thisMonth.forEach((e) => {
    monthByCategory[e.category] = (monthByCategory[e.category] || 0) + e.amount;
  });

  // Biggest single expense this month
  const biggestExpense = expenses.thisMonth.length > 0
    ? expenses.thisMonth.reduce((max, e) => (e.amount > max.amount ? e : max))
    : null;

  // --- INSIGHT cards ---
  if (topCategory && weekTotal > 0) {
    const catPercentage = Math.round((topCategory[1] / weekTotal) * 100);
    cards.push({
      type: "insight",
      emoji: "🔍",
      title: "Where your money went",
      body: `You spent ${formatPKR(topCategory[1])} on ${topCategory[0]} this week — that's ${catPercentage}% of your weekly spend. Intentional or autopilot?`,
      tone: "curious",
    });
  }

  if (weekTotal > 0 && lastWeekTotal > 0) {
    const diff = weekTotal - lastWeekTotal;
    const direction = diff > 0 ? "more" : "less";
    cards.push({
      type: "insight",
      emoji: diff > 0 ? "📈" : "📉",
      title: diff > 0 ? "Spending went up" : "Nice, you spent less",
      body: `You spent ${formatPKR(Math.abs(diff))} ${direction} this week compared to last week. ${diff > 0 ? "What changed?" : "Whatever you did, keep doing it."}`,
      tone: diff > 0 ? "curious" : "motivating",
    });
  }

  if (biggestExpense && monthTotal > 0) {
    const bigPct = Math.round((biggestExpense.amount / monthTotal) * 100);
    cards.push({
      type: "insight",
      emoji: "💸",
      title: "Your biggest hit this month",
      body: `${formatPKR(biggestExpense.amount)} on "${biggestExpense.description}" — that's ${bigPct}% of your total spend this month. Worth it?`,
      tone: "playful",
    });
  }

  // Food-specific insight
  const foodTotal = monthByCategory["Food"] || 0;
  if (foodTotal > 0) {
    const biryaniEquiv = Math.round(foodTotal / 350);
    cards.push({
      type: "insight",
      emoji: "🍛",
      title: "Your food bill decoded",
      body: `You've spent ${formatPKR(foodTotal)} on food this month. That's roughly ${biryaniEquiv} plates of biryani. Proud or nah?`,
      tone: "playful",
    });
  }

  // Transport insight
  const transportTotal = monthByCategory["Transport"] || 0;
  if (transportTotal > 0) {
    cards.push({
      type: "comparison",
      emoji: "🚕",
      title: "Your commute costs",
      body: `${formatPKR(transportTotal)} on transport this month. That's ${Math.round(transportTotal / monthTotal * 100)}% of your total. Could any of those rides have been walks?`,
      tone: "curious",
    });
  }

  // --- CHALLENGE cards ---
  cards.push({
    type: "challenge",
    emoji: "⚡",
    title: "Today's challenge",
    body: "Spend nothing before noon. Every rupee saved before lunch is a win.",
    tone: "motivating",
  });

  cards.push({
    type: "challenge",
    emoji: "👻",
    title: "Ghost mode",
    body: "Can you go the entire day without opening a food delivery app? Your wallet will thank you.",
    tone: "playful",
  });

  if (yesterdayTotal > 500) {
    cards.push({
      type: "challenge",
      emoji: "🎯",
      title: "Beat yesterday",
      body: `You spent ${formatPKR(yesterdayTotal)} yesterday. Today's challenge: spend less than that. Game on.`,
      tone: "motivating",
    });
  }

  cards.push({
    type: "challenge",
    emoji: "🧊",
    title: "The freeze challenge",
    body: "Pick one category you overspend on. Freeze spending in that category for 24 hours. Just today.",
    tone: "motivating",
  });

  // --- QUESTION cards ---
  cards.push({
    type: "question",
    emoji: "🤔",
    title: "Quick reflection",
    body: "What did you spend money on yesterday without thinking? Not the planned stuff — the autopilot purchases.",
    tone: "curious",
  });

  cards.push({
    type: "question",
    emoji: "💭",
    title: "Real talk",
    body: "If you could undo one purchase from this week, which one would it be? And why did you make it in the first place?",
    tone: "curious",
  });

  if (biggestExpense) {
    cards.push({
      type: "question",
      emoji: "🪞",
      title: "Worth it check",
      body: `Your biggest expense recently: ${formatPKR(biggestExpense.amount)} on "${biggestExpense.description}". Would you buy it again if you had to decide today?`,
      tone: "curious",
    });
  }

  cards.push({
    type: "question",
    emoji: "🌙",
    title: "End of day check",
    body: "One thing you spent on today that made you genuinely happy. One thing that was pure autopilot. Know the difference.",
    tone: "curious",
  });

  // --- COMPARISON cards ---
  if (monthTotal > 0) {
    const dailyAvg = Math.round(monthTotal / new Date().getDate());
    cards.push({
      type: "comparison",
      emoji: "📊",
      title: "Your daily average",
      body: `You're averaging ${formatPKR(dailyAvg)}/day this month. That's ${formatPKR(dailyAvg * 30)}/month if it keeps up.`,
      tone: "playful",
    });
  }

  // Entertainment comparison
  const entertainmentTotal = monthByCategory["Entertainment"] || 0;
  if (entertainmentTotal > 0) {
    cards.push({
      type: "comparison",
      emoji: "🎬",
      title: "Entertainment check",
      body: `${formatPKR(entertainmentTotal)} on entertainment this month. That's ${Math.ceil(entertainmentTotal / 1500)} movie tickets worth of spending. Living your best life or draining your wallet?`,
      tone: "playful",
    });
  }

  return cards;
}

function pickDailyCard(cards: CardTemplate[], date: string, userId: string): CardTemplate {
  // Deterministic but varied selection based on date + userId
  const seed = date.split("-").join("") + userId.slice(-4);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % cards.length;
  return cards[index];
}

// --- GET: Fetch today's card (or generate one) ---
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reflections = searchParams.get("reflections");

  try {
    await dbConnect();

    // Return saved reflections
    if (reflections === "true") {
      const saved = await DailyRizq.find({
        userId: session.user.id,
        saved: true,
      })
        .sort({ date: -1 })
        .limit(30)
        .lean();

      const formatted = saved.map(({ _id, ...rest }) => ({
        id: _id.toString(),
        ...rest,
      }));

      return NextResponse.json(formatted);
    }

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Check if card already exists for today
    const existing = await DailyRizq.findOne({
      userId: session.user.id,
      date: today,
    }).lean();

    if (existing) {
      const { _id, ...rest } = existing;
      return NextResponse.json({ id: _id.toString(), ...rest });
    }

    // Generate a new card based on user's expense data
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const [thisWeekExpenses, lastWeekExpenses, thisMonthExpenses, yesterdayExpenses] =
      await Promise.all([
        Expense.find({
          userId: session.user.id,
          date: { $gte: weekAgo.toISOString().split("T")[0] },
        }).lean(),
        Expense.find({
          userId: session.user.id,
          date: {
            $gte: twoWeeksAgo.toISOString().split("T")[0],
            $lt: weekAgo.toISOString().split("T")[0],
          },
        }).lean(),
        Expense.find({
          userId: session.user.id,
          date: { $gte: monthStart.toISOString().split("T")[0] },
        }).lean(),
        Expense.find({
          userId: session.user.id,
          date: {
            $gte: yesterdayStart.toISOString().split("T")[0],
            $lte: yesterdayEnd.toISOString().split("T")[0],
          },
        }).lean(),
      ]);

    const mapExpense = (e: any) => ({
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date,
    });

    const cards = generateCards({
      thisWeek: thisWeekExpenses.map(mapExpense),
      lastWeek: lastWeekExpenses.map(mapExpense),
      thisMonth: thisMonthExpenses.map(mapExpense),
      yesterday: yesterdayExpenses.map(mapExpense),
    });

    const chosen = pickDailyCard(cards, today, session.user.id);

    // Save to database
    const created = await DailyRizq.create({
      userId: session.user.id,
      ...chosen,
      date: today,
    });

    return NextResponse.json(
      {
        id: created._id.toString(),
        type: created.type,
        emoji: created.emoji,
        title: created.title,
        body: created.body,
        tone: created.tone,
        date: created.date,
        saved: created.saved,
        dismissed: created.dismissed,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[GET /api/daily-rizq]", error);
    return NextResponse.json(
      { error: "Could not load daily rizq" },
      { status: 500 }
    );
  }
}

// --- PATCH: Save to reflections or dismiss ---
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing id or action" },
        { status: 400 }
      );
    }

    if (!["save", "dismiss"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'save' or 'dismiss'" },
        { status: 400 }
      );
    }

    await dbConnect();

    const update =
      action === "save"
        ? { saved: true, interactedAt: new Date() }
        : { dismissed: true, interactedAt: new Date() };

    const card = await DailyRizq.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      update,
      { new: true }
    ).lean();

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const { _id, ...rest } = card;
    return NextResponse.json({ id: _id.toString(), ...rest });
  } catch (error) {
    console.error("[PATCH /api/daily-rizq]", error);
    return NextResponse.json(
      { error: "Could not update card" },
      { status: 500 }
    );
  }
}
