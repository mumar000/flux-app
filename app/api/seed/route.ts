import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb/mongoose";
import { Category, Bank } from "@/lib/mongodb/models";

const DEFAULT_CATEGORIES = [
  { name: "Food", emoji: "🍔", color: "#FF6B6B" },
  { name: "Transport", emoji: "🚕", color: "#4ECDC4" },
  { name: "Shopping", emoji: "🛍️", color: "#FFE66D" },
  { name: "Bills", emoji: "📄", color: "#95A5A6" },
  { name: "Entertainment", emoji: "🎬", color: "#9B59B6" },
  { name: "Health", emoji: "💊", color: "#2ECC71" },
  { name: "Education", emoji: "📚", color: "#3498DB" },
  { name: "Groceries", emoji: "🛒", color: "#E67E22" },
  { name: "Other", emoji: "📦", color: "#BDC3C7" },
];

const DEFAULT_BANKS = [
  { name: "Meezan Bank", icon_url: "🏦", color: "#00A651" },
  { name: "HBL", icon_url: "💚", color: "#006341" },
  { name: "JazzCash", icon_url: "📱", color: "#ED1C24" },
  { name: "Easypaisa", icon_url: "💛", color: "#00A54F" },
  { name: "SadaPay", icon_url: "💜", color: "#6B21A8" },
  { name: "NayaPay", icon_url: "🔵", color: "#3B82F6" },
  { name: "Cash", icon_url: "💵", color: "#22C55E" },
];

export async function GET() {
  try {
    await dbConnect();

    let catCount = 0;
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await Category.findOne({ name: cat.name, is_default: true });
      if (!existing) {
        await Category.create({ ...cat, is_default: true });
        catCount++;
      }
    }

    let bankCount = 0;
    for (const bank of DEFAULT_BANKS) {
      const existing = await Bank.findOne({ name: bank.name, is_default: true });
      if (!existing) {
        await Bank.create({ ...bank, is_default: true });
        bankCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${catCount} categories and ${bankCount} banks.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
