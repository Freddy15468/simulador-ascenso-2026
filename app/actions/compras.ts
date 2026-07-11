"use server";

import { prisma } from "../../lib/prisma";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function registrarPago(data: { reference: string; isImage: boolean }) {
  const session: any = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    throw new Error("No autorizado");
  }

  const usuario = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { subscriptions: true }
  });

  if (!usuario) throw new Error("Usuario no encontrado");

  // Evitamos duplicados: ya premium o ya tiene un comprobante en revisión
  const yaEsPremium = usuario.subscriptions.some(s => s.status === "APPROVED");
  const tienePendiente = usuario.subscriptions.some(s => s.status === "PENDING");

  if (yaEsPremium) {
    throw new Error("Tu cuenta ya está activa. No necesitas volver a pagar.");
  }
  if (tienePendiente) {
    throw new Error("Ya tienes un comprobante en revisión. Espera la validación.");
  }

  await prisma.subscription.create({
    data: {
      userId: usuario.id,
      status: "PENDING",
      receiptUrl: data.reference,
      areaId: null
    }
  });

  redirect("/dashboard");
}