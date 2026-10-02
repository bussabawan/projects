import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
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
      const userRole = (auth?.user as { role?: number })?.role;
      const pathname = nextUrl.pathname;

      // 1. Root (/) and Login (/login) handling
      if (isAuthenticated) {
        if (pathname === '/' || pathname === '/login') {
          if (userRole === 1) {
            return Response.redirect(new URL('/user/games', nextUrl));
          } else if (userRole === 2) {
            return Response.redirect(new URL('/admin', nextUrl));
          }
        }
      } else {
        if (pathname === '/') {
          return Response.redirect(new URL('/login', nextUrl));
        }
      }

      // 2. Identify Route Categories
      const isAdminPageRoute = pathname === '/admin' || pathname.startsWith('/admin/');
      const isAdminApiRoute = 
        pathname.startsWith('/api/admin') || 
        pathname.startsWith('/api/patient-stats') || 
        pathname === '/api/upload' || 
        pathname === '/api/tts';

      const isStaffManualRoute = pathname.startsWith('/api/manuals/staff-manual');
      const isUserPageRoute = pathname === '/user' || pathname.startsWith('/user/');
      const isUserApiRoute = pathname.startsWith('/api/user') || pathname.startsWith('/api/patient-history');
      const isMediaApiRoute = 
        pathname.startsWith('/api/uploads') || 
        pathname.startsWith('/api/files') || 
        pathname.startsWith('/api/manuals');

      // 3. Admin Pages & Admin APIs & Staff Manual: Strictly Role 2 (Staff) only
      if (isAdminPageRoute || isAdminApiRoute || isStaffManualRoute) {
        if (!isAuthenticated) {
          if (isAdminApiRoute || isStaffManualRoute) {
            return Response.json({ message: "Unauthorized" }, { status: 401 });
          }
          return false; // Redirects to /login
        }

        // Strictly block Admin APIs & Staff Manual from non-staff
        if (isAdminApiRoute || isStaffManualRoute) {
          if (userRole !== 2) {
            return Response.json({ message: "Forbidden" }, { status: 403 });
          }
        }
        // Note: For isAdminPageRoute, authenticated users proceed to AdminLayout
        // which displays the full-screen Loader ("กำลังประมวลผล...") before smoothly redirecting patients to /user/games
      }

      // 4. Patient Pages: Strictly Role 1 (Patient) only
      if (isUserPageRoute) {
        if (!isAuthenticated) {
          return false; // Redirects to /login
        }
        // Note: Authenticated users proceed to UserLayout which displays the full-screen Loader before redirecting staff to /admin
      }

      // 5. Patient APIs (Requires authentication + patient ownership)
      if (isUserApiRoute) {
        if (!isAuthenticated) {
          return Response.json({ message: "Unauthorized" }, { status: 401 });
        }
        // If patient (role 1) queries patient-history, allow access only to their own history
        if (pathname.startsWith('/api/patient-history/') && userRole === 1) {
          const requestedUserId = pathname.replace('/api/patient-history/', '').split('/')[0];
          const authUserId = (auth?.user as { id?: string })?.id;
          if (requestedUserId && authUserId && String(requestedUserId) !== String(authUserId)) {
            return Response.json({ message: "Forbidden" }, { status: 403 });
          }
        }
      }

      // 6. Media & Resource APIs (Requires authentication)
      if (isMediaApiRoute) {
        if (!isAuthenticated) {
          return Response.json({ message: "Unauthorized" }, { status: 401 });
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
