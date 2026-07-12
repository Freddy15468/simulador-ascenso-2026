"use server";

import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";

type ResultadoRegistro = { ok: true } | { ok: false; error: string };

export async function registrarUsuario(formData: FormData): Promise<ResultadoRegistro> {
  const nombre = formData.get("nombre") as string;
  const cedula = formData.get("cedula") as string;
  const pin = formData.get("pin") as string;
  const categoryId = formData.get("categoria") as string;

  if (!categoryId) {
    return { ok: false, error: "Debes seleccionar una convocatoria." };
  }

  if (!cedula || cedula.trim().length < 5) {
    return { ok: false, error: "Ingresa un número de cédula válido." };
  }

  if (!/^\d{4,6}$/.test(pin)) {
    return { ok: false, error: "El PIN debe tener entre 4 y 6 dígitos numéricos." };
  }

  const hashedPin = await bcrypt.hash(pin, 10);

  try {
    await prisma.user.create({
      data: {
        name: nombre,
        cedula: cedula.trim(),
        password: hashedPin,
        categoryId: categoryId,
      },
    });
  } catch (error: any) {
    console.error("Error al registrar:", error);

    // P2002 = violación de restricción única de Prisma (la cédula ya existe)
    if (error?.code === "P2002") {
      return {
        ok: false,
        error: "Esa cédula ya está registrada. Si ya tienes una cuenta, inicia sesión en su lugar.",
      };
    }

    return { ok: false, error: "No se pudo crear la cuenta. Intenta de nuevo en unos minutos." };
  }

  return { ok: true };
}