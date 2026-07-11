"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { guardarIntento } from "../../actions/examen";
import { obtenerPreguntasPorArea, obtenerPreguntasExamenCompleto } from "../../actions/preguntas";

// Normativa oficial: 130 minutos para las 100 preguntas del examen completo.
const TIEMPO_EXAMEN_COMPLETO_SEGUNDOS = 130 * 60;
// Para simulacros de UN área (no tienen tiempo oficial propio), mantenemos
// el mismo ritmo que el examen real: 130min / 100 preguntas = 78 seg/pregunta.
const SEGUNDOS_POR_PREGUNTA = Math.round(TIEMPO_EXAMEN_COMPLETO_SEGUNDOS / 100);

type PreguntaBD = {
  id: string;
  text: string;
  options: any;
  correctOption: string;
  feedback: string | null;
};

type Props =
  | { tipo: "area"; areaId: string }
  | { tipo: "completo"; areaId?: undefined };

export default function SimulacroClient(props: Props) {
  const router = useRouter();
  const { data: session, status: statusSesion } = useSession();

  const [preguntas, setPreguntas] = useState<PreguntaBD[]>([]);
  const [cargando, setCargando] = useState(true);

  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<number | null>(null);
  const [respuestasUsuario, setRespuestasUsuario] = useState<(string | null)[]>([]);
  const [respuestasCorrectas, setRespuestasCorrectas] = useState(0);

  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  const [tiempoTotalInicial, setTiempoTotalInicial] = useState<number>(0);
  const [examenTerminado, setExamenTerminado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorConstatado, setErrorConstatado] = useState("");
  const [mostrarConfirmacionSalir, setMostrarConfirmacionSalir] = useState(false);

  useEffect(() => {
    if (statusSesion === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    const cargar = async () => {
      try {
        const data =
          props.tipo === "completo"
            ? await obtenerPreguntasExamenCompleto()
            : await obtenerPreguntasPorArea(props.areaId);

        const tiempoInicial =
          props.tipo === "completo" ? TIEMPO_EXAMEN_COMPLETO_SEGUNDOS : data.length * SEGUNDOS_POR_PREGUNTA;

        setPreguntas(data);
        setTiempoTotalInicial(tiempoInicial);
        setTiempoRestante(tiempoInicial);
      } catch (error: any) {
        console.error("Error al cargar el simulacro:", error);
        setErrorConstatado(
          error?.message ||
            "No se pudo cargar el examen. Es posible que tu sesión haya expirado o se haya iniciado en otro dispositivo."
        );
      } finally {
        setCargando(false);
      }
    };

    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, statusSesion, router]);

  const finalizarExamen = useCallback(
    async (correctasFinales: number) => {
      setGuardando(true);
      setErrorConstatado("");
      const notaFinal = Math.round((correctasFinales / preguntas.length) * 100);
      const tiempoUsado = tiempoTotalInicial - (tiempoRestante ?? 0);

      try {
        await guardarIntento(notaFinal, tiempoUsado);
        setExamenTerminado(true);
      } catch (error: any) {
        console.error("Error al guardar:", error);
        setErrorConstatado(
          "Tu sesión ya no es válida porque se abrió esta cuenta en otro dispositivo. Tu nota no pudo ser registrada."
        );
      } finally {
        setGuardando(false);
      }
    },
    [tiempoRestante, tiempoTotalInicial, preguntas.length]
  );

  useEffect(() => {
    if (cargando || errorConstatado || tiempoRestante === null) return;

    if (tiempoRestante <= 0 && !examenTerminado) {
      finalizarExamen(respuestasCorrectas);
      return;
    }
    if (!examenTerminado) {
      const timer = setTimeout(() => setTiempoRestante((t) => (t ?? 0) - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tiempoRestante, examenTerminado, finalizarExamen, respuestasCorrectas, cargando, errorConstatado]);

  function obtenerOpciones(pregunta: PreguntaBD): string[] {
    return Array.isArray(pregunta.options) ? pregunta.options : JSON.parse(pregunta.options as string);
  }

  function barajarLocal<T>(arr: T[]): T[] {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  // Mezclamos el orden de las opciones UNA sola vez por pregunta (no en cada
  // render), para que la respuesta correcta no siempre caiga en el inciso A.
  // Este mismo orden mezclado se usa tanto para mostrar los botones como
  // para interpretar qué texto corresponde al índice que el usuario clickeó.
  const opcionesActuales = useMemo(() => {
    const preguntaActualObj = preguntas[preguntaActual];
    if (!preguntaActualObj) return [];
    return barajarLocal(obtenerOpciones(preguntaActualObj));
  }, [preguntaActual, preguntas]);

  const manejarSiguiente = async () => {
    const opciones = opcionesActuales;
    const respuestaTexto = respuestaSeleccionada !== null ? opciones[respuestaSeleccionada] : null;

    const nuevasRespuestasUsuario = [...respuestasUsuario, respuestaTexto];
    setRespuestasUsuario(nuevasRespuestasUsuario);

    let nuevasCorrectas = respuestasCorrectas;
    if (respuestaTexto !== null && respuestaTexto === preguntas[preguntaActual].correctOption) {
      nuevasCorrectas += 1;
      setRespuestasCorrectas(nuevasCorrectas);
    }

    setRespuestaSeleccionada(null);

    if (preguntaActual + 1 < preguntas.length) {
      setPreguntaActual(preguntaActual + 1);
    } else {
      await finalizarExamen(nuevasCorrectas);
    }
  };

  const formatearTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (cargando || statusSesion === "loading" || tiempoRestante === null) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="animate-pulse text-brand-primary font-bold">Cargando simulador...</div>
      </div>
    );
  }

  if (errorConstatado && !examenTerminado) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-xl p-8 border border-brand-border text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-brand-dark mb-3">Acceso Denegado</h1>
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

  if (examenTerminado) {
    const notaFinal = Math.round((respuestasCorrectas / preguntas.length) * 100);
    return (
      <div className="min-h-screen bg-brand-bg p-4 pb-10">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-brand-surface rounded-2xl shadow-sm p-8 border border-brand-border text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark mb-2">Simulacro Finalizado</h1>
            <div className="inline-block bg-slate-50 border border-brand-border rounded-full p-8 mb-6 mt-4">
              <span className={`text-5xl font-black ${notaFinal >= 51 ? "text-emerald-600" : "text-red-500"}`}>
                {notaFinal}%
              </span>
            </div>
            <div className="space-y-2 text-sm text-brand-text">
              <p>
                Acertaste{" "}
                <strong className="text-brand-dark">
                  {respuestasCorrectas} de {preguntas.length}
                </strong>{" "}
                preguntas
              </p>
            </div>
          </div>

          <h2 className="text-lg font-bold text-brand-dark mb-4 px-1">Revisión del Examen</h2>
          <div className="space-y-4 mb-8">
            {preguntas.map((preg, i) => {
              const miRespuesta = respuestasUsuario[i];
              const esCorrecta = miRespuesta === preg.correctOption;

              return (
                <div
                  key={preg.id}
                  className={`p-5 rounded-2xl border shadow-sm ${
                    esCorrecta ? "bg-emerald-50/50 border-emerald-200" : "bg-red-50/50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        esCorrecta ? "bg-emerald-200 text-emerald-800" : "bg-red-200 text-red-800"
                      }`}
                    >
                      {esCorrecta ? "Correcto" : "Incorrecto"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Pregunta {i + 1}</span>
                  </div>

                  <p className="font-semibold text-brand-dark text-sm mb-4 leading-relaxed">{preg.text}</p>

                  <div className="text-xs space-y-2 mb-4 bg-white/60 p-3 rounded-lg border border-slate-100">
                    <p>
                      <span className="text-slate-500 block mb-0.5">Marcaste:</span>
                      <span className={`font-medium ${esCorrecta ? "text-emerald-700" : "text-red-600"}`}>
                        {miRespuesta ?? "No respondida"}
                      </span>
                    </p>
                    {!esCorrecta && (
                      <p className="pt-1 border-t border-slate-100/50">
                        <span className="text-slate-500 block mb-0.5">La respuesta correcta era:</span>
                        <span className="font-medium text-emerald-700">{preg.correctOption}</span>
                      </p>
                    )}
                  </div>

                  {preg.feedback && (
                    <div className="bg-white p-4 rounded-xl text-xs text-slate-600 border border-slate-200 shadow-sm relative overflow-hidden">
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
                        Justificación de la Norma
                      </strong>
                      <span className="leading-relaxed">{preg.feedback}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href="/dashboard"
            className="w-full bg-brand-dark hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl block text-center transition-colors shadow-md"
          >
            Volver a mi Panel
          </Link>
        </div>
      </div>
    );
  }

  const pregunta = preguntas[preguntaActual];
  const opciones = opcionesActuales;

  return (
    <div className="min-h-screen bg-brand-bg p-4 pb-20 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full">
        <div className="flex justify-between items-center bg-brand-surface border border-brand-border p-4 rounded-xl shadow-sm mb-6 mt-2">
          <button
            onClick={() => setMostrarConfirmacionSalir(true)}
            className="text-xs font-bold text-brand-text hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Salir
          </button>
          <span className="text-xs font-bold text-brand-text">
            Pregunta {preguntaActual + 1} de {preguntas.length}
          </span>
          <div className="flex items-center text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatearTiempo(tiempoRestante)}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm mb-5">
          <h2 className="text-base font-bold text-brand-dark leading-relaxed">{pregunta.text}</h2>
        </div>

        <div className="space-y-3">
          {opciones.map((opcion, index) => (
            <button
              key={index}
              onClick={() => setRespuestaSeleccionada(index)}
              className={`w-full text-left p-4 rounded-xl border font-medium text-sm transition-all cursor-pointer ${
                respuestaSeleccionada === index
                  ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-sm"
                  : "bg-brand-surface border-brand-border text-brand-dark hover:bg-slate-50"
              }`}
            >
              <span className="inline-block bg-slate-100 rounded-md px-2 py-0.5 mr-3 font-bold text-xs text-brand-text">
                {String.fromCharCode(65 + index)}
              </span>
              {opcion}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto w-full mt-6">
        <button
          onClick={manejarSiguiente}
          disabled={respuestaSeleccionada === null || guardando}
          className="w-full bg-brand-dark text-white font-semibold py-3.5 rounded-xl transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex justify-center items-center"
        >
          {guardando
            ? "Guardando nota..."
            : preguntaActual + 1 === preguntas.length
            ? "Finalizar Examen"
            : "Siguiente Pregunta"}
        </button>
      </div>

      {mostrarConfirmacionSalir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-brand-surface rounded-2xl shadow-xl p-6 border border-brand-border">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-2">¿Seguro que quieres salir?</h3>
            <p className="text-sm text-brand-text mb-6 leading-relaxed">
              Perderás el progreso de este intento y no se guardará ninguna nota.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacionSalir(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-brand-dark font-semibold py-2.5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}