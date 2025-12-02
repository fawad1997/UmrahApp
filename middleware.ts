import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));

  // Allow public routes and API auth routes
  if (isPublicRoute || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Get token from request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // For API routes, allow them through and let the route handlers check auth
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated (for non-public, non-API routes)
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Get role and currentGroupId from token
  const role = token.role as string | null;
  const currentGroupId = token.currentGroupId as string | null;

  // If user doesn't have a role set, redirect to role selection
  if (!role && path !== "/umrah/role") {
    return NextResponse.redirect(new URL("/umrah/role", request.url));
  }

  // If user has a role but is on role selection page, redirect appropriately
  if (role && path === "/umrah/role") {
    if (role === "GUIDE") {
      return NextResponse.redirect(new URL("/umrah/guide", request.url));
    } else {
      if (currentGroupId) {
        return NextResponse.redirect(new URL("/umrah/chat", request.url));
      } else {
        return NextResponse.redirect(new URL("/umrah/join", request.url));
      }
    }
  }

  // Allow access to other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     * - api/auth (auth routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads|api/auth).*)",
  ],
};
