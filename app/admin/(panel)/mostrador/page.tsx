import { requerirUsuario } from '@/lib/auth/guards'
import { listarMenuActivo } from '@/lib/orders/queries'
import { VentaMostrador } from './venta-mostrador'

export default async function MostradorPage() {
  await requerirUsuario()
  const menu = await listarMenuActivo()

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-3xl">Venta de mostrador</h1>
      <p className="mb-4 text-sm text-pancho-muted">
        Cargá lo que se vende en el local. Queda como entregado y cobrado, y suma a las ventas y al cierre de caja.
      </p>
      <VentaMostrador menu={menu} />
    </section>
  )
}
