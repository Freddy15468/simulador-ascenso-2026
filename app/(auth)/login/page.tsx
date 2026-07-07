"use client";

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Ejecutamos el inicio de sesión con NextAuth
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Correo o contraseña incorrectos");
      setCargando(false);
    } else {
      // Si el login es exitoso, lo enviamos a su panel de estudiante
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-border p-8 transition-all">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Bienvenido</h1>
          <p className="text-brand-text text-sm mt-2 font-medium">
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              name="email"
              placeholder="juan@ejemplo.com"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              Contraseña
            </label>
            <input 
              type="password" 
              name="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all"
              required
            />
          </div>

          {/* Mensaje de error si la contraseña está mal */}
          {error && (
            <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-brand-primary/20 mt-6 cursor-pointer disabled:opacity-70"
          >
            {cargando ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="text-center text-sm text-brand-text mt-8">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/registro" className="text-brand-primary hover:text-brand-primaryHover font-semibold transition-colors">
            Regístrate aquí
          </Link>
        </p>

      </div>
    </div>
  );
}