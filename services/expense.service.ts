export interface Expense {
  id: string;
  amount: number;
  description: string;
  bank_account: string;
  category: string;
  created_at: string;
  raw_input: string;
  user_id?: string;
  date?: string;
}

export interface CreateExpenseInput {
  amount: number;
  description: string;
  bankAccount: string;
  category: string;
  rawInput: string;
}

export interface MonthlyStats {
  totalSpent: number;
  byCategory: Record<string, number>;
  byBank: Record<string, number>;
  expenses: Expense[];
}

const BASE_URL = "/api/expenses";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    return handleResponse<Expense[]>(await fetch(BASE_URL));
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    return handleResponse<Expense>(
      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: input.amount,
          description: input.description,
          category: input.category,
          bank_account: input.bankAccount,
          raw_input: input.rawInput,
          date: new Date().toISOString().split("T")[0],
        }),
      })
    );
  },

  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: "DELETE" })
    );
  },

  getMonthlyStats(expenses: Expense[], month?: Date): MonthlyStats {
    const target = month ?? new Date();
    const start = new Date(target.getFullYear(), target.getMonth(), 1);
    const end = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthly = expenses.filter((e) => {
      const d = new Date(e.created_at ?? e.date ?? "");
      return d >= start && d <= end;
    });

    const totalSpent = monthly.reduce((s, e) => s + Number(e.amount), 0);
    const byCategory: Record<string, number> = {};
    const byBank: Record<string, number> = {};

    monthly.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
      byBank[e.bank_account] = (byBank[e.bank_account] ?? 0) + Number(e.amount);
    });

    return { totalSpent, byCategory, byBank, expenses: monthly };
  },
};
