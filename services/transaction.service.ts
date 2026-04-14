import type { TransactionFilters } from "@/types/period";

export interface Transaction {
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
  created_at: string;
  user_id?: string;
}

export interface CreateTransactionInput {
  direction: "income" | "expense";
  amount: number;
  description: string;
  bankAccount: string;
  category: string;
  date?: string;
  sourceType?: "manual" | "natural_language" | "receipt_scan" | "system";
  rawInput?: string;
  relatedGoalId?: string | null;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  byCategory: Record<string, number>;
  byBank: Record<string, number>;
  transactions: Transaction[];
}

const BASE_URL = "/api/transactions";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const transactionService = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters?.month) params.set("month", filters.month);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.direction) params.set("direction", filters.direction);

    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    return handleResponse<Transaction[]>(await fetch(url));
  },

  async create(input: CreateTransactionInput): Promise<Transaction> {
    return handleResponse<Transaction>(
      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: input.direction,
          amount: input.amount,
          description: input.description,
          bank_account: input.bankAccount,
          category: input.category,
          date: input.date ?? new Date().toISOString().split("T")[0],
          sourceType: input.sourceType ?? "manual",
          rawInput: input.rawInput ?? "",
          relatedGoalId: input.relatedGoalId ?? null,
        }),
      })
    );
  },

  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: "DELETE" })
    );
  },

  getStats(transactions: Transaction[]): TransactionStats {
    const incomeItems = transactions.filter((t) => t.direction === "income");
    const expenseItems = transactions.filter((t) => t.direction === "expense");

    const totalIncome = incomeItems.reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = expenseItems.reduce((s, t) => s + Number(t.amount), 0);

    const byCategory: Record<string, number> = {};
    const byBank: Record<string, number> = {};

    transactions.forEach((t) => {
      const signedAmount =
        t.direction === "income" ? Number(t.amount) : -Number(t.amount);
      byCategory[t.category] = (byCategory[t.category] ?? 0) + signedAmount;
      byBank[t.bank_account] = (byBank[t.bank_account] ?? 0) + signedAmount;
    });

    return {
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
      byCategory,
      byBank,
      transactions,
    };
  },

  getMonthlyStats(transactions: Transaction[], month?: Date): TransactionStats {
    const target = month ?? new Date();
    const start = new Date(target.getFullYear(), target.getMonth(), 1);
    const end = new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    return this.getStats(
      transactions.filter((t) => {
        const d = new Date(t.date ?? t.created_at ?? "");
        return d >= start && d <= end;
      })
    );
  },
};
