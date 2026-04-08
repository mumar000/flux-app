"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,  // 5 min — avoid background refetches on every navigation
            gcTime: 1000 * 60 * 30,
            retry: 1,                   // 1 retry instead of 2 — faster failure, less loading time
            refetchOnWindowFocus: false,
            refetchOnMount: false,      // don't refetch when navigating back if data is fresh
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
