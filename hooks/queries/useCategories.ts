import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/queryKeys";
import { categoryService } from "@/services/category.service";

export function useCategories() {
  const { status } = useSession();

  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoryService.getAll(),
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5,
  });
}
