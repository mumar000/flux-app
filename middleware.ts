import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The app uses MongoDB database sessions (not JWT), so withAuth won't work.
// Instead, check for the session cookie that NextAuth sets on sign-in.
function hasSession(req: NextRequest) {
  return (
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token")
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = hasSession(req);

  // Root: send authenticated users straight to /budget, others to /auth
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(authed ? "/budget" : "/auth", req.url)
    );
  }

  // Protected routes: redirect unauthenticated users to /auth
  if (!authed) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }
}

export const config = {
  matcher: ["/", "/budget/:path*", "/settings/:path*", "/goals/:path*"],
};
