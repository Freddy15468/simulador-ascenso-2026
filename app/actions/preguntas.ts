"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function obtenerPreguntasExamen() {
  // Buscamos si ya existen preguntas en la base de datos
  let preguntas = await prisma.question.findMany();

  // Si está vacía, inyectamos la estructura y preguntas automáticamente
  if (preguntas.length === 0) {
    console.log("Inyectando preguntas base...");
    
    const categoria = await prisma.category.create({
      data: { name: "Educación Regular - Maestro" }
    });

    const area = await prisma.area.create({
      data: { name: "Normativa General", categoryId: categoria.id }
    });

    await prisma.question.createMany({
      data: [
        {
          text: "¿Cuál es la ley de la Educación en Bolivia que lleva el nombre de 'Avelino Siñani - Elizardo Pérez'?",
          options: ["Ley 1178", "Ley 004", "Ley 070", "Ley 348"],
          correctOption: "2",
          feedback: "La Ley 070, promulgada en 2010, es la Ley de la Educación.",
          areaId: area.id
        },
        {
          text: "Según la Ley 1178 (SAFCO), ¿qué tipo de responsabilidad se determina cuando la acción u omisión causa daño económico al Estado?",
          options: ["Responsabilidad Administrativa", "Responsabilidad Ejecutiva", "Responsabilidad Civil", "Responsabilidad Penal"],
          correctOption: "2",
          feedback: "La responsabilidad es civil cuando se causa daño al Estado valuable en dinero.",
          areaId: area.id
        },
        {
          text: "¿Cuál de los siguientes NO es un subsistema del Sistema Educativo Plurinacional según la Ley 070?",
          options: ["Educación Regular", "Educación Alternativa y Especial", "Educación Superior de Formación Profesional", "Educación Militar y Policial"],
          correctOption: "3",
          feedback: "Los subsistemas son: Regular, Alternativa y Especial, y Superior de Formación Profesional.",
          areaId: area.id
        },
        {
          text: "En el marco de la Constitución Política del Estado, la educación es:",
          options: ["Un servicio privado con supervisión estatal", "Un derecho fundamental, función suprema y primera responsabilidad financiera del Estado", "Una responsabilidad exclusiva de las gobernaciones", "Un derecho opcional"],
          correctOption: "1",
          feedback: "Art. 77 de la CPE: La educación constituye una función suprema y primera responsabilidad financiera del Estado.",
          areaId: area.id
        },
        {
          text: "Según el Reglamento del Escalafón Nacional, ¿cuál es el requisito indispensable para ascender de categoría?",
          options: ["Ser director del establecimiento", "Tener maestría obligatoria", "Aprobar el examen de ascenso y tener el tiempo de servicio requerido", "Militar en un partido político"],
          correctOption: "2",
          feedback: "El ascenso requiere cumplir la antigüedad en la categoría actual y aprobar la evaluación.",
          areaId: area.id
        }
      ]
    });

    // Volvemos a consultar la base de datos ahora que tiene información
    preguntas = await prisma.question.findMany();
  }

  return preguntas;
}