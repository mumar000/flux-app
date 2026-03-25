'use client';

import React from 'react';
import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();

  // Map NextAuth session to match expected 'user' interface
  const user = React.useMemo(() => session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  } : null, [session?.user?.id, session?.user?.email, session?.user?.name, session?.user?.image]);

  const signInWithGoogle = async () => {
    // NextAuth handles the redirect flow
    await signIn('google', { callbackUrl: '/budget' });
  };

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/auth' });
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  };
}
