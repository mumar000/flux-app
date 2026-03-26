import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { bankService, type Bank } from "@/services/bank.service";

export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bankService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.banks.all });

      const previous = queryClient.getQueryData<Bank[]>(queryKeys.banks.list());

      queryClient.setQueryData<Bank[]>(
        queryKeys.banks.list(),
        (old = []) => old.filter((b) => b.id !== id)
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.banks.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banks.all });
    },
  });
}
