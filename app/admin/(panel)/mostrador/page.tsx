import { requerirUsuario } from '@/lib/auth/guards'
import { listarMenuActivo } from '@/lib/orders/queries'
import { Encabezado } from '../encabezado'
import { VentaMostrador } from './venta-mostrador'

export default async function MostradorPage() {
  await requerirUsuario()
  const menu = await listarMenuActivo()

  return (
    <section className="mx-auto max-w-5xl">
      <Encabezado
        titulo="Venta de mostrador"
        descripcion="Cargá lo que se vende en el local. Queda como entregado y cobrado, y suma a las ventas y al cierre de caja."
      />
      <VentaMostrador menu={menu} />
    </section>
  )
}
