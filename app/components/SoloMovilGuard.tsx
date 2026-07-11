"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const ANCHO_MAXIMO_PERMITIDO = 900; // px — cubre celulares y tablets, bloquea PC/laptop

// =====================================================================
// INTERRUPTOR DE PRUEBAS: mientras esté en `true`, CUALQUIER usuario
// (admin o no) puede entrar desde la PC, sin restricción de tamaño de
// pantalla. Úsalo para probar cómodamente antes de publicar.
//
// ⚠️ IMPORTANTE: cambia esto a `false` antes de subir a producción,
// para que el bloqueo de "solo celular/tablet" vuelva a aplicar a los
// usuarios normales (el admin siempre puede entrar desde PC, pase lo
// que pase con este interruptor).
// =====================================================================
const MODO_PRUEBA_PERMITIR_PC = true; //cambia esa línea a const MODO_PRUEBA_PERMITIR_PC = false;

export default function SoloMovilGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [esPantallaGrande, setEsPantallaGrande] = useState<boolean | null>(null);

  useEffect(() => {
    const verificar = () => setEsPantallaGrande(window.innerWidth > ANCHO_MAXIMO_PERMITIDO);
    verificar();
    window.addEventListener("resize", verificar);
    return () => window.removeEventListener("resize", verificar);
  }, []);

  const esAdmin = (session?.user as any)?.role === "ADMIN";

  // El admin siempre pasa. En modo prueba, todos pasan. Ninguno de los
  // dos casos necesita esperar a "status" porque, si no hay sesión
  // (esAdmin=false) y no es modo prueba, igual aplicamos el bloqueo normal.
  if (esAdmin || MODO_PRUEBA_PERMITIR_PC) {
    return <>{children}</>;
  }

  // Evita parpadeo mientras se determina el tamaño de pantalla
  if (esPantallaGrande === null || status === "loading") {
    return null;
  }

  if (esPantallaGrande) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-brand-surface rounded-2xl shadow-xl p-8 border border-brand-border text-center">
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-brand-dark mb-2">Solo disponible en celular o tablet</h1>
          <p className="text-sm text-brand-text leading-relaxed">
            Esta aplicación está diseñada para usarse desde tu teléfono o tablet. Por favor, abre este
            mismo enlace desde tu celular para continuar.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}