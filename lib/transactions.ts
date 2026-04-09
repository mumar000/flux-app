import { Expense, Transaction, type IExpense, type ITransaction } from "@/lib/mongodb/models";

export interface ExpenseLike {
  id: string;
  amount: number;
  description: string;
  bank_account: string;
  category: string;
  date: string;
  raw_input: string;
  created_at: Date | string;
  updated_at?: Date | string;
  user_id: string;
  source: "transaction" | "legacy_expense";
}

export interface TransactionLike {
  id: string;
  direction: "income" | "expense";
  amount: number;
  description: string;
  bank_account: string;
  category: string;
  date: string;
  sourceType: "manual" | "natural_language" | "receipt_scan" | "system";
  receiptId: string | null;
  rawInput: string;
  scanConfidence: number | null;
  scanStatus: "none" | "detected" | "confirmed" | "needs_review";
  relatedGoalId: string | null;
  created_at: Date | string;
  updated_at?: Date | string;
  user_id: string;
  source: "transaction" | "legacy_expense";
}

type ExpenseDoc = IExpense & { _id: { toString(): string } };
type TransactionDoc = ITransaction & { _id: { toString(): string } };

function compareNewestFirst<T extends { created_at?: Date | string; date?: string }>(
  a: T,
  b: T
) {
  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

  if (aTime !== bTime) return bTime - aTime;

  const aDate = a.date ? new Date(a.date).getTime() : 0;
  const bDate = b.date ? new Date(b.date).getTime() : 0;
  return bDate - aDate;
}

export function formatExpenseDoc(expense: ExpenseDoc): ExpenseLike {
  return {
    id: expense._id.toString(),
    amount: expense.amount,
    description: expense.description,
    bank_account: expense.bank_account,
    category: expense.category,
    date: expense.date,
    raw_input: expense.raw_input ?? "",
    created_at: expense.createdAt,
    updated_at: expense.updatedAt,
    user_id: expense.userId,
    source: "legacy_expense",
  };
}

export function formatTransactionDoc(transaction: TransactionDoc): TransactionLike {
  return {
    id: transaction._id.toString(),
    direction: transaction.direction,
    amount: transaction.amount,
    description: transaction.description,
    bank_account: transaction.bank_account,
    category: transaction.category,
    date: transaction.date,
    sourceType: transaction.sourceType,
    receiptId: transaction.receiptId ?? null,
    rawInput: transaction.rawInput ?? "",
    scanConfidence: transaction.scanConfidence ?? null,
    scanStatus: transaction.scanStatus ?? "none",
    relatedGoalId: transaction.relatedGoalId ?? null,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
    user_id: transaction.userId,
    source: "transaction",
  };
}

export function transactionToExpenseLike(
  transaction: TransactionLike
): ExpenseLike {
  return {
    id: transaction.id,
    amount: transaction.amount,
    description: transaction.description,
    bank_account: transaction.bank_account,
    category: transaction.category,
    date: transaction.date,
    raw_input: transaction.rawInput ?? "",
    created_at: transaction.created_at,
    updated_at: transaction.updated_at,
    user_id: transaction.user_id,
    source: transaction.source,
  };
}

export async function getUnifiedTransactions(
  userId: string,
  filters?: { month?: string; direction?: "income" | "expense" }
): Promise<TransactionLike[]> {
  const transactionQuery: Record<string, unknown> = { userId };
  const expenseQuery: Record<string, unknown> = { userId };

  if (filters?.direction) {
    transactionQuery.direction = filters.direction;
    if (filters.direction !== "expense") {
      const transactions = await Transaction.find(transactionQuery)
        .sort({ createdAt: -1 })
        .lean<TransactionDoc[]>();
      return transactions.map(formatTransactionDoc).sort(compareNewestFirst);
    }
  }

  if (filters?.month) {
    const monthRegex = { $regex: `^${filters.month}` };
    transactionQuery.date = monthRegex;
    expenseQuery.date = monthRegex;
  }

  const [transactions, legacyExpenses] = await Promise.all([
    Transaction.find(transactionQuery).sort({ createdAt: -1 }).lean<TransactionDoc[]>(),
    Expense.find(expenseQuery).sort({ createdAt: -1 }).lean<ExpenseDoc[]>(),
  ]);

  const combined = [
    ...transactions.map(formatTransactionDoc),
    ...legacyExpenses.map((expense) => ({
      id: expense._id.toString(),
      direction: "expense" as const,
      amount: expense.amount,
      description: expense.description,
      bank_account: expense.bank_account,
      category: expense.category,
      date: expense.date,
      sourceType: "manual" as const,
      receiptId: null,
      rawInput: expense.raw_input ?? "",
      scanConfidence: null,
      scanStatus: "none" as const,
      relatedGoalId: null,
      created_at: expense.createdAt,
      updated_at: expense.updatedAt,
      user_id: expense.userId,
      source: "legacy_expense" as const,
    })),
  ];

  return combined.sort(compareNewestFirst);
}

export async function getUnifiedExpenses(
  userId: string,
  filters?: { month?: string }
): Promise<ExpenseLike[]> {
  const transactions = await getUnifiedTransactions(userId, {
    month: filters?.month,
    direction: "expense",
  });

  return transactions.map(transactionToExpenseLike);
}
