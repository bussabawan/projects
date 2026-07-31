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
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && session.user.email) {
        try {
          const [rows] = await db.execute<RowDataPacket[]>(
            'SELECT user_id, full_name, role FROM users_data WHERE user_name = ? AND remove = 0',
            [session.user.email]
          );
          if (rows.length > 0) {
            (session.user as any).id = rows[0].user_id;
            (session.user as any).fullName = rows[0].full_name;
            (session.user as any).role = rows[0].role;
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
