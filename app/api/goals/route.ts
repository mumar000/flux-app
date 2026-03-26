import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Goal } from "@/lib/mongodb/models";

function formatGoal(doc: any) {
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

// GET — list all goals
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const goals = await Goal.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(goals.map(formatGoal));
  } catch (err) {
    console.error("[GET /api/goals]", err);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

// POST — create a goal
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, target_amount, emoji, deadline } = body;

    if (!title?.trim())
      return NextResponse.json({ error: "Title is required", field: "title" }, { status: 400 });
    if (!target_amount || typeof target_amount !== "number" || target_amount <= 0)
      return NextResponse.json({ error: "Target amount must be a positive number", field: "target_amount" }, { status: 400 });

    await dbConnect();
    const goal = await Goal.create({
      userId: session.user.id,
      title: title.trim(),
      target_amount,
      current_amount: 0,
      emoji: emoji || "🎯",
      deadline: deadline || null,
      completed: false,
    });

    return NextResponse.json(formatGoal(goal.toObject()), { status: 201 });
  } catch (err) {
    console.error("[POST /api/goals]", err);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

// PATCH — add contribution to a goal
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, add_amount } = body;

    if (!id)
      return NextResponse.json({ error: "Goal id required" }, { status: 400 });
    if (typeof add_amount !== "number" || add_amount <= 0)
      return NextResponse.json({ error: "add_amount must be a positive number" }, { status: 400 });

    await dbConnect();
    const goal = await Goal.findOne({ _id: id, userId: session.user.id });
    if (!goal)
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    goal.current_amount = Math.min(goal.current_amount + add_amount, goal.target_amount);
    goal.completed = goal.current_amount >= goal.target_amount;
    await goal.save();

    return NextResponse.json(formatGoal(goal.toObject()));
  } catch (err) {
    console.error("[PATCH /api/goals]", err);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

// DELETE — remove a goal
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Goal id required" }, { status: 400 });

  try {
    await dbConnect();
    const deleted = await Goal.findOneAndDelete({ _id: id, userId: session.user.id });
    if (!deleted)
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/goals]", err);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
