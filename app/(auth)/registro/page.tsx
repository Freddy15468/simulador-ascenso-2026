import { prisma } from "../../../lib/prisma";
import RegistroForm from "../../components/RegistroForm";

export default async function RegistroPage() {
  const categorias = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return <RegistroForm categorias={categorias} />;
}