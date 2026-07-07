import Link from 'next/link';
import { registrarUsuario } from '../../actions/auth';

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-border p-8 transition-all">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Crear Cuenta</h1>
          <p className="text-brand-text text-sm mt-2 font-medium">
            Simulador de Examen de Ascenso 2026
          </p>
        </div>

        {/* Aquí conectamos el formulario con nuestro Server Action */}
        <form action={registrarUsuario} className="space-y-5">
          
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              Nombre Completo
            </label>
            <input 
              type="text" 
              name="nombre" /* <-- Identificador para el servidor */
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              name="email" /* <-- Identificador para el servidor */
              placeholder="juan@ejemplo.com"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              ¿A qué convocatoria postulas?
            </label>
            <select 
              name="categoria" /* <-- Identificador para el servidor */
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all appearance-none" 
              required
            >
              <option value="">Selecciona tu área...</option>
              <option value="institutos-docente">Institutos Técnicos - Docente</option>
              <option value="institutos-admin">Institutos Técnicos - Administrativo</option>
              <option value="regular-maestro">Educación Regular - Maestro</option>
              <option value="regular-admin">Educación Regular - Administrativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              Contraseña
            </label>
            <input 
              type="password" 
              name="password" /* <-- Identificador para el servidor */
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-dark outline-none transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-brand-primary/20 mt-6 cursor-pointer"
          >
            Registrarme y Continuar
          </button>
        </form>

        <p className="text-center text-sm text-brand-text mt-8">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-brand-primary hover:text-brand-primaryHover font-semibold transition-colors">
            Inicia sesión aquí
          </Link>
        </p>

      </div>
    </div>
  );
}