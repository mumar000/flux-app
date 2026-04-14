import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { transactionService } from "@/services/transaction.service";
import type { TransactionFilters } from "@/types/period";

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionService.getAll(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTransactionStats(filters?: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions.stats(filters),
    queryFn: () => transactionService.getAll(filters),
    select: (transactions) =>
      transactionService.getStats(transactions),
    staleTime: 1000 * 60 * 2,
  });
}
