import type { Metadata } from 'next'
import { requerirUsuario } from '@/lib/auth/guards'
import { contarPedidosActivos } from '@/lib/orders/queries'
import { AvisoPedidos } from './aviso-pedidos'
import { LogoutButton } from './logout-button'

export const metadata: Metadata = {
  title: 'Panel de administración',
  robots: { index: false, follow: false },
}

// Todo lo que cuelga de este layout exige sesión. Cada página que sea solo del dueño
// además llama a requerirDueno(): el layout no protege a las páginas por sí solo.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario()
  const { pendientes } = await contarPedidosActivos()

  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-pancho-surface px-4 py-3 print:hidden">
        <div className="flex items-center gap-4">
          <span className="font-display text-xl text-pancho-orange">Panel</span>
          <nav className="flex items-center gap-1">
            <AvisoPedidos pendientesIniciales={pendientes} />
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-pancho-muted">
            {usuario.nombre} · {usuario.rol === 'dueno' ? 'Dueño' : 'Empleado'}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-4 print:p-0">{children}</main>
    </div>
  )
}
