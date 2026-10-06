import { redirect } from 'next/navigation'
import { requerirUsuario } from '@/lib/auth/guards'

// Por ahora la pantalla de inicio del panel es la lista de pedidos.
export default async function PanelInicio() {
  await requerirUsuario()
  redirect('/admin/pedidos')
}
