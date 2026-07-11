import SimulacroClient from "../../../components/simulacro/SimulacroClient";

export default async function SimulacroAreaPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = await params;
  return <SimulacroClient tipo="area" areaId={areaId} />;
}