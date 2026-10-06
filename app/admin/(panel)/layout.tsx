import type { Metadata } from 'next'
import { requerirUsuario } from '@/lib/auth/guards'
import { LogoutButton } from './logout-button'

export const metadata: Metadata = {
  title: 'Panel de administración',
  robots: { index: false, follow: false },
}

// Todo lo que cuelga de este layout exige sesión. Cada página que sea solo del dueño
// además llama a requerirDueno(): el layout no protege a las páginas por sí solo.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario()

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-white/10 bg-pancho-surface px-4 py-3">
        <span className="font-display text-xl text-pancho-orange">Panel</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-pancho-muted">
            {usuario.nombre} · {usuario.rol === 'dueno' ? 'Dueño' : 'Empleado'}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
