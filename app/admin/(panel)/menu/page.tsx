import { requerirDueno } from '@/lib/auth/guards'
import { leerAjustes, listarMenuCompleto } from '@/lib/menu/admin-queries'
import { AjustesLocal } from './ajustes-local'
import { ListaMenu } from './lista-menu'

export default async function MenuAdminPage() {
  await requerirDueno()
  const [menu, ajustes] = await Promise.all([listarMenuCompleto(), leerAjustes()])

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl">Menú</h1>
        <p className="text-sm text-pancho-muted">
          Cambiá productos, precios, categorías e imágenes. Lo que desactivás deja de verse en la carta, pero no se
          borra: los pedidos viejos conservan sus precios.
        </p>
      </header>

      <AjustesLocal descuentoPorcentaje={ajustes.descuentoPorcentaje} corteHora={ajustes.corteHora} />
      <ListaMenu menu={menu} />
    </section>
  )
}
