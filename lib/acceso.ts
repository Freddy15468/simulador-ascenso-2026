const HORAS_PRUEBA_GRATUITA = 12;

type UsuarioParaAcceso = {
  role: string;
  createdAt: Date;
  subscriptions: { status: string }[];
};

export function calcularAcceso(usuario: UsuarioParaAcceso) {
  const esAdmin = usuario.role === "ADMIN";
  const esPremium = usuario.subscriptions.some((s) => s.status === "APPROVED");

  const horasTranscurridas = (Date.now() - new Date(usuario.createdAt).getTime()) / (1000 * 60 * 60);
  const enPrueba = !esPremium && !esAdmin && horasTranscurridas < HORAS_PRUEBA_GRATUITA;
  const horasRestantesPrueba = Math.max(0, HORAS_PRUEBA_GRATUITA - horasTranscurridas);

  const tieneAcceso = esAdmin || esPremium || enPrueba;

  return { esAdmin, esPremium, enPrueba, horasRestantesPrueba, tieneAcceso };
}

export { HORAS_PRUEBA_GRATUITA };