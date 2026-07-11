import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        cedula: { label: "Cédula", type: "text" },
        pin: { label: "PIN", type: "password" },
        deviceId: { label: "Device", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.cedula || !credentials?.pin) return null;

        const user = await prisma.user.findUnique({
          where: { cedula: credentials.cedula },
        });

        if (!user) return null;

        const pinMatch = await bcrypt.compare(credentials.pin, user.password);
        if (!pinMatch) return null;

        const deviceIdRecibido = credentials.deviceId as string | undefined;

        // Sin fingerprint de dispositivo no dejamos pasar: no podríamos
        // verificar ni amarrar el dispositivo autorizado.
        if (!deviceIdRecibido) {
          throw new Error("dispositivo_no_detectado");
        }

        // Si la cuenta YA tiene un dispositivo autorizado y no coincide, se rechaza.
        if (user.deviceId && user.deviceId !== deviceIdRecibido) {
          throw new Error("dispositivo_no_autorizado");
        }

        // Generamos un código único para ESTE inicio de sesión (anti-fraude de sesión)
        const newSessionId = crypto.randomUUID();

        await prisma.user.update({
          where: { id: user.id },
          data: {
            activeSessionId: newSessionId,
            // Si es la primera vez, amarramos este dispositivo como el autorizado.
            deviceId: user.deviceId ?? deviceIdRecibido,
          },
        });

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          activeSessionId: newSessionId,
        };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        // Esto solo pasa en el momento exacto del login
        token.id = user.id;
        token.role = user.role;
        token.activeSessionId = user.activeSessionId;
        return token;
      }

      // En cualquier otro request, verificamos si esta sesión sigue siendo la activa
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { activeSessionId: true },
      });

      if (!dbUser || dbUser.activeSessionId !== token.activeSessionId) {
        return { ...token, invalid: true };
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token.invalid) {
        return { ...session, error: "cuenta_compartida" };
      }
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.activeSessionId = token.activeSessionId;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };