import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirDueno } from '@/lib/auth/guards'
import { cloudinaryConfigurado } from '@/lib/menu/cloudinary'
import { listarCategorias, obtenerProducto } from '@/lib/menu/admin-queries'
import { Encabezado } from '../../../encabezado'
import { FormularioProducto } from './formulario-producto'

export default async function ProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ categoria?: string }>
}) {
  await requerirDueno()
  const { id: idCrudo } = await params
  const { categoria } = await searchParams

  const categorias = await listarCategorias()
  const esNuevo = idCrudo === 'nuevo'

  let producto = null
  if (!esNuevo) {
    const id = Number(idCrudo)
    if (!Number.isInteger(id) || id <= 0) notFound()
    producto = await obtenerProducto(id)
    if (!producto) notFound()
  }

  const categoriaInicial = esNuevo ? Number(categoria) || categorias[0]?.id : producto!.categoriaId

  return (
    <section className="mx-auto max-w-2xl">
      <Link href="/admin/menu" className="pn-back">
        <ArrowLeft className="size-4" />
        Volver al menú
      </Link>
      <div className="mt-2 mb-6">
        <Encabezado titulo={esNuevo ? 'Nuevo producto' : 'Editar producto'} rotulo={producto?.nombre} />
      </div>
      {categorias.length === 0 ? (
        <p className="pn-alert pn-alert--warn">Primero creá una categoría desde el menú.</p>
      ) : (
        <FormularioProducto
          categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
          cloudinaryListo={cloudinaryConfigurado()}
          inicial={{
            id: producto?.id ?? null,
            categoriaId: categoriaInicial,
            nombre: producto?.nombre ?? '',
            descripcion: producto?.descripcion ?? '',
            precio: producto?.precio ?? 0,
            etiqueta: producto?.etiqueta ?? '',
            imagenUrl: producto?.imagenUrl ?? '',
            activo: producto?.activo ?? true,
          }}
        />
      )}
    </section>
  )
}
