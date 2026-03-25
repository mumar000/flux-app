import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Profile } from "@/lib/mongodb/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const profile = await Profile.findOne({ userId: session.user.id });
    
    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const doc = profile.toObject();
    doc.id = doc._id.toString();
    doc.user_id = doc.userId;
    delete doc._id;
    delete doc.__v;

    return NextResponse.json(doc);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await dbConnect();
    
    const profile = await Profile.findOneAndUpdate(
        { userId: session.user.id },
        { $set: data },
        { new: true }
    );
    
    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const doc = profile.toObject();
    doc.id = doc._id.toString();
    doc.user_id = doc.userId;
    
    return NextResponse.json(doc);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
