import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  comparisonService,
  type ComparisonItem,
  type UpdateComparisonItemInput,
} from "@/services/comparison.service";

export function useUpdateComparisonItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateComparisonItemInput) =>
      comparisonService.update(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comparisons.all });

      const previous = queryClient.getQueryData<ComparisonItem[]>(
        queryKeys.comparisons.list()
      );

      queryClient.setQueryData<ComparisonItem[]>(
        queryKeys.comparisons.list(),
        (old = []) =>
          old.map((item) =>
            item.id === input.id ? { ...item, ...input } : item
          )
      );

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.comparisons.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comparisons.all });
    },
  });
}
