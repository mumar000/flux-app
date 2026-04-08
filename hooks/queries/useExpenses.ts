import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/queryKeys";
import { expenseService } from "@/services/expense.service";

export function useExpensesQuery() {
  const { status } = useSession();

  return useQuery({
    queryKey: queryKeys.expenses.list(),
    queryFn: () => expenseService.getAll(),
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5,
  });
}
