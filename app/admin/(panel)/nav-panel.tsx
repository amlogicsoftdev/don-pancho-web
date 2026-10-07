'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AvisoPedidos } from './aviso-pedidos'

const SECCIONES = [
  { href: '/admin/pedidos', titulo: 'Pedidos', soloDueno: false },
  { href: '/admin/mostrador', titulo: 'Mostrador', soloDueno: false },
  { href: '/admin/caja', titulo: 'Caja', soloDueno: false },
  { href: '/admin/ventas', titulo: 'Ventas', soloDueno: true },
  { href: '/admin/menu', titulo: 'Menú', soloDueno: true },
  { href: '/admin/gastos', titulo: 'Gastos', soloDueno: true },
  { href: '/admin/anulaciones', titulo: 'Cancelados', soloDueno: true },
  { href: '/admin/ajustes', titulo: 'Ajustes', soloDueno: true },
]

interface Props {
  esDueno: boolean
  pendientesIniciales: number
}

/**
 * Secciones del panel. La sección en la que se está queda marcada con un bloque negro.
 * Esconder las del dueño es solo comodidad: cada página vuelve a verificar el rol.
 */
export function NavPanel({ esDueno, pendientesIniciales }: Props) {
  const pathname = usePathname()
  const estaEn = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav
      aria-label="Secciones del panel"
      className="order-last -mx-4 flex w-[calc(100%+2rem)] overflow-x-auto border-t border-pancho-black/15 px-4 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 xl:order-2 xl:mx-0 xl:w-auto xl:border-t-0 xl:px-0"
    >
      {SECCIONES.filter((seccion) => esDueno || !seccion.soloDueno).map((seccion) =>
        seccion.href === '/admin/pedidos' ? (
          <AvisoPedidos key={seccion.href} pendientesIniciales={pendientesIniciales} activo={estaEn(seccion.href)} />
        ) : (
          <Link
            key={seccion.href}
            href={seccion.href}
            className="pn-nav-link"
            aria-current={estaEn(seccion.href) ? 'page' : undefined}
          >
            {seccion.titulo}
          </Link>
        ),
      )}
    </nav>
  )
}
