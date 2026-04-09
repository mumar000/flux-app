import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  transactionService,
  type Transaction,
} from "@/services/transaction.service";

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previous = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactions.list()
      );

      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactions.list(),
        (old = []) => old.filter((t) => t.id !== deletedId)
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
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
