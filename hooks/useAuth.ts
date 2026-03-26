"use client";

import React from "react";
import { useSession, signIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const loading = status === "loading";

  const user = React.useMemo(
    () =>
      session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.user?.id, session?.user?.email, session?.user?.name, session?.user?.image]
  );

  const signInWithGoogle = async () => {
    await signIn("google", { callbackUrl: "/budget" });
  };

  const signOut = async () => {
    // Clear all cached server data before signing out so the next
    // user session starts with a clean slate
    queryClient.clear();
    await nextAuthSignOut({ callbackUrl: "/auth" });
  };

  return { user, session, loading, status, signInWithGoogle, signOut };
}
