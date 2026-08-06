import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;

      const isApiAdminRoute = nextUrl.pathname.startsWith('/api/admin');
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isUserRoute = nextUrl.pathname.startsWith('/user');
      const isUploadsRoute = nextUrl.pathname.startsWith('/uploads');

      // Allow public access to the hospital logo
      if (isUploadsRoute && nextUrl.pathname === '/uploads/vejjarak_logo.png') {
        return true;
      }

      // Protect secured routes
      if (isApiAdminRoute || isAdminRoute || isUserRoute || isUploadsRoute) {
        if (!isAuthenticated) {
          // Return false to redirect to sign-in page for pages
          if (isApiAdminRoute || isUploadsRoute) {
            return Response.json({ message: "Unauthorized" }, { status: 401 });
          }
          return false;
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
