"use client";

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [esIOS, setEsIOS] = useState(false);
  const [yaInstalada, setYaInstalada] = useState(false);
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    // ¿Ya está instalada (corriendo en modo standalone)? No mostramos nada.
    const enStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setYaInstalada(enStandalone);

    // Detecta iPhone/iPad (Safari no dispara beforeinstallprompt nunca)
    const ua = window.navigator.userAgent;
    setEsIOS(/iPad|iPhone|iPod/.test(ua));

    const manejarPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", manejarPrompt);
    return () => window.removeEventListener("beforeinstallprompt", manejarPrompt);
  }, []);

  if (yaInstalada || cerrado) return null;
  if (!promptEvent && !esIOS) return null; // Android/Chrome sin evento todavía: no mostrar nada

  const instalarAhora = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-brand-dark text-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {esIOS ? (
            <>
              <p className="font-bold text-sm">Instala esta app en tu iPhone</p>
              <p className="text-xs text-brand-bg/80 mt-0.5 leading-relaxed">
                Toca el botón compartir <span className="font-bold">⬆️</span> abajo y elige{" "}
                <span className="font-bold">"Agregar a pantalla de inicio"</span>.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-sm">Instala esta app en tu celular</p>
              <p className="text-xs text-brand-bg/80 mt-0.5">Acceso directo, sin buscar el link cada vez.</p>
            </>
          )}
        </div>
        {!esIOS && (
          <button
            onClick={instalarAhora}
            className="bg-white text-brand-dark text-xs font-bold px-4 py-2.5 rounded-xl whitespace-nowrap shrink-0"
          >
            Instalar
          </button>
        )}
        <button
          onClick={() => setCerrado(true)}
          className="text-white/60 hover:text-white text-lg leading-none shrink-0 px-1"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}