import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { INIT_QUERY_KEY } from "@/hooks/queries/useInitData";
import { expenseService, type Expense, type CreateExpenseInput } from "@/services/expense.service";

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expenseService.create(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all });

      const previous = queryClient.getQueryData<Expense[]>(queryKeys.expenses.list());

      const optimistic: Expense = {
        id: `temp-${Date.now()}`,
        amount: input.amount,
        description: input.description,
        bank_account: input.bankAccount,
        category: input.category,
        raw_input: input.rawInput,
        created_at: new Date().toISOString(),
        date: new Date().toISOString().split("T")[0],
      };

      queryClient.setQueryData<Expense[]>(
        queryKeys.expenses.list(),
        (old = []) => [optimistic, ...old]
      );

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.expenses.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: INIT_QUERY_KEY });
    },
  });
}
