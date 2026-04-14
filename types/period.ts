export type Period =
  | { type: "this_month" }
  | { type: "last_month" }
  | { type: "ytd" }
  | { type: "custom"; start: string; end: string };

export interface TransactionFilters {
  month?: string;
  startDate?: string;
  endDate?: string;
  direction?: "income" | "expense";
}
