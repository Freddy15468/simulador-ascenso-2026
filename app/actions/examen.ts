"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { calcularAcceso } from "../../lib/acceso";

export async function guardarIntento(score: number, timeSpent: number) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    throw new Error("No autorizado: Debes iniciar sesión.");
  }

  const usuario = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { subscriptions: true },
  });

  if (!usuario) {
    throw new Error("Usuario no encontrado.");
  }

  // Escudo anti-fraude: compara el activeSessionId de la BD contra el de esta sesión
  if (usuario.activeSessionId !== (session.user as any).activeSessionId) {
    throw new Error("Sesión inválida: Se ha detectado un inicio de sesión más reciente en otro dispositivo.");
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.tieneAcceso) {
    throw new Error("Tu período de prueba gratuita terminó. Activa tu cuenta para seguir usando el simulador.");
  }

  await prisma.attempt.create({
    data: {
      userId: usuario.id,
      score,
      timeSpent,
    },
  });

  revalidatePath("/dashboard");
}