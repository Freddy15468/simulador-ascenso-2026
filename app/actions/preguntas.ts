"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "../../lib/prisma";

const CANTIDAD_EXAMEN_COMPLETO = 100;

async function obtenerUsuarioConCategoria() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    throw new Error("No autorizado: Debes iniciar sesión.");
  }

  const usuario = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
  });

  if (!usuario) {
    throw new Error("Usuario no encontrado.");
  }

  if (!usuario.categoryId) {
    throw new Error("Tu cuenta no tiene una categoría/convocatoria asignada. Contacta a soporte.");
  }

  return usuario;
}

function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Trae las preguntas de UN área puntual (ej. "Ley 004").
 * Verifica que el área pertenezca a la categoría del usuario (evita que
 * alguien acceda a preguntas de otra convocatoria adivinando el areaId).
 * Si no se pasa `cantidad`, devuelve TODAS las preguntas del área, barajadas.
 */
export async function obtenerPreguntasPorArea(areaId: string, cantidad?: number) {
  const usuario = await obtenerUsuarioConCategoria();

  const area = await prisma.area.findUnique({ where: { id: areaId } });

  if (!area || area.categoryId !== usuario.categoryId) {
    throw new Error("Esta área no existe o no pertenece a tu categoría.");
  }

  const preguntas = await prisma.question.findMany({ where: { areaId } });

  if (preguntas.length === 0) {
    throw new Error(`El área "${area.name}" todavía no tiene preguntas cargadas.`);
  }

  const barajadas = barajar(preguntas);
  return cantidad ? barajadas.slice(0, cantidad) : barajadas;
}

/**
 * Trae hasta 100 preguntas al azar combinando TODAS las áreas de la
 * categoría del usuario. Es el "examen completo" que simula el examen real.
 */
export async function obtenerPreguntasExamenCompleto() {
  const usuario = await obtenerUsuarioConCategoria();

  const preguntas = await prisma.question.findMany({
    where: { area: { categoryId: usuario.categoryId! } },
  });

  if (preguntas.length === 0) {
    throw new Error("Todavía no hay preguntas cargadas para tu categoría.");
  }

  return barajar(preguntas).slice(0, CANTIDAD_EXAMEN_COMPLETO);
}

/**
 * Trae TODO el banco de preguntas de la categoría del usuario, mezclado.
 * Se usa para la práctica libre: una pregunta al azar a la vez, sin elegir área.
 */
export async function obtenerBancoDePreguntas() {
  const usuario = await obtenerUsuarioConCategoria();

  const preguntas = await prisma.question.findMany({
    where: { area: { categoryId: usuario.categoryId! } },
  });

  if (preguntas.length === 0) {
    throw new Error("Todavía no hay preguntas cargadas para tu categoría.");
  }

  return barajar(preguntas);
}

/**
 * Lista las áreas de la categoría del usuario, con el conteo de preguntas
 * de cada una. Se usa para pintar las tarjetas del dashboard.
 */
export async function obtenerAreasDelUsuario() {
  const usuario = await obtenerUsuarioConCategoria();

  const areas = await prisma.area.findMany({
    where: { categoryId: usuario.categoryId! },
    include: { _count: { select: { questions: true } } },
    orderBy: { name: "asc" },
  });

  return areas;
}