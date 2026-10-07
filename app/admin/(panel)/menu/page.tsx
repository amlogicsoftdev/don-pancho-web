import { requerirDueno } from '@/lib/auth/guards'
import { listarMenuCompleto } from '@/lib/menu/admin-queries'
import { Encabezado } from '../encabezado'
import { ListaMenu } from './lista-menu'

export default async function MenuAdminPage() {
  await requerirDueno()
  const menu = await listarMenuCompleto()

  return (
    <section className="mx-auto max-w-4xl">
      <Encabezado
        titulo="Menú"
        descripcion="Cambiá productos, precios, categorías e imágenes. Lo que desactivás deja de verse en la carta, pero no se borra: los pedidos viejos conservan sus precios."
      />
      <div className="mt-6">
        <ListaMenu menu={menu} />
      </div>
    </section>
  )
}
