"use server";

import { prisma } from "../../lib/prisma";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

async function verificarAdmin() {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("No autorizado.");
  }
}

export async function aprobarPago(subscriptionId: string) {
  await verificarAdmin();

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "APPROVED" }
  });

  revalidatePath("/admin");
}

export async function rechazarPago(subscriptionId: string) {
  await verificarAdmin();

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "REJECTED" }
  });

  revalidatePath("/admin");
}


export async function liberarDispositivo(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      deviceId: null,
      activeSessionId: null, // también cerramos cualquier sesión activa en el celular viejo
    },
  });

  revalidatePath("/admin");
}