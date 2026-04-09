"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/mobile/BottomNav";

const EXCLUDED_ROUTES = ["/auth", "/register", "/test-connection", "/api"];

export function GlobalNav() {
  const pathname = usePathname();
  
  if (!pathname) return null;
  
  const shouldHide = EXCLUDED_ROUTES.some(route => pathname.startsWith(route));
  if (shouldHide) return null;

  // Render the bottom navigation globally to persist across route transitions
  return <BottomNav />;
}
