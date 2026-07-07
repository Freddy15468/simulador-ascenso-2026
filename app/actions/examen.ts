"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function guardarIntento(score: number, timeSpent: number) {
  const session = await getServerSession();
  
  if (!session || !session.user?.email) {
    throw new Error("No autorizado");
  }

  const usuario = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!usuario) throw new Error("Usuario no encontrado");

  // Guardamos el intento en la base de datos
  await prisma.attempt.create({
    data: {
      userId: usuario.id,
      score: score,
      timeSpent: timeSpent, // Guardamos cuántos segundos tardó
    }
  });

  // Refrescamos el dashboard para que aparezca la nueva nota
  revalidatePath("/dashboard");
}