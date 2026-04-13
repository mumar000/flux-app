import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Category, Bank } from "@/lib/mongodb/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const [categories, banks] = await Promise.all([
      Category.find({
        $or: [{ userId: session.user.id }, { is_default: true }],
      }).lean(),
      Bank.find({
        $or: [{ userId: session.user.id }, { is_default: true }],
      }).lean(),
    ]);

    return NextResponse.json({
      categories: categories.map(({ _id, __v, ...rest }) => ({
        id: _id.toString(),
        user_id: rest.userId,
        ...rest,
      })),
      banks: banks.map(({ _id, __v, ...rest }) => ({
        id: _id.toString(),
        user_id: rest.userId,
        ...rest,
      })),
    });
  } catch (error) {
    console.error("[GET /api/init]", error);
    return NextResponse.json(
      { error: "Could not load initial data" },
      { status: 500 }
    );
  }
}
