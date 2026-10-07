'use client'

import { Menu, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  alternarCategoria,
  alternarProducto,
  crearCategoria,
  ordenarCategorias,
  ordenarProductos,
  renombrarCategoria,
  type ResultadoAccion,
} from '@/lib/menu/actions'
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
  const productos = useOrdenable(
    categoria.productos.map((p) => p.id),
    (ids) => guardarOrden(() => ordenarProductos(categoria.id, ids)),
    enCurso,
  )
  const porId = new Map(categoria.productos.map((p) => [p.id, p]))

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
          <button {...asa}>
            <Menu className="size-5" strokeWidth={2.75} aria-hidden="true" />
          </button>
        </div>
      </header>

      <p role="status" className="sr-only">
        {productos.anuncio}
      </p>
      {categoria.productos.length === 0 ? (
        <p className="pn-muted mt-4 text-sm font-semibold">Esta categoría todavía no tiene productos.</p>
      ) : (
        <ul className="pn-rows mt-4">
          {productos.orden.map((id) => {
            const p = porId.get(id)
            if (!p) return null
            return (
              <li
                key={p.id}
                ref={productos.refElemento(p.id)}
                className="pn-ordenable flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
                data-arrastrando={productos.arrastrando === p.id}
              >
                <div className={`min-w-0 ${p.activo ? '' : 'opacity-55'}`}>
                  <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base leading-snug font-bold">
                    <span className="truncate">{p.nombre}</span>
                    {p.etiqueta && (
                      <span className="pn-tag" data-estado="pendiente">
                        {p.etiqueta}
                      </span>
                    )}
                    {!p.activo && <span className="pn-tag">De baja</span>}
                  </p>
                  <p className="pn-muted text-sm font-semibold tabular-nums">{formatearPrecio(p.precio)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/menu/productos/${p.id}`} className={buttonVariants({ size: 'sm' })}>
                    Editar
                  </Link>
                  <Button
                    size="sm"
                    className="w-32"
                    disabled={enCurso}
                    onClick={() => ejecutar(() => alternarProducto(p.id, !p.activo))}
                  >
                    {p.activo ? 'Dar de baja' : 'Dar de alta'}
                  </Button>
                  <button {...productos.propsAsa(p.id, p.nombre)}>
                    <Menu className="size-5" strokeWidth={2.75} aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
