"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main auth page since we only use Google OAuth now
    router.push("/auth");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C]">
      <div className="w-12 h-12 border-4 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin" />
    </div>
  );
}
