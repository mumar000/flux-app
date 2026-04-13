import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INIT_QUERY_KEY } from "@/hooks/queries/useInitData";
import { bankService } from "@/services/bank.service";
import type { InitData } from "@/services/init.service";

export function useAddBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => bankService.create(name),

    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: INIT_QUERY_KEY });

      const previous = queryClient.getQueryData<InitData>(INIT_QUERY_KEY);

      queryClient.setQueryData<InitData>(INIT_QUERY_KEY, (old) =>
        old ? { ...old, banks: [...old.banks, { id: `temp-${Date.now()}`, name }] } : old
      );

      return { previous };
    },

    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(INIT_QUERY_KEY, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INIT_QUERY_KEY });
    },
  });
}
