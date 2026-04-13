import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { initService, type InitData } from "@/services/init.service";

export const INIT_QUERY_KEY = ["init"] as const;

function useInitQuery() {
  const { status } = useSession();

  return useQuery<InitData>({
    queryKey: INIT_QUERY_KEY,
    queryFn: () => initService.getAll(),
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5,
  });
}

export function useInitCategories() {
  const query = useInitQuery();
  return {
    ...query,
    data: query.data?.categories,
  };
}

export function useInitBanks() {
  const query = useInitQuery();
  return {
    ...query,
    data: query.data?.banks,
  };
}
