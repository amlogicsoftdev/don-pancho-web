import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirDueno } from '@/lib/auth/guards'
import { cloudinaryConfigurado } from '@/lib/menu/cloudinary'
import { listarCategorias, obtenerProducto } from '@/lib/menu/admin-queries'
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
    <section className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/menu" className="text-sm text-pancho-muted hover:text-pancho-cream">
        ← Volver al menú
      </Link>
      <h1 className="text-3xl">{esNuevo ? 'Nuevo producto' : 'Editar producto'}</h1>
      {categorias.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-pancho-surface p-4 text-pancho-muted">
          Primero creá una categoría desde el menú.
        </p>
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
