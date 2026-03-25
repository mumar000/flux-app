import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Bank } from "@/lib/mongodb/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const banks = await Bank.find({ userId: session.user.id });
    
    const formattedBanks = banks.map(b => {
        const doc = b.toObject();
        doc.id = doc._id.toString();
        // user_id for frontend parity
        doc.user_id = doc.userId;
        delete doc._id;
        delete doc.__v;
        return doc;
    });

    return NextResponse.json(formattedBanks);
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
    
    const newBank = await Bank.create({
      ...data,
      userId: session.user.id,
    });
    
    const doc = newBank.toObject();
    doc.id = doc._id.toString();
    doc.user_id = doc.userId;
    
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
        
        const deleted = await Bank.findOneAndDelete({ 
            _id: id, 
            userId: session.user.id
        });

        if (!deleted) {
            return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
