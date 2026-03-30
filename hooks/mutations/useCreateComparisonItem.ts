import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  comparisonService,
  type ComparisonItem,
  type CreateComparisonItemInput,
} from "@/services/comparison.service";

export function useCreateComparisonItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateComparisonItemInput) =>
      comparisonService.create(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comparisons.all });

      const previous = queryClient.getQueryData<ComparisonItem[]>(
        queryKeys.comparisons.list()
      );

      const optimistic: ComparisonItem = {
        id: `temp-${Date.now()}`,
        label: input.label,
        amount: input.amount,
        emoji: input.emoji ?? "💰",
        enabled: true,
        is_default: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ComparisonItem[]>(
        queryKeys.comparisons.list(),
        (old = []) => [...old, optimistic]
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
