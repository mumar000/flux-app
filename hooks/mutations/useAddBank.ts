import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { bankService, type Bank } from "@/services/bank.service";

export function useAddBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => bankService.create(name),

    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.banks.all });

      const previous = queryClient.getQueryData<Bank[]>(queryKeys.banks.list());

      queryClient.setQueryData<Bank[]>(
        queryKeys.banks.list(),
        (old = []) => [...old, { id: `temp-${Date.now()}`, name }]
      );

      return { previous };
    },

    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.banks.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banks.all });
    },
  });
}
