import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { ComparisonItem } from "@/lib/mongodb/models";
import { DEFAULT_COMPARISON_ITEMS } from "@/services/comparison.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatItem(doc: any) {
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

/**
 * Seeds the default comparison items for a user if they have none yet.
 * Called lazily on first GET so new users see useful items immediately.
 */
async function seedDefaultsIfNeeded(userId: string): Promise<void> {
  const count = await ComparisonItem.countDocuments({ userId });
  if (count > 0) return;

  await ComparisonItem.insertMany(
    DEFAULT_COMPARISON_ITEMS.map((item) => ({
      ...item,
      userId,
      enabled: true,
      is_default: true,
    }))
  );
}

// ---------------------------------------------------------------------------
// GET /api/comparisons
// Returns all comparison items for the current user (seeds defaults on first call).
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = session.user.id;

    await seedDefaultsIfNeeded(userId);

    const items = await ComparisonItem.find({ userId })
      .sort({ is_default: -1, createdAt: 1 }) // defaults first, then user-created
      .lean();

    return NextResponse.json(items.map(formatItem));
  } catch (err) {
    console.error("[GET /api/comparisons]", err);
    return NextResponse.json(
      { error: "Failed to fetch comparison items" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/comparisons
// Creates a new user-defined comparison item.
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { label, amount, emoji } = body as {
      label?: unknown;
      amount?: unknown;
      emoji?: unknown;
    };

    if (!label || typeof label !== "string" || !label.trim()) {
      return NextResponse.json(
        { error: "Label is required", field: "label" },
        { status: 400 }
      );
    }
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number", field: "amount" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    await dbConnect();

    // Prevent duplicate labels (case-insensitive)
    const existing = await ComparisonItem.findOne({
      userId,
      label: { $regex: new RegExp(`^${label.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A comparison item with this label already exists", field: "label" },
        { status: 409 }
      );
    }

    const item = await ComparisonItem.create({
      userId,
      label: label.trim(),
      amount,
      emoji: typeof emoji === "string" && emoji.trim() ? emoji.trim() : "💰",
      enabled: true,
      is_default: false,
    });

    return NextResponse.json(formatItem(item.toObject()), { status: 201 });
  } catch (err) {
    console.error("[POST /api/comparisons]", err);
    return NextResponse.json(
      { error: "Failed to create comparison item" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/comparisons
// Updates label, amount, emoji, or enabled state for an existing item.
// ---------------------------------------------------------------------------
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, label, amount, emoji, enabled } = body as {
      id?: unknown;
      label?: unknown;
      amount?: unknown;
      emoji?: unknown;
      enabled?: unknown;
    };

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Item id required" }, { status: 400 });
    }

    // Validate individual fields only when present
    if (label !== undefined) {
      if (typeof label !== "string" || !label.trim()) {
        return NextResponse.json(
          { error: "Label must be a non-empty string", field: "label" },
          { status: 400 }
        );
      }
    }
    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json(
          { error: "Amount must be a positive number", field: "amount" },
          { status: 400 }
        );
      }
    }
    if (enabled !== undefined && typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean", field: "enabled" },
        { status: 400 }
      );
    }

    await dbConnect();
    const userId = session.user.id;

    const item = await ComparisonItem.findOne({ _id: id, userId });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (label !== undefined) item.label = (label as string).trim();
    if (amount !== undefined) item.amount = amount as number;
    if (emoji !== undefined && typeof emoji === "string" && emoji.trim())
      item.emoji = emoji.trim();
    if (enabled !== undefined) item.enabled = enabled as boolean;

    await item.save();

    return NextResponse.json(formatItem(item.toObject()));
  } catch (err) {
    console.error("[PATCH /api/comparisons]", err);
    return NextResponse.json(
      { error: "Failed to update comparison item" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/comparisons?id=<id>
// Removes a comparison item. Both user-created and default items can be deleted.
// ---------------------------------------------------------------------------
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Item id required" }, { status: 400 });
  }

  try {
    await dbConnect();
    const deleted = await ComparisonItem.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/comparisons]", err);
    return NextResponse.json(
      { error: "Failed to delete comparison item" },
      { status: 500 }
    );
  }
}
