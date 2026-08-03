import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { UserModel } from "@/lib/models/user"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login', // Use our custom login page
    error: '/login', // Redirect to custom login page on error
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) return false;
          
          const dbUser = await UserModel.findByUserName(user.email);
          
          if (dbUser && dbUser.role === 2) {
            return true; // Allow login for staff
          }
          
          return false; // Deny login for others (patients or non-existent)
        } catch (error) {
          console.error("Error during signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user && session.user.email) {
        try {
          const dbUser = await UserModel.findByUserName(session.user.email);
          if (dbUser) {
            const extendedUser = session.user as unknown as Record<string, string | number | undefined | null>;
            extendedUser.id = dbUser.user_id;
            extendedUser.fullName = dbUser.full_name;
            extendedUser.role = dbUser.role;
          }
        } catch (error) {
          console.error("Error fetching user for session:", error);
        }
      }
      return session;
    },
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise false
      return !!auth
    },
  },
})
