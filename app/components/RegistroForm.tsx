"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registrarUsuario } from "../actions/auth";

type Categoria = { id: string; name: string };

export default function RegistroForm({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const formData = new FormData(e.currentTarget);
    const resultado = await registrarUsuario(formData);

    if (!resultado.ok) {
      setError(resultado.error);
      setCargando(false);
      return;
    }

    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-border p-8 transition-all">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Crear Cuenta</h1>
          <p className="text-brand-text text-sm mt-2 font-medium">
            Simulador de Examen de Ascenso 2026
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              Nombre Completo
            </label>
            <input
              type="text"
              name="nombre"
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              Número de Cédula
            </label>
            <input
              type="text"
              name="cedula"
              inputMode="numeric"
              placeholder="Ej: 8523147"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              ¿A qué convocatoria postulas?
            </label>
            <select
              name="categoria"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all appearance-none"
              required
              defaultValue=""
            >
              <option value="" disabled>Selecciona tu área...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              Crea un PIN (4 a 6 dígitos)
            </label>
            <input
              type="password"
              name="pin"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all tracking-widest"
              required
            />
            <p className="text-xs text-brand-text mt-1.5">Úsalo para iniciar sesión junto a tu cédula.</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2.5 px-3 rounded-lg leading-relaxed">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-brand-primary/20 mt-6 cursor-pointer disabled:opacity-70"
          >
            {cargando ? "Creando cuenta..." : "Registrarme y Continuar"}
          </button>
        </form>

        <p className="text-center text-sm text-brand-text mt-8">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand-primary hover:text-brand-primaryHover font-semibold transition-colors">
            Inicia sesión aquí
          </Link>
        </p>

      </div>
    </div>
  );
}