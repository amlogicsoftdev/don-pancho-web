import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { obtenerUsuario } from '@/lib/auth/guards'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Ingresar | Panel de administración',
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  // Si ya hay sesión, no tiene sentido mostrar el login.
  if (await obtenerUsuario()) redirect('/admin')

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-cheesy-surface p-6">
        <h1 className="mb-1 text-3xl text-cheesy-yellow">Panel</h1>
        <p className="mb-6 text-sm text-cheesy-muted">Ingresá con tu usuario para administrar el local.</p>
        <LoginForm />
      </div>
    </main>
  )
}
