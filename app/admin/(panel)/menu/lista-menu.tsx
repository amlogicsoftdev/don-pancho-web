'use client'

import { Menu, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  alternarCategoria,
  alternarProductos,
  borrarCategoria,
  borrarProductos,
  crearCategoria,
  ordenarCategorias,
  ordenarProductos,
  renombrarCategoria,
  type ResultadoAccion,
} from '@/lib/menu/actions'
import { agruparVariantes, etiquetaTamano, type GrupoMenu } from '@/lib/menu/variantes'
import { formatearPrecio } from '@/lib/orders/estados'
import { useOrdenable } from './use-ordenable'

interface Producto {
  id: number
  nombre: string
  precio: number
  activo: boolean
  etiqueta: string | null
}

interface Categoria {
  id: number
  nombre: string
  activa: boolean
  productos: Producto[]
}

/** Producto listo para agrupar: las variantes de una hamburguesa (x1, x2, con panceta) son un solo plato. */
type ProductoAgrupable = Producto & { name: string; category: string }
type Plato = GrupoMenu<ProductoAgrupable>

/** "Simple $11.500 · Doble $15.800 · con panceta": resumen de precios de un plato con variantes. */
function resumenPrecios(plato: Plato) {
  const comunes = plato.variantes.filter((v) => !v.conPanceta)
  const partes = comunes.map((v) =>
    v.tamano === null ? formatearPrecio(v.product.precio) : `${etiquetaTamano(v.tamano)} ${formatearPrecio(v.product.precio)}`,
  )
  if (plato.variantes.some((v) => v.conPanceta)) partes.push(comunes.length ? 'con panceta' : 'solo con panceta')
  return partes.join(' · ')
}

type Ejecutar = (accion: () => Promise<ResultadoAccion>, alTerminar?: () => void) => void
type GuardarOrden = (accion: () => Promise<ResultadoAccion>) => Promise<boolean>

export function ListaMenu({ menu }: { menu: Categoria[] }) {
  const [error, setError] = useState<string | null>(null)
  const [enCurso, iniciar] = useTransition()
  const [nueva, setNueva] = useState('')

  const ejecutar: Ejecutar = (accion, alTerminar) => {
    setError(null)
    iniciar(async () => {
      const resultado = await accion()
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      alTerminar?.()
    })
  }

  // El orden se guarda al soltar: la lista ya se ve en su lugar nuevo mientras tanto
  const guardarOrden: GuardarOrden = async (accion) => {
    setError(null)
    const resultado = await accion()
    if (!resultado.ok) setError(resultado.error)
    return resultado.ok
  }

  const categorias = useOrdenable(
    menu.map((c) => c.id),
    (ids) => guardarOrden(() => ordenarCategorias(ids)),
    enCurso,
  )
  const porId = new Map(menu.map((c) => [c.id, c]))

  return (
    <div className="space-y-6">
      <form
        className="pn-card pn-card--soft flex flex-wrap items-end gap-3 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          ejecutar(() => crearCategoria(nueva), () => setNueva(''))
        }}
      >
        <label className="block">
          <span className="pn-label">Nueva categoría</span>
          <input
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            maxLength={60}
            placeholder="Ej.: Papas"
            className="pn-field w-56"
          />
        </label>
        <Button type="submit" variant="default" disabled={enCurso || nueva.trim() === ''}>
          <Plus strokeWidth={3} />
          Agregar categoría
        </Button>
      </form>

      {error && (
        <p role="alert" className="pn-alert pn-alert--error">
          {error}
        </p>
      )}
      <p role="status" className="sr-only">
        {categorias.anuncio}
      </p>

      {categorias.orden.map((id) => {
        const categoria = porId.get(id)
        if (!categoria) return null
        return (
          <TarjetaCategoria
            key={id}
            categoria={categoria}
            refElemento={categorias.refElemento(id)}
            arrastrando={categorias.arrastrando === id}
            asa={categorias.propsAsa(id, categoria.nombre)}
            enCurso={enCurso}
            ejecutar={ejecutar}
            guardarOrden={guardarOrden}
          />
        )
      })}
    </div>
  )
}

interface TarjetaProps {
  categoria: Categoria
  refElemento: (nodo: HTMLElement | null) => void
  arrastrando: boolean
  asa: ReturnType<ReturnType<typeof useOrdenable>['propsAsa']>
  enCurso: boolean
  ejecutar: Ejecutar
  guardarOrden: GuardarOrden
}

function TarjetaCategoria({ categoria, refElemento, arrastrando, asa, enCurso, ejecutar, guardarOrden }: TarjetaProps) {
  const [editando, setEditando] = useState<string | null>(null)
  // Plato al que se le tocó el tacho: pide confirmar antes de borrar
  const [aBorrar, setABorrar] = useState<number | null>(null)
  const [borrandoCategoria, setBorrandoCategoria] = useState(false)
  // Cada hamburguesa con sus tamaños y su versión con panceta es un solo renglón. Se identifica por
  // el id de su primera variante; al ordenar se mueven todas juntas.
  const platos = agruparVariantes<ProductoAgrupable>(
    categoria.productos.map((p) => ({ ...p, name: p.nombre, category: String(categoria.id) })),
  )
  const idDe = (plato: Plato) => plato.variantes[0].product.id
  const idsDe = (plato: Plato) => plato.variantes.map((v) => v.product.id)
  const porId = new Map(platos.map((plato) => [idDe(plato), plato]))
  const productos = useOrdenable(
    platos.map(idDe),
    (orden) =>
      guardarOrden(() =>
        ordenarProductos(
          categoria.id,
          orden.flatMap((id) => (porId.get(id) ? idsDe(porId.get(id)!) : [])),
        ),
      ),
    enCurso,
  )

  return (
    <article ref={refElemento} className="pn-card pn-ordenable p-5 sm:p-6" data-arrastrando={arrastrando}>
      {/* Nombre de la categoría a la izquierda; a la derecha, las acciones y la manija para moverla */}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {editando !== null ? (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              ejecutar(() => renombrarCategoria(categoria.id, editando), () => setEditando(null))
            }}
          >
            <input
              value={editando}
              onChange={(e) => setEditando(e.target.value)}
              maxLength={60}
              autoFocus
              aria-label="Nombre de la categoría"
              className="pn-field w-56"
            />
            <Button type="submit" variant="default" disabled={enCurso}>
              Guardar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
          </form>
        ) : (
          <h2 className={`flex flex-wrap items-center gap-3 text-3xl leading-none ${categoria.activa ? '' : 'text-pancho-black/50'}`}>
            {categoria.nombre}
            {!categoria.activa && <span className="pn-tag font-sans">Oculta</span>}
          </h2>
        )}

        {borrandoCategoria ? (
          <div role="group" aria-label={`Confirmar borrado de ${categoria.nombre}`} className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">
              ¿Borrar «{categoria.nombre}»
              {categoria.productos.length > 0 &&
                ` y ${platos.length === 1 ? 'su producto' : `sus ${platos.length} productos`}`}
              ?
            </span>
            <Button
              size="sm"
              variant="destructive"
              disabled={enCurso}
              onClick={() => ejecutar(() => borrarCategoria(categoria.id))}
            >
              <Trash2 />
              Borrar todo
            </Button>
            <Button size="sm" variant="ghost" disabled={enCurso} onClick={() => setBorrandoCategoria(false)}>
              No
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={enCurso} onClick={() => setEditando(categoria.nombre)}>
              Renombrar
            </Button>
            <Button
              size="sm"
              disabled={enCurso}
              onClick={() => ejecutar(() => alternarCategoria(categoria.id, !categoria.activa))}
            >
              {categoria.activa ? 'Ocultar' : 'Mostrar'}
            </Button>
            <Link
              href={`/admin/menu/productos/nuevo?categoria=${categoria.id}`}
              className={buttonVariants({ variant: 'default', size: 'sm' })}
            >
              <Plus strokeWidth={3} />
              Producto
            </Link>
            <Button
              size="icon-sm"
              variant="destructive"
              disabled={enCurso}
              onClick={() => setBorrandoCategoria(true)}
              aria-label={`Borrar la categoría ${categoria.nombre}`}
              title="Borrar categoría"
            >
              <Trash2 />
            </Button>
            <button {...asa}>
              <Menu className="size-5" strokeWidth={2.75} aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      <p role="status" className="sr-only">
        {productos.anuncio}
      </p>
      {categoria.productos.length === 0 ? (
        <p className="pn-muted mt-4 text-sm font-semibold">Esta categoría todavía no tiene productos.</p>
      ) : (
        <ul className="pn-rows mt-4">
          {productos.orden.map((id) => {
            const plato = porId.get(id)
            if (!plato) return null
            const unico = plato.variantes[0].product
            // Un plato con tamaños o panceta se edita entero; un producto suelto, con su formulario de siempre
            const conVariantes = plato.variantes.length > 1 || plato.variantes[0].tamano !== null
            const nombre = conVariantes ? plato.nombre : unico.nombre
            const activo = plato.variantes.some((v) => v.product.activo)
            const etiqueta = plato.variantes.find((v) => v.product.etiqueta)?.product.etiqueta
            return (
              <li
                key={id}
                ref={productos.refElemento(id)}
                className="pn-ordenable flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
                data-arrastrando={productos.arrastrando === id}
              >
                <div className={`min-w-0 ${activo ? '' : 'opacity-55'}`}>
                  <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base leading-snug font-bold">
                    <span className="truncate">{nombre}</span>
                    {etiqueta && (
                      <span className="pn-tag" data-estado="pendiente">
                        {etiqueta}
                      </span>
                    )}
                    {!activo && <span className="pn-tag">De baja</span>}
                  </p>
                  <p className="pn-muted text-sm font-semibold tabular-nums">
                    {conVariantes ? resumenPrecios(plato) : formatearPrecio(unico.precio)}
                  </p>
                </div>
                {aBorrar === id ? (
                  <div role="group" aria-label={`Confirmar borrado de ${nombre}`} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">¿Borrar {conVariantes ? 'el plato y sus variantes' : 'el producto'}?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={enCurso}
                      onClick={() => ejecutar(() => borrarProductos(idsDe(plato)), () => setABorrar(null))}
                    >
                      <Trash2 />
                      Borrar
                    </Button>
                    <Button size="sm" variant="ghost" disabled={enCurso} onClick={() => setABorrar(null)}>
                      No
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={conVariantes ? `/admin/menu/platos/${id}` : `/admin/menu/productos/${id}`}
                      className={buttonVariants({ size: 'sm' })}
                    >
                      Editar
                    </Link>
                    <Button
                      size="sm"
                      className="w-32"
                      disabled={enCurso}
                      onClick={() => ejecutar(() => alternarProductos(idsDe(plato), !activo))}
                    >
                      {activo ? 'Dar de baja' : 'Dar de alta'}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      disabled={enCurso}
                      onClick={() => setABorrar(id)}
                      aria-label={`Borrar ${nombre}`}
                      title="Borrar"
                    >
                      <Trash2 />
                    </Button>
                    <button {...productos.propsAsa(id, nombre)}>
                      <Menu className="size-5" strokeWidth={2.75} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
