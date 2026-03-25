import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb/mongoose";
import { Category } from "@/lib/mongodb/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch user's categories OR default categories
    const categories = await Category.find({
      $or: [
        { userId: session.user.id },
        { is_default: true }
      ]
    });
    
    const formattedCategories = categories.map(c => {
        const doc = c.toObject();
        doc.id = doc._id.toString();
        // user_id for frontend parity
        doc.user_id = doc.userId;
        delete doc._id;
        delete doc.__v;
        return doc;
    });

    return NextResponse.json(formattedCategories);
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
    
    const newCategory = await Category.create({
      ...data,
      userId: session.user.id,
      is_default: false,
    });
    
    const doc = newCategory.toObject();
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
        
        // Ensure user can only delete their own categories (not defaults)
        const deleted = await Category.findOneAndDelete({ 
            _id: id, 
            userId: session.user.id,
            is_default: false
        });

        if (!deleted) {
            return NextResponse.json({ error: "Not found or cannot delete default category" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
