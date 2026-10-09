import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirDueno } from '@/lib/auth/guards'
import { cloudinaryConfigurado } from '@/lib/menu/cloudinary'
import { listarCategorias, obtenerPlato } from '@/lib/menu/admin-queries'
import { Encabezado } from '../../../encabezado'
import { FormularioPlato } from './formulario-plato'

/** Edición de un plato con variantes (tamaños y panceta) en un solo formulario. */
export default async function PlatoPage({ params }: { params: Promise<{ id: string }> }) {
  await requerirDueno()
  const { id: idCrudo } = await params
  const id = Number(idCrudo)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [plato, categorias] = await Promise.all([obtenerPlato(id), listarCategorias()])
  if (!plato) notFound()
  const { grupo } = plato
  const productos = grupo.variantes.map((v) => v.product)
  const tamanos = [...new Set(grupo.variantes.map((v) => v.tamano))]

  return (
    <section className="mx-auto max-w-2xl">
      <Link href="/admin/menu" className="pn-back">
        <ArrowLeft className="size-4" />
        Volver al menú
      </Link>
      <div className="mt-2 mb-6">
        <Encabezado titulo="Editar plato" rotulo={grupo.nombre} />
      </div>
      <FormularioPlato
        categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
        cloudinaryListo={cloudinaryConfigurado()}
        inicial={{
          id,
          nombre: grupo.nombre,
          categoriaId: plato.categoriaId,
          etiqueta: productos.find((p) => p.etiqueta)?.etiqueta ?? '',
          imagenUrl: productos.find((p) => p.imagenUrl)?.imagenUrl ?? '',
          activo: productos.some((p) => p.activo),
          filas: tamanos.map((tamano) => {
            const comun = grupo.variantes.find((v) => v.tamano === tamano && !v.conPanceta)?.product
            const conPanceta = grupo.variantes.find((v) => v.tamano === tamano && v.conPanceta)?.product
            return {
              tamano,
              descripcion: (comun ?? conPanceta)?.descripcion ?? '',
              precio: comun?.precio ?? null,
              precioPanceta: conPanceta?.precio ?? null,
            }
          }),
        }}
      />
    </section>
  )
}
