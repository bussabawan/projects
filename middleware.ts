import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  const isApiAdminRoute = nextUrl.pathname.startsWith('/api/admin');
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isUploadsRoute = nextUrl.pathname.startsWith('/uploads');

  // Allow public access to the hospital logo
  if (isUploadsRoute && nextUrl.pathname === '/uploads/vejjarak_logo.png') {
    return NextResponse.next();
  }

  // Protect secured routes
  if (isApiAdminRoute || isAdminRoute || isUploadsRoute) {
    if (!isAuthenticated) {
      // Return 401 for API and files
      if (isApiAdminRoute || isUploadsRoute) {
        return new NextResponse("Unauthorized", { status: 401 });
      } 
      // Redirect to login for pages
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
