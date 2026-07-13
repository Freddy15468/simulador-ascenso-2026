"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { obtenerBancoDePreguntas, obtenerPreguntasPorArea } from "../../actions/preguntas";

type PreguntaBD = {
  id: string;
  text: string;
  options: any;
  correctOption: string;
  feedback: string | null;
};

function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export default function PracticaAleatoriaClient({ areaId }: { areaId?: string }) {
  const router = useRouter();
  const { data: session, status: statusSesion } = useSession();

  const [banco, setBanco] = useState<PreguntaBD[]>([]);
  const [indice, setIndice] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorConstatado, setErrorConstatado] = useState("");

  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<number | null>(null);
  const [respondida, setRespondida] = useState(false);

  const [aciertos, setAciertos] = useState(0);
  const [totalRespondidas, setTotalRespondidas] = useState(0);

  useEffect(() => {
    if (statusSesion === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    const cargar = async () => {
      try {
        const data = areaId ? await obtenerPreguntasPorArea(areaId) : await obtenerBancoDePreguntas();
        setBanco(data);
      } catch (error: any) {
        console.error("Error al cargar la práctica:", error);
        setErrorConstatado(error?.message || "No se pudo cargar la práctica.");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [session, statusSesion, router, areaId]);

  function obtenerOpciones(pregunta: PreguntaBD): string[] {
    return Array.isArray(pregunta.options) ? pregunta.options : JSON.parse(pregunta.options as string);
  }

  // Mezclamos el orden de las opciones UNA sola vez por pregunta (no en cada
  // render), para que la respuesta correcta no siempre caiga en el inciso A.
  const opcionesActuales = useMemo(() => {
    const preguntaActual = banco[indice];
    if (!preguntaActual) return [];
    return barajar(obtenerOpciones(preguntaActual));
  }, [indice, banco]);

  const confirmarRespuesta = () => {
    if (respuestaSeleccionada === null) return;
    setRespondida(true);
    setTotalRespondidas((prev) => prev + 1);

    const opciones = opcionesActuales;
    const textoElegido = opciones[respuestaSeleccionada];

    if (textoElegido === banco[indice].correctOption) {
      setAciertos((prev) => prev + 1);
    }
  };

  const siguientePregunta = () => {
    setRespuestaSeleccionada(null);
    setRespondida(false);

    if (indice + 1 < banco.length) {
      setIndice(indice + 1);
    } else {
      // Se acabó la vuelta al banco: volvemos a barajar y arrancamos de nuevo
      setBanco(barajar(banco));
      setIndice(0);
    }
  };

  if (cargando || statusSesion === "loading") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="animate-pulse text-brand-primary font-bold">Cargando práctica...</div>
      </div>
    );
  }

  if (errorConstatado) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-xl p-8 border border-brand-border text-center">
          <h1 className="text-xl font-bold text-brand-dark mb-3">No se pudo cargar</h1>
          <p className="text-brand-text text-sm mb-6 leading-relaxed">{errorConstatado}</p>
          <Link
            href="/dashboard"
            className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold py-3 rounded-xl block text-center transition-colors"
          >
            Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  const pregunta = banco[indice];
  const opciones = opcionesActuales;

  return (
    <div className="min-h-screen bg-brand-bg p-4 pb-24 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full">
        <div className="flex justify-between items-center mb-6 mt-2">
          <Link href="/dashboard" className="text-brand-text hover:text-brand-dark text-sm font-medium">
            ← Salir
          </Link>
          {totalRespondidas > 0 && (
            <span className="text-xs font-bold text-brand-text bg-brand-surface border border-brand-border px-3 py-1.5 rounded-lg">
              {aciertos} / {totalRespondidas} correctas
            </span>
          )}
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm mb-5">
          <h2 className="text-base font-bold text-brand-dark leading-relaxed">{pregunta.text}</h2>
        </div>

        <div className="space-y-3">
          {opciones.map((opcion, index) => {
            const esLaCorrecta = opcion === pregunta.correctOption;
            const esLaElegida = respuestaSeleccionada === index;

            let estilo = "bg-brand-surface border-brand-border text-brand-dark hover:bg-slate-50";
            if (respondida) {
              if (esLaCorrecta) {
                estilo = "bg-emerald-50 border-emerald-400 text-emerald-800";
              } else if (esLaElegida && !esLaCorrecta) {
                estilo = "bg-red-50 border-red-400 text-red-700";
              } else {
                estilo = "bg-brand-surface border-brand-border text-slate-400";
              }
            } else if (esLaElegida) {
              estilo = "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-sm";
            }

            return (
              <button
                key={index}
                onClick={() => !respondida && setRespuestaSeleccionada(index)}
                disabled={respondida}
                className={`w-full text-left p-4 rounded-xl border font-medium text-sm transition-all ${estilo} ${
                  respondida ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span className="inline-block bg-slate-100 rounded-md px-2 py-0.5 mr-3 font-bold text-xs text-brand-text">
                  {String.fromCharCode(65 + index)}
                </span>
                {opcion}
              </button>
            );
          })}
        </div>

        {respondida && pregunta.feedback && (
          <div className="bg-white p-4 rounded-xl text-xs text-slate-600 border border-slate-200 shadow-sm relative overflow-hidden mt-5">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
            <strong className="text-brand-dark mb-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Justificación
            </strong>
            <span className="leading-relaxed">{pregunta.feedback}</span>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto w-full mt-6">
        {!respondida ? (
          <button
            onClick={confirmarRespuesta}
            disabled={respuestaSeleccionada === null}
            className="w-full bg-brand-dark text-white font-semibold py-3.5 rounded-xl transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            Confirmar Respuesta
          </button>
        ) : (
          <button
            onClick={siguientePregunta}
            className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold py-3.5 rounded-xl transition-all active:scale-98 shadow-md"
          >
            Siguiente Pregunta
          </button>
        )}
      </div>
    </div>
  );
}