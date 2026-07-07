import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    redirect("/login");
  }

  // 1. Buscar al usuario en la base de datos
  const usuario = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      subscriptions: true,
      attempts: { orderBy: { createdAt: "desc" } } // Traemos su historial
    }
  });

  if (!usuario) redirect("/login");

  // 2. Verificar si tiene alguna suscripción aprobada
  const esPremium = usuario.subscriptions.some(sub => sub.status === "APPROVED");
  const tienePagoPendiente = usuario.subscriptions.some(sub => sub.status === "PENDING");

  return (
    <div className="min-h-screen bg-brand-bg p-4 pb-20">
      <div className="max-w-md mx-auto w-full">
        
        {/* Cabecera */}
        <div className="mb-8 mt-6">
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">
            Hola, {usuario.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-brand-text text-sm mt-1 font-medium">
            Plan de Estudio - Gestión 2026
          </p>
        </div>

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
            <Link href="/comprar" className="bg-white text-brand-primary px-5 py-2.5 rounded-xl font-bold text-sm inline-block shadow-sm">
              Activar Simulador
            </Link>
          </div>
        )}

        {/* Lista de Módulos */}
        <h3 className="text-lg font-bold text-brand-dark mb-4">Módulos de Evaluación</h3>
        
        <div className="space-y-4">
          {/* Módulo 1: Normativa General */}
          <div className={`bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm relative overflow-hidden ${!esPremium && 'opacity-60'}`}>
            <h4 className="font-semibold text-brand-dark text-base">Normativa General</h4>
            <p className="text-xs text-brand-text mt-1.5 leading-relaxed">
              Constitución Política, Ley 070 Avelino Siñani, Ley 1178 (SAFCO) y reglamentos generales.
            </p>
            {esPremium ? (
              <Link href="/simulacro/general" className="mt-4 bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-bold px-4 py-2 rounded-xl inline-block transition-colors cursor-pointer">
                Iniciar Simulacro
              </Link>
            ) : (
              <div className="mt-4 text-xs font-bold text-slate-500 bg-slate-100 inline-flex items-center px-2.5 py-1 rounded-md">
                Bloqueado
              </div>
            )}
          </div>

          {/* Módulo 2: Normativa Específica */}
          <div className={`bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm relative overflow-hidden ${!esPremium && 'opacity-60'}`}>
            <h4 className="font-semibold text-brand-dark text-base">Especialidad y Bibliografía Específica</h4>
            <p className="text-xs text-brand-text mt-1.5 leading-relaxed">
              Manuales de funciones, reglamentos internos y normativas específicas según tu área.
            </p>
            {esPremium ? (
              <Link href="/simulacro/especifica" className="mt-4 bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-bold px-4 py-2 rounded-xl inline-block transition-colors cursor-pointer">
                Iniciar Simulacro
              </Link>
            ) : (
              <div className="mt-4 text-xs font-bold text-slate-500 bg-slate-100 inline-flex items-center px-2.5 py-1 rounded-md">
                Bloqueado
              </div>
            )}
          </div>
        </div>

      </div>
      {/* Historial de Evaluaciones */}
        {usuario.attempts && usuario.attempts.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-brand-dark mb-4">Historial de Evaluaciones</h3>
            <div className="space-y-3">
              {usuario.attempts.map((intento) => (
                <div key={intento.id} className="bg-white rounded-xl p-4 border border-brand-border shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-brand-dark text-sm">Simulacro General</p>
                    <p className="text-xs text-brand-text mt-0.5">
                      {new Date(intento.createdAt).toLocaleDateString("es-BO", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${intento.score >= 51 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
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