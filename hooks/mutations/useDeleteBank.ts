import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INIT_QUERY_KEY } from "@/hooks/queries/useInitData";
import { bankService } from "@/services/bank.service";
import type { InitData } from "@/services/init.service";

export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bankService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: INIT_QUERY_KEY });

      const previous = queryClient.getQueryData<InitData>(INIT_QUERY_KEY);

      queryClient.setQueryData<InitData>(INIT_QUERY_KEY, (old) =>
        old ? { ...old, banks: old.banks.filter((b) => b.id !== id) } : old
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(INIT_QUERY_KEY, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INIT_QUERY_KEY });
    },
  });
}
