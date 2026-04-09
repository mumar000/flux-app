import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  transactionService,
  type Transaction,
  type CreateTransactionInput,
} from "@/services/transaction.service";

export function useAddIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateTransactionInput, "direction">) =>
      transactionService.create({ ...input, direction: "income" }),

    onMutate: async (newIncome) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previous = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactions.list()
      );

      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactions.list(),
        (old = []) => [
          {
            id: `temp-${Date.now()}`,
            direction: "income" as const,
            amount: newIncome.amount,
            description: newIncome.description,
            bank_account: newIncome.bankAccount,
            category: newIncome.category,
            date: newIncome.date ?? new Date().toISOString().split("T")[0],
            sourceType: newIncome.sourceType ?? "manual",
            rawInput: newIncome.rawInput ?? "",
            scanConfidence: null,
            scanStatus: "none" as const,
            relatedGoalId: newIncome.relatedGoalId ?? null,
            receiptId: null,
            created_at: new Date().toISOString(),
          },
          ...old,
        ]
      );

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.transactions.list(),
          context.previous
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
