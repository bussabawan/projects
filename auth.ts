import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/lib/db"
import { RowDataPacket } from "mysql2"

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
          
          const [rows] = await db.execute<RowDataPacket[]>(
            'SELECT role FROM users_data WHERE user_name = ? AND remove = 0',
            [user.email]
          );
          
          if (rows.length > 0 && rows[0].role === 2) {
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
          const [rows] = await db.execute<RowDataPacket[]>(
            'SELECT user_id, full_name, role FROM users_data WHERE user_name = ? AND remove = 0',
            [session.user.email]
          );
          if (rows.length > 0) {
            const extendedUser = session.user as unknown as Record<string, string | number | undefined | null>;
            extendedUser.id = rows[0].user_id;
            extendedUser.fullName = rows[0].full_name;
            extendedUser.role = rows[0].role;
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
