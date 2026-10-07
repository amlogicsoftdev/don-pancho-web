import type { Metadata } from 'next'
import Link from 'next/link'
import { requerirUsuario } from '@/lib/auth/guards'
import { contarPedidosActivos } from '@/lib/orders/queries'
import { AvisoPedidos } from './aviso-pedidos'
import { LogoutButton } from './logout-button'

export const metadata: Metadata = {
  title: 'Panel de administración',
  robots: { index: false, follow: false },
}

const ENLACE = 'rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/5'

// Todo lo que cuelga de este layout exige sesión. Cada página que sea solo del dueño
// además llama a requerirDueno(): el layout no protege a las páginas por sí solo, y ocultar
// un enlace acá es solo comodidad.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario()
  const { pendientes } = await contarPedidosActivos()
  const esDueno = usuario.rol === 'dueno'

  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-pancho-surface px-4 py-3 print:hidden">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-display text-xl text-pancho-orange">Panel</span>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Secciones del panel">
            <AvisoPedidos pendientesIniciales={pendientes} />
            <Link href="/admin/mostrador" className={ENLACE}>
              Mostrador
            </Link>
            <Link href="/admin/caja" className={ENLACE}>
              Caja
            </Link>
            {esDueno && (
              <>
                <Link href="/admin/ventas" className={ENLACE}>
                  Ventas
                </Link>
                <Link href="/admin/menu" className={ENLACE}>
                  Menú
                </Link>
                <Link href="/admin/gastos" className={ENLACE}>
                  Gastos
                </Link>
                <Link href="/admin/anulaciones" className={ENLACE}>
                  Anulaciones
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-pancho-muted">
            {usuario.nombre} · {esDueno ? 'Dueño' : 'Empleado'}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-4 print:p-0">{children}</main>
    </div>
  )
}
