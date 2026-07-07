"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { guardarIntento } from "../../../actions/examen";
import { obtenerPreguntasExamen } from "../../../actions/preguntas";

const TIEMPO_TOTAL = 300; 

type PreguntaBD = {
  id: string;
  text: string;
  options: any; 
  correctOption: string;
  feedback: string | null;
};

export default function SimulacroPage() {
  const [preguntas, setPreguntas] = useState<PreguntaBD[]>([]);
  const [cargando, setCargando] = useState(true);

  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<number | null>(null);
  
  // NUEVO: Guardamos qué marcó el usuario exactamente
  const [respuestasUsuario, setRespuestasUsuario] = useState<(string | null)[]>([]);
  
  const [respuestasCorrectas, setRespuestasCorrectas] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_TOTAL); 
  const [examenTerminado, setExamenTerminado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerPreguntasExamen();
      setPreguntas(data);
      setCargando(false);
    };
    cargar();
  }, []);

  const finalizarExamen = useCallback(async (correctasFinales: number) => {
    setGuardando(true);
    const notaFinal = Math.round((correctasFinales / preguntas.length) * 100);
    const tiempoUsado = TIEMPO_TOTAL - tiempoRestante;
    
    try {
      await guardarIntento(notaFinal, tiempoUsado);
    } catch (error) {
      console.error("Error al guardar:", error);
    }
    
    setExamenTerminado(true);
    setGuardando(false);
  }, [tiempoRestante, preguntas.length]);

  useEffect(() => {
    if (cargando) return; 
    
    if (tiempoRestante <= 0 && !examenTerminado) {
      finalizarExamen(respuestasCorrectas);
      return;
    }
    if (!examenTerminado) {
      const timer = setTimeout(() => setTiempoRestante(tiempoRestante - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tiempoRestante, examenTerminado, finalizarExamen, respuestasCorrectas, cargando]);

  const manejarSiguiente = async () => {
    // 1. Guardamos la opción que eligió en su historial personal
    const respuestaStr = respuestaSeleccionada?.toString() ?? null;
    const nuevasRespuestasUsuario = [...respuestasUsuario, respuestaStr];
    setRespuestasUsuario(nuevasRespuestasUsuario);

    // 2. Comprobamos si acertó
    let nuevasCorrectas = respuestasCorrectas;
    if (respuestaStr === preguntas[preguntaActual].correctOption) {
      nuevasCorrectas += 1;
      setRespuestasCorrectas(nuevasCorrectas);
    }

    setRespuestaSeleccionada(null);

    // 3. Avanzamos o terminamos
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

  if (cargando) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="animate-pulse text-brand-primary font-bold">Cargando simulador...</div>
      </div>
    );
  }

  // --- PANTALLA DE RESULTADOS Y FEEDBACK ---
  if (examenTerminado) {
    const notaFinal = Math.round((respuestasCorrectas / preguntas.length) * 100);
    return (
      <div className="min-h-screen bg-brand-bg p-4 pb-10">
        <div className="w-full max-w-md mx-auto">
          
          {/* Tarjeta Superior de Calificación */}
          <div className="bg-brand-surface rounded-2xl shadow-sm p-8 border border-brand-border text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark mb-2">Simulacro Finalizado</h1>
            <div className="inline-block bg-slate-50 border border-brand-border rounded-full p-8 mb-6 mt-4">
              <span className={`text-5xl font-black ${notaFinal >= 51 ? 'text-emerald-600' : 'text-red-500'}`}>
                {notaFinal}%
              </span>
            </div>
            <div className="space-y-2 text-sm text-brand-text">
              <p>Acertaste <strong className="text-brand-dark">{respuestasCorrectas} de {preguntas.length}</strong> preguntas</p>
            </div>
          </div>

          {/* Módulo de Revisión y Retroalimentación */}
          <h2 className="text-lg font-bold text-brand-dark mb-4 px-1">Revisión del Examen</h2>
          <div className="space-y-4 mb-8">
            {preguntas.map((preg, i) => {
              const miRespuesta = respuestasUsuario[i];
              const esCorrecta = miRespuesta === preg.correctOption;
              const opciones = Array.isArray(preg.options) ? preg.options : JSON.parse(preg.options as string);

              return (
                <div key={preg.id} className={`p-5 rounded-2xl border shadow-sm ${esCorrecta ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
                  
                  {/* Etiqueta de Correcto/Incorrecto */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${esCorrecta ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                      {esCorrecta ? 'Correcto' : 'Incorrecto'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Pregunta {i + 1}</span>
                  </div>

                  <p className="font-semibold text-brand-dark text-sm mb-4 leading-relaxed">{preg.text}</p>
                  
                  <div className="text-xs space-y-2 mb-4 bg-white/60 p-3 rounded-lg border border-slate-100">
                    <p>
                      <span className="text-slate-500 block mb-0.5">Marcaste:</span>
                      <span className={`font-medium ${esCorrecta ? 'text-emerald-700' : 'text-red-600'}`}>
                        {miRespuesta !== null ? opciones[parseInt(miRespuesta)] : "No respondida"}
                      </span>
                    </p>
                    {!esCorrecta && (
                      <p className="pt-1 border-t border-slate-100/50">
                        <span className="text-slate-500 block mb-0.5">La respuesta correcta era:</span>
                        <span className="font-medium text-emerald-700">
                          {opciones[parseInt(preg.correctOption)]}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* La justificación legal / Feedback */}
                  {preg.feedback && (
                    <div className="bg-white p-4 rounded-xl text-xs text-slate-600 border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
                      <strong className="text-brand-dark mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Justificación de la Norma
                      </strong>
                      <span className="leading-relaxed">{preg.feedback}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Link href="/dashboard" className="w-full bg-brand-dark hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl block text-center transition-colors shadow-md">
            Volver a mi Panel
          </Link>
          
        </div>
      </div>
    );
  }

  // --- PANTALLA DEL EXAMEN ACTIVO ---
  const pregunta = preguntas[preguntaActual];
  const opciones: string[] = Array.isArray(pregunta.options) ? pregunta.options : JSON.parse(pregunta.options as string);

  return (
    <div className="min-h-screen bg-brand-bg p-4 pb-20 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full">
        <div className="flex justify-between items-center bg-brand-surface border border-brand-border p-4 rounded-xl shadow-sm mb-6 mt-2">
          <span className="text-xs font-bold text-brand-text">
            Pregunta {preguntaActual + 1} de {preguntas.length}
          </span>
          <div className="flex items-center text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatearTiempo(tiempoRestante)}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm mb-5">
          <h2 className="text-base font-bold text-brand-dark leading-relaxed">
            {pregunta.text}
          </h2>
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
          {guardando ? "Guardando nota..." : (preguntaActual + 1 === preguntas.length ? "Finalizar Examen" : "Siguiente Pregunta")}
        </button>
      </div>
    </div>
  );
}