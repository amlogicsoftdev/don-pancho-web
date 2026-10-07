import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { requerirUsuario } from '@/lib/auth/guards'
import { contarPedidosActivos } from '@/lib/orders/queries'
import { LogoutButton } from './logout-button'
import { NavPanel } from './nav-panel'

export const metadata: Metadata = {
  title: 'Panel de administración',
  robots: { index: false, follow: false },
}

// Todo lo que cuelga de este layout exige sesión. Cada página que sea solo del dueño
// además llama a requerirDueno(): el layout no protege a las páginas por sí solo, y ocultar
// un enlace acá es solo comodidad.
//
// La estética del panel (papel crema, hojas blancas, botones) está en app/globals.css,
// bajo «Panel de administración».
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario()
  const { pendientes } = await contarPedidosActivos()
  const esDueno = usuario.rol === 'dueno'

  return (
    <div className="panel">
      {/* Barra fija: marca, secciones y usuario. En pantallas chicas las secciones pasan
          a un segundo renglón que se desliza de costado. */}
      <header className="pn-bar print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5 py-2" aria-label="Panel: ir a los pedidos">
            <Image src="/images/logo-don-pancho.webp" alt="" width={512} height={512} className="size-10" />
            <span className="font-display text-2xl leading-none">Panel</span>
          </Link>

          <div className="ml-auto flex items-center gap-3 xl:order-3">
            <p className="text-right text-xs leading-tight">
              <strong className="block font-bold">{usuario.nombre}</strong>
              <span className="pn-muted">{esDueno ? 'Dueño' : 'Empleado'}</span>
            </p>
            <LogoutButton />
          </div>

          <NavPanel esDueno={esDueno} pendientesIniciales={pendientes} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:p-0">{children}</main>
    </div>
  )
}
