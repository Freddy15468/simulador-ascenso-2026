"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function guardarIntento(score: number, timeSpent: number) {
  // 1. Obtenemos la sesión cifrada que viene desde el navegador del usuario
  const session = await getServerSession();
  
  if (!session || !session.user?.email) {
    throw new Error("No autorizado: Debes iniciar sesión.");
  }

  // 2. Consultamos el estado en tiempo real del usuario en Supabase
  const usuario = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!usuario) {
    throw new Error("Usuario no encontrado.");
  }

  // 3. LA VALIDACIÓN CRÍTICA (El escudo anti-fraude):
  // Comparamos el activeSessionId de la base de datos contra el que viene en la sesión actual
  if (usuario.activeSessionId !== (session.user as any).activeSessionId) {
    throw new Error("Sesión inválida: Se ha detectado un inicio de sesión más reciente en otro dispositivo.");
  }

  // 4. Si la validación pasa, guardamos la nota
  await prisma.attempt.create({
    data: {
      userId: usuario.id,
      score: score,
      timeSpent: timeSpent,
    }
  });

  // 5. Refrescamos el dashboard
  revalidatePath("/dashboard");
}