import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordsMatch) return null;

        // NUEVO: Generamos un código único para ESTE inicio de sesión y lo guardamos
        const newSessionId = crypto.randomUUID();
        await prisma.user.update({
          where: { id: user.id },
          data: { activeSessionId: newSessionId }
        });

        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          activeSessionId: newSessionId // Lo enviamos a la sesión actual
        };
      }
    })
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.activeSessionId = (user as any).activeSessionId; // Guardamos el ticket en su navegador
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.activeSessionId = token.activeSessionId; 
      }
      return session;
    }
  }
});

export { handler as GET, handler as POST };