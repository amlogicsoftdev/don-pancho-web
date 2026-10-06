import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { auth } from '@/lib/auth'

// Guardas de sesión y de rol. Se verifican SIEMPRE en el servidor: ocultar botones o
// redirigir desde el proxy no alcanza como seguridad (CLAUDE.md, sección 5).

export type Rol = 'dueno' | 'empleado'

export interface UsuarioPanel {
  id: string
  nombre: string
  email: string
  rol: Rol
}

const ROLES: readonly Rol[] = ['dueno', 'empleado']

// Se memoriza por request: layout, página y acciones comparten una sola consulta.
export const obtenerUsuario = cache(async (): Promise<UsuarioPanel | null> => {
  const sesion = await auth.api.getSession({ headers: await headers() })
  if (!sesion) return null

  const { user } = sesion
  const rol = user.rol as Rol
  // Defensa extra: un usuario desactivado o con un rol desconocido no entra.
  if (!user.activo || !ROLES.includes(rol)) return null

  return { id: user.id, nombre: user.name, email: user.email, rol }
})

/**
 * Para páginas, layouts y Server Actions. Sin sesión redirige al login;
 * con un rol no permitido vuelve al inicio del panel.
 */
export async function requerirUsuario(rolesPermitidos?: readonly Rol[]): Promise<UsuarioPanel> {
  const usuario = await obtenerUsuario()
  if (!usuario) redirect('/admin/login')
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) redirect('/admin')
  return usuario
}

/** Atajo para las secciones solo del dueño (menú, ventas, gastos, anulaciones). */
export const requerirDueno = () => requerirUsuario(['dueno'])

type ResultadoApi = { usuario: UsuarioPanel; respuesta?: never } | { usuario?: never; respuesta: Response }

/**
 * Para Route Handlers (`app/api/admin/**`). Devuelve el usuario o una respuesta 401/403 lista:
 *
 *   const acceso = await protegerApi(['dueno'])
 *   if (acceso.respuesta) return acceso.respuesta
 */
export async function protegerApi(rolesPermitidos?: readonly Rol[]): Promise<ResultadoApi> {
  const usuario = await obtenerUsuario()
  if (!usuario) {
    return { respuesta: Response.json({ error: 'No autenticado' }, { status: 401 }) }
  }
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return { respuesta: Response.json({ error: 'Sin permiso' }, { status: 403 }) }
  }
  return { usuario }
}
