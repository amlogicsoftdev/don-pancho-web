'use client'

import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  alternarCategoria,
  alternarProducto,
  crearCategoria,
  moverCategoria,
  moverProducto,
  renombrarCategoria,
  type ResultadoAccion,
} from '@/lib/menu/actions'
import { formatearPrecio } from '@/lib/orders/estados'

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

export function ListaMenu({ menu }: { menu: Categoria[] }) {
  const [error, setError] = useState<string | null>(null)
  const [enCurso, iniciar] = useTransition()
  const [nueva, setNueva] = useState('')
  const [editando, setEditando] = useState<{ id: number; nombre: string } | null>(null)

  function ejecutar(accion: () => Promise<ResultadoAccion>, alTerminar?: () => void) {
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

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="pn-alert pn-alert--error">
          {error}
        </p>
      )}

      {menu.map((categoria, i) => (
        <article key={categoria.id} className="pn-card p-5 sm:p-6">
          {/* Nombre de la categoría a la izquierda; a la derecha, primero el orden y después el resto */}
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            {editando?.id === categoria.id ? (
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  ejecutar(() => renombrarCategoria(categoria.id, editando.nombre), () => setEditando(null))
                }}
              >
                <input
                  value={editando.nombre}
                  onChange={(e) => setEditando({ id: categoria.id, nombre: e.target.value })}
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
              <div className="flex gap-1.5">
                <Button
                  size="icon-sm"
                  disabled={enCurso || i === 0}
                  onClick={() => ejecutar(() => moverCategoria(categoria.id, 'arriba'))}
                  aria-label={`Subir ${categoria.nombre}`}
                >
                  <ChevronUp strokeWidth={3} />
                </Button>
                <Button
                  size="icon-sm"
                  disabled={enCurso || i === menu.length - 1}
                  onClick={() => ejecutar(() => moverCategoria(categoria.id, 'abajo'))}
                  aria-label={`Bajar ${categoria.nombre}`}
                >
                  <ChevronDown strokeWidth={3} />
                </Button>
              </div>
              <Button
                size="sm"
                disabled={enCurso}
                onClick={() => setEditando({ id: categoria.id, nombre: categoria.nombre })}
              >
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
            </div>
          </header>

          {categoria.productos.length === 0 ? (
            <p className="pn-muted mt-4 text-sm font-semibold">Esta categoría todavía no tiene productos.</p>
          ) : (
            <ul className="pn-rows mt-4">
              {categoria.productos.map((p, j) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                  <div className={`min-w-0 ${p.activo ? '' : 'opacity-55'}`}>
                    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base leading-snug font-bold">
                      <span className="truncate">{p.nombre}</span>
                      {p.etiqueta && (
                        <span className="pn-tag" data-estado="pendiente">
                          {p.etiqueta}
                        </span>
                      )}
                      {!p.activo && <span className="pn-tag">Inactivo</span>}
                    </p>
                    <p className="pn-muted text-sm font-semibold tabular-nums">{formatearPrecio(p.precio)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1.5">
                      <Button
                        size="icon-sm"
                        disabled={enCurso || j === 0}
                        onClick={() => ejecutar(() => moverProducto(p.id, 'arriba'))}
                        aria-label={`Subir ${p.nombre}`}
                      >
                        <ChevronUp strokeWidth={3} />
                      </Button>
                      <Button
                        size="icon-sm"
                        disabled={enCurso || j === categoria.productos.length - 1}
                        onClick={() => ejecutar(() => moverProducto(p.id, 'abajo'))}
                        aria-label={`Bajar ${p.nombre}`}
                      >
                        <ChevronDown strokeWidth={3} />
                      </Button>
                    </div>
                    <Link href={`/admin/menu/productos/${p.id}`} className={buttonVariants({ size: 'sm' })}>
                      Editar
                    </Link>
                    <Button
                      size="sm"
                      className="w-28"
                      disabled={enCurso}
                      onClick={() => ejecutar(() => alternarProducto(p.id, !p.activo))}
                    >
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}

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
    </div>
  )
}
