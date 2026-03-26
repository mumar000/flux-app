import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { expenseService } from "@/services/expense.service";

export function useExpensesQuery() {
  return useQuery({
    queryKey: queryKeys.expenses.list(),
    queryFn: () => expenseService.getAll(),
    staleTime: 1000 * 60 * 2,
  });
}
