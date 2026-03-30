import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { comparisonService, type ComparisonItem } from "@/services/comparison.service";

export function useDeleteComparisonItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => comparisonService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comparisons.all });

      const previous = queryClient.getQueryData<ComparisonItem[]>(
        queryKeys.comparisons.list()
      );

      queryClient.setQueryData<ComparisonItem[]>(
        queryKeys.comparisons.list(),
        (old = []) => old.filter((item) => item.id !== id)
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.comparisons.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comparisons.all });
    },
  });
}
