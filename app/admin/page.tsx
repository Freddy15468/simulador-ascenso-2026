import { PrismaClient } from "@prisma/client";
import { aprobarPago, rechazarPago } from "../actions/admin";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function AdminPanel() {
  // 1. Verificamos quién es el usuario
  const session = await getServerSession();

  // 2. Si no es tu correo exacto, lo expulsamos de vuelta al dashboard
  if (session?.user?.email !== "freddyperalta376@gmail.com") {
    redirect("/dashboard");
  }

  // 3. Si eres tú, cargamos las solicitudes
  const solicitudes = await prisma.subscription.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 mt-1">Gestión de activaciones y pagos pendientes.</p>
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
                  {/* Verificamos si es una imagen (Base64) o un número de texto */}
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

                {/* Botones de acción usando Server Actions */}
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

      </div>
    </div>
  );
}