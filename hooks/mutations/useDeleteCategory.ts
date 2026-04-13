import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INIT_QUERY_KEY } from "@/hooks/queries/useInitData";
import { categoryService } from "@/services/category.service";
import type { InitData } from "@/services/init.service";

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: INIT_QUERY_KEY });

      const previous = queryClient.getQueryData<InitData>(INIT_QUERY_KEY);

      queryClient.setQueryData<InitData>(INIT_QUERY_KEY, (old) =>
        old ? { ...old, categories: old.categories.filter((c) => c.id !== id) } : old
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
