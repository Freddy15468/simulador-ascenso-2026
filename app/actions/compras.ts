"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function registrarPago(data: { reference: string; isImage: boolean }) {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    throw new Error("No autorizado");
  }

  // Buscamos el ID del usuario actual mediante su correo de sesión
  const usuario = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!usuario) throw new Error("Usuario no encontrado");

  // Creamos la suscripción en la base de datos
  await prisma.subscription.create({
    data: {
      userId: usuario.id,
      status: "PENDING",
      // Si es una imagen guardamos el Base64, si es texto guardamos el número
      receiptUrl: data.reference, 
      areaId: null // Null significa que está adquiriendo el paquete completo
    }
  });

  // Redirigimos al dashboard con un estado de éxito
  redirect("/dashboard");
}