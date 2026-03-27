import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Authenticated user hitting root → skip spinner, go straight to app
    if (req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/budget", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth",
    },
  }
);

// Protect app routes + handle root redirect
export const config = {
  matcher: ["/", "/budget/:path*", "/settings/:path*", "/goals/:path*"],
};
