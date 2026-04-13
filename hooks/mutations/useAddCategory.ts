import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INIT_QUERY_KEY } from "@/hooks/queries/useInitData";
import { categoryService, type Category, type CreateCategoryInput } from "@/services/category.service";
import type { InitData } from "@/services/init.service";

export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryService.create(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: INIT_QUERY_KEY });

      const previous = queryClient.getQueryData<InitData>(INIT_QUERY_KEY);

      const optimistic: Category = {
        id: `temp-${Date.now()}`,
        name: input.name,
        emoji: input.emoji,
        color: input.color ?? null,
        is_default: false,
      };

      queryClient.setQueryData<InitData>(INIT_QUERY_KEY, (old) =>
        old ? { ...old, categories: [...old.categories, optimistic] } : old
      );

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(INIT_QUERY_KEY, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INIT_QUERY_KEY });
    },
  });
}
