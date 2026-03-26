import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { goalService, type Goal, type CreateGoalInput } from "@/services/goal.service";

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalService.create(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.all });

      const previous = queryClient.getQueryData<Goal[]>(queryKeys.goals.list());

      const optimistic: Goal = {
        id: `temp-${Date.now()}`,
        userId: "",
        title: input.title,
        target_amount: input.target_amount,
        current_amount: 0,
        emoji: input.emoji,
        deadline: input.deadline ?? null,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Goal[]>(queryKeys.goals.list(), (old = []) => [
        optimistic,
        ...old,
      ]);

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.goals.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}
