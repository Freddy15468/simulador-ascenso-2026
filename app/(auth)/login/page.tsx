"use client";

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

const DEVICE_ID_KEY = "simulador_device_id";

function obtenerOCrearDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "cuenta_compartida") {
      setError("Tu cuenta se inició en otro dispositivo. Por seguridad, cerramos esta sesión.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const formData = new FormData(e.currentTarget);
    const cedula = formData.get("cedula") as string;
    const pin = formData.get("pin") as string;
    const deviceId = obtenerOCrearDeviceId();

    const res = await signIn("credentials", {
      cedula,
      pin,
      deviceId,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "dispositivo_no_autorizado") {
        setError(
          "Esta cuenta ya está activada en otro celular. Si cambiaste de dispositivo, pide a un administrador que te lo libere."
        );
      } else if (res.error === "dispositivo_no_detectado") {
        setError("No pudimos verificar tu dispositivo. Intenta de nuevo o usa otro navegador.");
      } else {
        setError("Cédula o PIN incorrectos.");
      }
      setCargando(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-border p-8 transition-all">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Bienvenido</h1>
          <p className="text-brand-text text-sm mt-2 font-medium">
            Ingresa con tu cédula para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

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
              PIN
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
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg leading-relaxed">
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}