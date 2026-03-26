import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { categoryService } from "@/services/category.service";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoryService.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}
