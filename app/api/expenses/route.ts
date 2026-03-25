import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Expense } from "@/lib/mongodb/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const expenses = await Expense.find({ userId: session.user.id }).sort({ createdAt: -1 });
    
    // Convert Mongoose doc to basic object and rename _id to id for frontend parity
    const formattedExpenses = expenses.map(e => {
        const doc = e.toObject();
        doc.id = doc._id.toString();
        // created_at instead of createdAt for frontend parity
        doc.created_at = doc.createdAt;
        delete doc._id;
        delete doc.__v;
        return doc;
    });

    return NextResponse.json(formattedExpenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    
    const newExpense = await Expense.create({
      ...data,
      userId: session.user.id,
    });
    
    const doc = newExpense.toObject();
    doc.id = doc._id.toString();
    doc.created_at = doc.createdAt;
    
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
        const deleted = await Expense.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!deleted) {
            return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
