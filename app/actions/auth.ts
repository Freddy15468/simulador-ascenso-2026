"use server";

import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registrarUsuario(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const cedula = formData.get("cedula") as string;
  const pin = formData.get("pin") as string;
  const categoryId = formData.get("categoria") as string;

  if (!categoryId) {
    throw new Error("Debes seleccionar una convocatoria.");
  }

  if (!cedula || cedula.trim().length < 5) {
    throw new Error("Ingresa un número de cédula válido.");
  }

  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error("El PIN debe tener entre 4 y 6 dígitos numéricos.");
  }

  const hashedPin = await bcrypt.hash(pin, 10);

  try {
    await prisma.user.create({
      data: {
        name: nombre,
        cedula: cedula.trim(),
        password: hashedPin, // aquí se guarda el hash del PIN
        categoryId: categoryId,
      },
    });
  } catch (error) {
    console.error("Error al registrar:", error);
    throw new Error("No se pudo crear la cuenta. Es posible que esa cédula ya esté registrada.");
  }

  redirect("/login");
}