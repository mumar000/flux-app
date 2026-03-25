import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Expense } from "@/lib/mongodb/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Test Mongoose connection
    await dbConnect();

    // Check if expenses exist
    const count = await Expense.countDocuments();

    return NextResponse.json({
        success: true,
        message: "Successfully connected to MongoDB",
        user: session?.user || null,
        expenseCount: count
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
