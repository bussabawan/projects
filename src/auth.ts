import NextAuth, { CredentialsSignin } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserModel } from "@/lib/models/user"
import { authConfig } from "./auth.config"

class CustomAuthError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new CustomAuthError('Please enter username and password');
        }
        
        try {
          // Use our existing authentication model
          const user = await UserModel.authenticate(credentials.username as string, credentials.password as string);
          
          if (!user) {
            throw new CustomAuthError('Invalid username or password');
          }
          
          // Staff (2) must use Google Login
          if (user.role === 2) {
            throw new CustomAuthError('เจ้าหน้าที่กรุณาเข้าสู่ระบบผ่าน E-mail (Google) เท่านั้น');
          }
          
          // Allow login for patients (1)
          if (user.role === 1) {
            return {
              id: user.user_id.toString(),
              name: user.full_name || user.user_name,
              email: user.user_name, // Map username to email field for NextAuth compatibility
              role: user.role,
              fullName: user.full_name,
            }
          }
          
          throw new CustomAuthError('You do not have permission to access the system');
        } catch (error: unknown) {
          if (error instanceof CustomAuthError) {
            throw error;
          }
          const err = error as Error;
          throw new CustomAuthError(err.message || 'Login failed');
        }
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) return false;
          
          const dbUser = await UserModel.findByUserName(user.email);
          
          if (dbUser && (dbUser.role === 1 || dbUser.role === 2)) {
            await UserModel.logLogin(dbUser.user_id);
            return true;
          }
          
          return false;
        } catch (error) {
          console.error("Error during signIn callback:", error);
          return false;
        }
      }
      
      if (account?.provider === "credentials" && user.id) {
        await UserModel.logLogin(Number(user.id));
      }
      
      return true; // Credentials provider handles its own authorization
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        if (account?.provider === 'credentials') {
          // For credentials, we already attached role and fullName to the user object in authorize()
          const credentialsUser = user as unknown as Record<string, string | number>;
          token.role = credentialsUser.role;
          token.fullName = credentialsUser.fullName;
          token.id = credentialsUser.id;
        } else if (account?.provider === 'google' && user.email) {
          // For google, we need to fetch role from DB
          try {
            const dbUser = await UserModel.findByUserName(user.email);
            if (dbUser) {
              token.role = dbUser.role;
              token.fullName = dbUser.full_name;
              token.id = dbUser.user_id.toString();
            }
          } catch (error) {
            console.error("Error fetching user for JWT:", error);
          }
        }
        
        // Set custom expiration on initial login based on role
        if (token.role === 2) {
          // Staff: 1 hour absolute from login
          token.exp = Math.floor(Date.now() / 1000) + (60 * 60);
        }
      } else {
        // Subsequent requests - Staff rolling session (1 hour)
        if (token.role === 2 && token.exp) {
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = (token.exp as number) - now;
          // Extend if less than 30 minutes left
          if (timeLeft < 30 * 60 && timeLeft > 0) {
            token.exp = now + (60 * 60);
          }
        }
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (Patient rolling session)
    updateAge: 24 * 60 * 60,  // Update session cookie every 24 hours
  },
})
