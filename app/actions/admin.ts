"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function aprobarPago(subscriptionId: string) {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "APPROVED" }
  });
  
  // Actualiza la vista del administrador instantáneamente
  revalidatePath("/admin");
}

export async function rechazarPago(subscriptionId: string) {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "REJECTED" }
  });
  
  revalidatePath("/admin");
}