"use client";

import Link from "next/link";
import { useState } from "react";
import { registrarPago } from "../../actions/compras";

function leerArchivoComoBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export default function ComprarPage() {
  const [metodo, setMetodo] = useState<"qr" | "nro">("qr");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      if (metodo === "nro") {
        const nroTransaccion = formData.get("nroTransaccion") as string;
        if (!nroTransaccion) throw new Error("Por favor ingresa el número");

        await registrarPago({ reference: nroTransaccion, isImage: false });
      } else {
        const fileInput = document.getElementById("file-upload") as HTMLInputElement;
        const file = fileInput?.files?.[0];
        if (!file) throw new Error("Por favor sube una captura de pantalla");

        const base64String = await leerArchivoComoBase64(file);
        await registrarPago({ reference: base64String, isImage: true });
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al enviar tu comprobante.");
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg p-4 pb-20">
      <div className="max-w-md mx-auto w-full">

        <div className="mt-4 mb-6">
          <Link href="/dashboard" className="text-brand-text hover:text-brand-dark flex items-center text-sm font-medium transition-colors">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al panel
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Activar Simulador</h1>
          <p className="text-brand-text text-sm mt-1 font-medium">
            Acceso completo a todos los módulos y exámenes cronometrados.
          </p>
        </div>

        <div className="bg-brand-dark rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
          <h2 className="text-brand-bg/80 text-sm font-semibold mb-1 uppercase tracking-wider">Paquete Completo 2026</h2>
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">50</span>
            <span className="text-xl text-brand-bg/80 ml-1">Bs.</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold text-brand-dark mb-4 text-center">Escanea para pagar</h3>
          <div className="flex justify-center mb-3">
            <div className="w-48 h-48 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4">
              <img src="/qr-pago.png" alt="QR para pagar" className="w-48 h-48 object-contain" />
              <span className="text-xs text-slate-500 text-center font-medium">Tu QR Simple de 50 Bs.</span>
            </div>
          </div>

          <a
            href="/qr-pago.png"
            download="QR-pago-simulador.png"
            className="flex items-center justify-center gap-2 text-xs font-bold text-brand-primary hover:text-brand-primaryHover bg-brand-primary/10 hover:bg-brand-primary/20 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar QR
          </a>

          <a
            href="https://wa.me/59177879660?text=Hola%2C%20quiero%20activar%20mi%20cuenta%20del%20Simulador%20de%20Ascenso.%20Mi%20c%C3%A9dula%20es%3A%20"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 py-3 rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.71 14.13c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.94-.31-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94s.73-2.09.99-2.38c.26-.29.56-.36.75-.36.19 0 .38 0 .54.01.17.01.41-.06.64.49.24.58.81 2 .88 2.15.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.26.13.43.19.5.3.07.11.07.62-.17 1.3z"/>
            </svg>
            Solicitar activación por WhatsApp
          </a>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-xl mb-6">
          <button
            onClick={() => setMetodo("qr")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${metodo === "qr" ? "bg-white text-brand-dark shadow-sm" : "text-brand-text"}`}
          >
            Subir Captura QR
          </button>
          <button
            onClick={() => setMetodo("nro")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${metodo === "nro" ? "bg-white text-brand-dark shadow-sm" : "text-brand-text"}`}
          >
            Número de Transacción
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-brand-dark mb-4">Validar mi Activación</h3>

          {metodo === "qr" ? (
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                Sube la captura de tu comprobante
              </label>
              <div className="mt-2 flex justify-center rounded-xl border border-dashed border-brand-primary/50 px-6 py-8 hover:bg-brand-bg/50 transition-colors relative cursor-pointer">
                <div className="text-center">
                  <svg className="mx-auto h-10 w-10 text-brand-primary/60" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                  </svg>
                  <label htmlFor="file-upload" className="block mt-4 text-sm font-semibold text-brand-primary cursor-pointer">
                    <span>Seleccionar comprobante</span>
                    <input id="file-upload" type="file" accept="image/*" className="sr-only" />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                Nro. de Transacción o Comprobante
              </label>
              <input
                type="text"
                name="nroTransaccion"
                placeholder="Ej: 83749204"
                className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center mt-4 font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-brand-primary/20 mt-6 cursor-pointer disabled:opacity-50"
          >
            {cargando ? "Enviando para revisión..." : "Enviar para validación"}
          </button>
        </form>

      </div>
    </div>
  );
}