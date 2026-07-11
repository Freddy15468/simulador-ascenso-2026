import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../../api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    redirect("/login");
  }

  const usuario = await prisma.user.findUnique({
    where: { id: (session!.user as any).id },
    include: {
      subscriptions: true,
      attempts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!usuario) redirect("/login");

  if (usuario.activeSessionId !== (session!.user as any).activeSessionId) {
    redirect("/login?error=cuenta_compartida");
  }

  const esPremium = usuario.subscriptions.some((sub) => sub.status === "APPROVED");
  const tienePagoPendiente = usuario.subscriptions.some((sub) => sub.status === "PENDING");

  // Áreas reales de la categoría del usuario, con conteo de preguntas
  const areas = usuario.categoryId
    ? await prisma.area.findMany({
        where: { categoryId: usuario.categoryId },
        include: { _count: { select: { questions: true } } },
        orderBy: { name: "asc" },
      })
    : [];

  const totalPreguntas = areas.reduce((acc, a) => acc + a._count.questions, 0);

  return (
    <div className="min-h-screen bg-brand-bg p-4 pb-20">
      <div className="max-w-md mx-auto w-full">
        {/* Cabecera */}
        <div className="mb-8 mt-6">
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">
            Hola, {usuario.name?.split(" ")[0]} 
          </h1>
          <p className="text-brand-text text-sm mt-1 font-medium">Gestión 2026</p>
        </div>

        {usuario.role === "ADMIN" && (
          <Link
            href="/admin"
            className="mb-6 flex items-center justify-between bg-slate-800 hover:bg-slate-900 text-white rounded-2xl p-4 transition-colors"
          >
            <div>
              <p className="font-semibold text-sm">Panel de Administración</p>
              <p className="text-xs text-slate-300 mt-0.5">Ver usuarios y aprobar pagos pendientes</p>
            </div>
            <span className="text-xl">→</span>
          </Link>
        )}

        {/* Tarjeta de Estado Dinámica */}
        {esPremium ? (
          <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20 mb-8">
            <h2 className="text-lg font-semibold mb-1">Cuenta Premium Activa 🚀</h2>
            <p className="text-brand-bg/95 text-sm leading-relaxed">
              Tienes acceso ilimitado a todos los simulacros y normativas de la convocatoria. ¡Mucho éxito!
            </p>
          </div>
        ) : tienePagoPendiente ? (
          <div className="bg-amber-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20 mb-8">
            <h2 className="text-lg font-semibold mb-1">Pago en Revisión ⏳</h2>
            <p className="text-brand-bg/95 text-sm leading-relaxed">
              Recibimos tu comprobante correctamente. Estamos validando la transacción en nuestro banco para activarte.
            </p>
          </div>
        ) : (
          <div className="bg-brand-primary rounded-2xl p-6 text-white shadow-lg shadow-brand-primary/20 mb-8">
            <h2 className="text-lg font-semibold mb-2">Simulador Inactivo</h2>
            <p className="text-brand-bg/90 text-sm mb-5 leading-relaxed">
              Activa tu cuenta para desbloquear el banco de preguntas completo y los exámenes oficiales.
            </p>
            <Link
              href="/comprar"
              className="bg-white text-brand-primary px-5 py-2.5 rounded-xl font-bold text-sm inline-block shadow-sm"
            >
              Activar Simulador
            </Link>
          </div>
        )}

        {/* Práctica Libre y Examen Completo */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div
            className={`bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm relative overflow-hidden ${
              !esPremium && "opacity-60"
            }`}
          >
            <h3 className="font-bold text-lg text-brand-dark mb-1.5">Práctica Libre</h3>
            <p className="text-brand-text text-xs mb-4 leading-relaxed">
              Preguntas al azar de todo el banco de preguntas, una por una, con la
              respuesta correcta al instante. Sin tiempo, sin nota — solo para repasar.
            </p>
            {esPremium ? (
              <Link
                href="/practica"
                className="bg-brand-primary hover:bg-brand-primaryHover text-white px-5 py-2.5 rounded-xl font-bold text-sm inline-block shadow-sm transition-colors"
              >
                Empezar a Practicar
              </Link>
            ) : (
              <div className="text-xs font-bold text-slate-500 bg-slate-100 inline-flex items-center px-2.5 py-1 rounded-md">
                Bloqueado
              </div>
            )}
          </div>

          <div
            className={`bg-brand-dark rounded-2xl p-6 text-white shadow-lg relative overflow-hidden ${
              !esPremium && "opacity-60"
            }`}
          >
            <h3 className="font-bold text-lg mb-1.5">Examen Completo</h3>
            <p className="text-brand-bg/80 text-xs mb-4 leading-relaxed">
              Simulación cronometrada de 100 preguntas mezclando todas las áreas de tu convocatoria,
              igual que el examen real de ascenso.
            </p>
            {esPremium ? (
              <Link
                href="/simulacro/completo"
                className="bg-white text-brand-dark px-5 py-2.5 rounded-xl font-bold text-sm inline-block shadow-sm"
              >
                Iniciar Examen Completo
              </Link>
            ) : (
              <div className="text-xs font-bold text-slate-300 bg-white/10 inline-flex items-center px-2.5 py-1 rounded-md">
                Bloqueado
              </div>
            )}
          </div>
        </div>

        {/* Lista de Áreas reales (solo Simulacro por área; la práctica ya es libre arriba) */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-brand-dark">Simulacro por Área</h3>
        
        </div>

        {areas.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 text-sm text-brand-text">
            Todavía no hay áreas de estudio cargadas para tu categoría. Vuelve pronto.
          </div>
        ) : (
          <div className="space-y-4">
            {areas.map((area) => (
              <div
                key={area.id}
                className={`bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm relative overflow-hidden ${
                  !esPremium && "opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-brand-dark text-base">{area.name}</h4>
                
                </div>

                {esPremium ? (
                  <Link
                    href={`/simulacro/${area.id}`}
                    className="mt-4 bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-bold px-4 py-2 rounded-xl inline-block transition-colors"
                  >
                    Iniciar Simulacro
                  </Link>
                ) : (
                  <div className="mt-4 text-xs font-bold text-slate-500 bg-slate-100 inline-flex items-center px-2.5 py-1 rounded-md">
                    Bloqueado
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {usuario.attempts && usuario.attempts.length > 0 && (
        <div className="mt-10 max-w-md mx-auto w-full">
          <h3 className="text-lg font-bold text-brand-dark mb-4">Historial de Evaluaciones</h3>
          <div className="space-y-3">
            {usuario.attempts.map((intento) => (
              <div
                key={intento.id}
                className="bg-white rounded-xl p-4 border border-brand-border shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-brand-dark text-sm">Simulacro</p>
                  <p className="text-xs text-brand-text mt-0.5">
                    {new Date(intento.createdAt).toLocaleDateString("es-BO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                    intento.score >= 51 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  }`}
                >
                  {intento.score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}