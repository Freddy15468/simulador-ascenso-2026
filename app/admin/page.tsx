import { prisma } from "../../lib/prisma";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { aprobarPago, rechazarPago, liberarDispositivo } from "../actions/admin";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPanel() {
  const session: any = await getServerSession(authOptions);

  // Si no hay sesión o el usuario no es ADMIN, lo expulsamos
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const solicitudes = await prisma.subscription.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });

  const usuarios = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Panel de Control</h1>
            <p className="text-slate-500 mt-1">Gestión de activaciones y pagos pendientes.</p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Panel
          </Link>
        </div>

        {solicitudes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-200">
            <h3 className="text-lg font-medium text-slate-600">No hay pagos pendientes</h3>
            <p className="text-slate-400 text-sm mt-1">Todo está al día.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {solicitudes.map((solicitud) => (
              <div key={solicitud.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">{solicitud.user.name}</h3>
                  <p className="text-sm text-slate-500">{solicitud.user.email}</p>
                  <span className="inline-block mt-2 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">
                    Pendiente de Revisión
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Comprobante enviado:
                  </p>
                  {solicitud.receiptUrl?.startsWith("data:image") ? (
                    <div className="w-full h-48 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={solicitud.receiptUrl}
                        alt="Comprobante"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                      <span className="font-mono text-lg text-slate-700 font-bold tracking-widest">
                        {solicitud.receiptUrl}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <form action={aprobarPago.bind(null, solicitud.id)} className="flex-1">
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-xl transition-colors cursor-pointer text-sm">
                      Aprobar
                    </button>
                  </form>
                  <form action={rechazarPago.bind(null, solicitud.id)} className="flex-1">
                    <button type="submit" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-xl transition-colors cursor-pointer text-sm border border-slate-200">
                      Rechazar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Gestión de Dispositivos</h2>
          <p className="text-slate-500 text-sm mb-5">
            Cada cuenta queda amarrada al primer celular donde inicia sesión. Si un maestro cambia de
            celular, libera aquí su dispositivo para que pueda entrar de nuevo desde el nuevo.
          </p>

          {usuarios.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200 text-slate-500 text-sm">
              Todavía no hay maestros registrados.
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
              {usuarios.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-500">Cédula: {u.cedula ?? "—"}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.deviceId ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.deviceId ? "Dispositivo amarrado" : "Sin dispositivo aún"}
                    </span>
                  </div>
                  {u.deviceId && (
                    <form action={liberarDispositivo.bind(null, u.id)}>
                      <button
                        type="submit"
                        className="whitespace-nowrap bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-xs px-3 py-2 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                      >
                        Liberar dispositivo
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}