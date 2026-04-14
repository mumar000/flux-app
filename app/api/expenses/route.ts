import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Bank, Expense, Transaction } from "@/lib/mongodb/models";
import { getUnifiedExpenses, transactionToExpenseLike } from "@/lib/transactions";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ?? undefined;
    const formattedExpenses = await getUnifiedExpenses(session.user.id, { month });

    return NextResponse.json(formattedExpenses);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await dbConnect();

    const newTransaction = await Transaction.create({
      userId: session.user.id,
      direction: "expense",
      amount: data.amount,
      description: data.description,
      bank_account: data.bank_account,
      category: data.category ?? "Other",
      date: data.date ?? new Date().toISOString().split("T")[0],
      sourceType: data.sourceType ?? "manual",
      rawInput: data.raw_input ?? data.rawInput ?? "",
      scanConfidence: data.scanConfidence ?? null,
      scanStatus: data.scanStatus ?? "none",
      relatedGoalId: data.relatedGoalId ?? null,
      receiptId: data.receiptId ?? null,
    });

    await Bank.findOneAndUpdate(
      { userId: session.user.id, name: newTransaction.bank_account },
      { $inc: { balance: -newTransaction.amount } }
    );

    const expenseLike = transactionToExpenseLike({
      id: newTransaction._id.toString(),
      direction: "expense",
      amount: newTransaction.amount,
      description: newTransaction.description,
      bank_account: newTransaction.bank_account,
      category: newTransaction.category,
      date: newTransaction.date,
      sourceType: newTransaction.sourceType,
      receiptId: newTransaction.receiptId ?? null,
      rawInput: newTransaction.rawInput ?? "",
      scanConfidence: newTransaction.scanConfidence ?? null,
      scanStatus: newTransaction.scanStatus ?? "none",
      relatedGoalId: newTransaction.relatedGoalId ?? null,
      created_at: newTransaction.createdAt,
      updated_at: newTransaction.updatedAt,
      user_id: session.user.id,
      source: "transaction",
    });

    return NextResponse.json(expenseLike, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await dbConnect();
        const deletedTransaction = await Transaction.findOneAndDelete({
            _id: id,
            userId: session.user.id,
            direction: "expense",
        });

        if (deletedTransaction) {
            await Bank.findOneAndUpdate(
                { userId: session.user.id, name: deletedTransaction.bank_account },
                { $inc: { balance: deletedTransaction.amount } }
            );
            return NextResponse.json({ success: true });
        }

        const deleted = await Expense.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!deleted) {
            return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
        }

        await Bank.findOneAndUpdate(
            { userId: session.user.id, name: deleted.bank_account },
            { $inc: { balance: deleted.amount } }
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
