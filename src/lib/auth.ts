import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter"; 
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days Session
  },
  
  pages: { 
    signIn: "/auth/signin", 
    error: "/auth/error",   
  },

  providers: [
    CredentialsProvider({
      name: "Nexus Access",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "operative@nexus.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { 
            shop: { select: { id: true, name: true } } 
          } 
        });

        if (!user) throw new Error("Identity not found in registry.");

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) throw new Error("Invalid security key.");

        // Return the full "Passport"
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          shopId: user.shopId,
        };
      }
    })
  ],

  callbacks: {
    // Inject custom fields into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.shopId = (user as any).shopId; 
      }
      return token;
    },

    // Expose those fields to the useSession() hook on the frontend
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).shopId = token.shopId;
      }
      return session;
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};