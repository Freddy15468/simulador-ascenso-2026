"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function registrarUsuario(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Encriptar la contraseña (nivel de seguridad 10)
  const hashedPassword = await bcrypt.hash(password, 10);

  // 2. Guardar el usuario en Supabase a través de Prisma
  try {
    await prisma.user.create({
      data: {
        name: nombre,
        email: email,
        password: hashedPassword,
        // Nota: La categoría elegida la conectaremos cuando creemos las áreas de estudio.
      }
    });
  } catch (error) {
    console.error("Error al registrar:", error);
    throw new Error("No se pudo crear la cuenta. Quizás el correo ya existe.");
  }

  // 3. Si todo sale bien, lo enviamos a la pantalla de inicio de sesión
  redirect("/login");
}