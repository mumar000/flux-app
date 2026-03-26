import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { categoryService, type Category, type CreateCategoryInput } from "@/services/category.service";

export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryService.create(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });

      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories.list());

      const optimistic: Category = {
        id: `temp-${Date.now()}`,
        name: input.name,
        emoji: input.emoji,
        color: input.color ?? null,
        is_default: false,
      };

      queryClient.setQueryData<Category[]>(
        queryKeys.categories.list(),
        (old = []) => [...old, optimistic]
      );

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.categories.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
