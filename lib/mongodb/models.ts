import mongoose, { Schema, Document } from "mongoose";

// --- Profile ---
export interface IProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string; // from NextAuth session
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, default: null },
    full_name: { type: String, default: null },
    avatar_url: { type: String, default: null },
    onboarding_completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Profile = mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);

// --- Category ---
export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string | null; // null for default categories
  name: string;
  emoji: string;
  color: string | null;
  is_default: boolean;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: String, default: null },
    name: { type: String, required: true },
    emoji: { type: String, required: true },
    color: { type: String, default: null },
    is_default: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CategorySchema.index({ userId: 1, is_default: 1 });

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

// --- Bank ---
export interface IBank extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  createdAt: Date;
}

const BankSchema = new Schema<IBank>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BankSchema.index({ userId: 1 });

export const Bank = mongoose.models.Bank || mongoose.model<IBank>("Bank", BankSchema);

// --- Expense ---
export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  amount: number;
  description: string;
  bank_account: string;
  category: string;
  date: string; // YYYY-MM-DD
  raw_input: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    bank_account: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    raw_input: { type: String, default: "" },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: -1 });

export const Expense = mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

// --- Goal ---
export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  target_amount: number;
  current_amount: number;
  emoji: string | null;
  deadline: string | null; // YYYY-MM-DD
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    target_amount: { type: Number, required: true },
    current_amount: { type: Number, default: 0 },
    emoji: { type: String, default: null },
    deadline: { type: String, default: null },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Goal = mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);

// --- Budget ---
export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  categoryId: string; // references Category
  monthly_limit: number;
  month: string; // YYYY-MM
  createdAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: String, required: true },
    categoryId: { type: String, required: true },
    monthly_limit: { type: Number, required: true },
    month: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Budget = mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);

// --- DailyRizq ---
export interface IDailyRizq extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  type: "insight" | "challenge" | "question" | "comparison";
  emoji: string;
  title: string;
  body: string;
  tone: string; // e.g. "playful", "curious", "motivating"
  date: string; // YYYY-MM-DD — one card per day
  saved: boolean; // saved to reflections
  dismissed: boolean;
  interactedAt: Date | null;
  createdAt: Date;
}

const DailyRizqSchema = new Schema<IDailyRizq>(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true, enum: ["insight", "challenge", "question", "comparison"] },
    emoji: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    tone: { type: String, default: "playful" },
    date: { type: String, required: true },
    saved: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
    interactedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One card per user per day
DailyRizqSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyRizq = mongoose.models.DailyRizq || mongoose.model<IDailyRizq>("DailyRizq", DailyRizqSchema);

// --- SpendStreak ---
export interface ISpendStreak extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  dailyBudget: number | null; // null = auto-calculated (30-day avg / 30)
  noImpulse: {
    currentCount: number;
    startDate: string | null;       // YYYY-MM-DD when current streak started
    lastBrokenDate: string | null;  // YYYY-MM-DD of last break
    lastBrokenAmount: number | null;
    lastBrokenDescription: string | null;
  };
  underBudget: {
    currentCount: number;
    startDate: string | null;
    lastBrokenDate: string | null;
    lastBrokenAmount: number | null; // total spend on the day it broke
  };
  computedAt: Date; // when streaks were last computed
  createdAt: Date;
  updatedAt: Date;
}

const SpendStreakSchema = new Schema<ISpendStreak>(
  {
    userId: { type: String, required: true, unique: true },
    dailyBudget: { type: Number, default: null },
    noImpulse: {
      currentCount: { type: Number, default: 0 },
      startDate: { type: String, default: null },
      lastBrokenDate: { type: String, default: null },
      lastBrokenAmount: { type: Number, default: null },
      lastBrokenDescription: { type: String, default: null },
    },
    underBudget: {
      currentCount: { type: Number, default: 0 },
      startDate: { type: String, default: null },
      lastBrokenDate: { type: String, default: null },
      lastBrokenAmount: { type: Number, default: null },
    },
    computedAt: { type: Date, default: () => new Date(0) },
  },
  { timestamps: true }
);

export const SpendStreak =
  mongoose.models.SpendStreak ||
  mongoose.model<ISpendStreak>("SpendStreak", SpendStreakSchema);

// --- Transaction ---
export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  direction: "income" | "expense";
  amount: number;
  description: string;
  bank_account: string;
  category: string;
  date: string; // YYYY-MM-DD
  sourceType: "manual" | "natural_language" | "receipt_scan" | "system";
  receiptId: string | null;
  rawInput: string;
  scanConfidence: number | null;
  scanStatus: "none" | "detected" | "confirmed" | "needs_review";
  relatedGoalId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true },
    direction: { type: String, required: true, enum: ["income", "expense"] },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    bank_account: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    sourceType: {
      type: String,
      required: true,
      enum: ["manual", "natural_language", "receipt_scan", "system"],
      default: "manual",
    },
    receiptId: { type: String, default: null },
    rawInput: { type: String, default: "" },
    scanConfidence: { type: Number, default: null },
    scanStatus: {
      type: String,
      enum: ["none", "detected", "confirmed", "needs_review"],
      default: "none",
    },
    relatedGoalId: { type: String, default: null },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, direction: 1, date: -1 });

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

// --- ComparisonItem ---
export interface IComparisonItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  label: string;       // "Concert Ticket", "Monthly Internet Bill"
  amount: number;      // PKR value of this reference item
  emoji: string;
  enabled: boolean;    // user can toggle individual items on/off
  is_default: boolean; // seeded defaults vs user-created
  createdAt: Date;
  updatedAt: Date;
}

const ComparisonItemSchema = new Schema<IComparisonItem>(
  {
    userId: { type: String, required: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    emoji: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    is_default: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One label per user (case-insensitive enforced at app level)
ComparisonItemSchema.index({ userId: 1, label: 1 });

export const ComparisonItem =
  mongoose.models.ComparisonItem ||
  mongoose.model<IComparisonItem>("ComparisonItem", ComparisonItemSchema);
