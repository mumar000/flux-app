import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Bank, Expense, Transaction } from "@/lib/mongodb/models";
import { formatTransactionDoc, getUnifiedTransactions } from "@/lib/transactions";

function formatDoc(doc: Record<string, unknown>) {
  const formatted = { ...doc };
  if (formatted._id) {
    formatted.id = (formatted._id as { toString(): string }).toString();
    delete formatted._id;
  }
  if (formatted.createdAt) {
    formatted.created_at = formatted.createdAt;
    delete formatted.createdAt;
  }
  if (formatted.updatedAt) {
    formatted.updated_at = formatted.updatedAt;
    delete formatted.updatedAt;
  }
  if (formatted.userId) {
    formatted.user_id = formatted.userId;
    delete formatted.userId;
  }
  delete formatted.__v;
  return formatted;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const direction = searchParams.get("direction") as
      | "income"
      | "expense"
      | null;

    await dbConnect();

    const docs = await getUnifiedTransactions(session.user.id, {
      month: month ?? undefined,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      direction: direction ?? undefined,
    });

    const formatted = docs.map((d) =>
      formatDoc(d as unknown as Record<string, unknown>)
    );

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[GET /api/transactions]", error);
    return NextResponse.json(
      { error: "Could not fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const { direction, amount, description, bank_account, category, date } =
      body;

    if (!direction || !["income", "expense"].includes(direction)) {
      return NextResponse.json(
        { error: "direction must be 'income' or 'expense'", field: "direction" },
        { status: 400 }
      );
    }
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number", field: "amount" },
        { status: 400 }
      );
    }
    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Description is required", field: "description" },
        { status: 400 }
      );
    }
    if (!bank_account?.trim()) {
      return NextResponse.json(
        { error: "Bank account is required", field: "bank_account" },
        { status: 400 }
      );
    }

    await dbConnect();

    const doc = await Transaction.create({
      userId: session.user.id,
      direction,
      amount,
      description: description.trim(),
      bank_account: bank_account.trim(),
      category: category || "Other",
      date: date || new Date().toISOString().split("T")[0],
      sourceType: body.sourceType || "manual",
      rawInput: body.rawInput || "",
      scanConfidence: body.scanConfidence ?? null,
      scanStatus: body.scanStatus || "none",
      relatedGoalId: body.relatedGoalId ?? null,
    });

    const delta = direction === "income" ? amount : -amount;
    await Bank.findOneAndUpdate(
      { userId: session.user.id, name: bank_account.trim() },
      { $inc: { balance: delta } }
    );

    return NextResponse.json(
      formatDoc(formatTransactionDoc(doc as typeof doc & { _id: { toString(): string } }) as unknown as Record<string, unknown>),
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/transactions]", error);
    return NextResponse.json(
      { error: "Could not save transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await dbConnect();

    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (deletedTransaction) {
      const delta =
        deletedTransaction.direction === "income"
          ? -deletedTransaction.amount
          : deletedTransaction.amount;
      await Bank.findOneAndUpdate(
        { userId: session.user.id, name: deletedTransaction.bank_account },
        { $inc: { balance: delta } }
      );
      return NextResponse.json({ success: true });
    }

    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!deletedExpense) {
      return NextResponse.json(
        { error: "Not found or not authorized" },
        { status: 404 }
      );
    }

    await Bank.findOneAndUpdate(
      { userId: session.user.id, name: deletedExpense.bank_account },
      { $inc: { balance: deletedExpense.amount } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/transactions]", error);
    return NextResponse.json(
      { error: "Could not delete transaction" },
      { status: 500 }
    );
  }
}
