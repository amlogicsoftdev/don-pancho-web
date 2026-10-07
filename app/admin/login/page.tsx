import type { Metadata } from 'next'
import Image from 'next/image'
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
    <main className="panel flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* El sello del local asoma por arriba de la hoja, como pegado */}
        <Image
          src="/images/logo-don-pancho.webp"
          alt="Don Pancho & Burger"
          width={512}
          height={512}
          priority
          className="relative z-10 mx-auto -mb-10 size-24"
        />
        <div className="pn-card px-6 pt-14 pb-7 sm:px-8">
          <p className="text-center">
            <span className="pn-sticker">Solo personal del local</span>
          </p>
          <h1 className="mt-3 text-center text-6xl leading-none">Panel</h1>
          <p className="pn-muted mt-2 mb-7 text-center text-sm font-medium">Ingresá con tu usuario para administrar el local.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
