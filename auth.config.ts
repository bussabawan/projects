import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        const extendedUser = session.user as { id?: string; role?: number; fullName?: string };
        extendedUser.id = token.id as string;
        extendedUser.role = token.role as number;
        extendedUser.fullName = token.fullName as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;

      const isApiAdminRoute = nextUrl.pathname.startsWith('/api/admin');
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isUserRoute = nextUrl.pathname.startsWith('/user');
      const isUploadsRoute = nextUrl.pathname.startsWith('/api/uploads');

      // Allow public access to the hospital logo
      if (isUploadsRoute && nextUrl.pathname === '/api/uploads/vejjarak_logo.png') {
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

        // Add Role Based Access Control
        const userRole = (auth?.user as { role?: number })?.role;
        
        if ((isApiAdminRoute || isAdminRoute) && userRole === 1) {
          // If patient (role 1) tries to access admin routes, redirect to /user
          // For API routes, return 403 Forbidden
          if (isApiAdminRoute) {
            return Response.json({ message: "Forbidden" }, { status: 403 });
          }
          return Response.redirect(new URL('/user/games', nextUrl));
        }

        if (isUserRoute && userRole !== 1) {
          // If staff (role !== 1) tries to access patient routes, redirect to /admin
          return Response.redirect(new URL('/admin', nextUrl));
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
