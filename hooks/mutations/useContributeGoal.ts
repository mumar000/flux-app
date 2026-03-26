import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { goalService, type Goal } from "@/services/goal.service";

export function useContributeGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      goalService.contribute(id, amount),

    onMutate: async ({ id, amount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.all });

      const previous = queryClient.getQueryData<Goal[]>(queryKeys.goals.list());

      queryClient.setQueryData<Goal[]>(queryKeys.goals.list(), (old = []) =>
        old.map((g) =>
          g.id === id
            ? {
                ...g,
                current_amount: Math.min(g.current_amount + amount, g.target_amount),
                completed: g.current_amount + amount >= g.target_amount,
              }
            : g
        )
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.goals.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}
