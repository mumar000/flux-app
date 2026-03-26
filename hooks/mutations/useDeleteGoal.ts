import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { goalService, type Goal } from "@/services/goal.service";

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.all });

      const previous = queryClient.getQueryData<Goal[]>(queryKeys.goals.list());

      queryClient.setQueryData<Goal[]>(queryKeys.goals.list(), (old = []) =>
        old.filter((g) => g.id !== id)
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.goals.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}
