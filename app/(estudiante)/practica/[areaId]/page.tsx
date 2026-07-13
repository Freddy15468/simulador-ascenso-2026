import PracticaAleatoriaClient from "../../../components/simulacro/PracticaAleatoriaClient";

export default async function PracticaAreaPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = await params;
  return <PracticaAleatoriaClient areaId={areaId} />;
}