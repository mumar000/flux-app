import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Bank } from "@/lib/mongodb/models";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function formatBankDoc(doc: Record<string, unknown>) {
  const formatted = { ...doc };
  if (formatted._id) {
    formatted.id = (formatted._id as { toString(): string }).toString();
    delete formatted._id;
  }
  if (formatted.userId) {
    formatted.user_id = formatted.userId;
    delete formatted.userId;
  }
  formatted.balance = Number(formatted.balance ?? 0);
  delete formatted.__v;
  return formatted;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const banks = await Bank.find({
      $or: [
        { userId: session.user.id },
        { is_default: true }
      ]
    }).lean();

    const formattedBanks = banks.map((bank) =>
      formatBankDoc(bank as Record<string, unknown>)
    );

    return NextResponse.json(formattedBanks);
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
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const initialBalance = Number(data.initialBalance ?? 0);

    if (!name) {
      return NextResponse.json({ error: "Bank name is required" }, { status: 400 });
    }
    if (!Number.isFinite(initialBalance)) {
      return NextResponse.json({ error: "Initial balance must be a number" }, { status: 400 });
    }

    await dbConnect();
    
    const newBank = await Bank.create({
      name,
      balance: initialBalance,
      userId: session.user.id,
    });
    
    const doc = formatBankDoc(newBank.toObject() as Record<string, unknown>);
    
    return NextResponse.json(doc, { status: 201 });
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
        
        const deleted = await Bank.findOneAndDelete({ 
            _id: id, 
            userId: session.user.id
        });

        if (!deleted) {
            return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
