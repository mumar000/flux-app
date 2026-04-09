import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { transactionService } from "@/services/transaction.service";

export function useTransactions(filters?: {
  month?: string;
  direction?: "income" | "expense";
}) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionService.getAll(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTransactionStats(month?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.list(month ? { month } : undefined),
    queryFn: () => transactionService.getAll(month ? { month } : undefined),
    select: (transactions) =>
      transactionService.getMonthlyStats(
        transactions,
        month ? new Date(`${month}-01`) : undefined
      ),
    staleTime: 1000 * 60 * 2,
  });
}
