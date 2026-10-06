'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
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

const BOTON = 'h-8 px-2.5 text-xs'

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
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {menu.map((categoria, i) => (
        <article key={categoria.id} className={`rounded-xl border border-white/10 bg-pancho-surface p-4 ${categoria.activa ? '' : 'opacity-70'}`}>
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {editando?.id === categoria.id ? (
              <form
                className="flex items-center gap-2"
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
                  className="h-8 rounded-lg border border-white/15 bg-pancho-black px-2 text-sm outline-none focus:border-pancho-orange"
                />
                <Button type="submit" size="sm" className={`${BOTON} bg-pancho-orange text-pancho-black`} disabled={enCurso}>
                  Guardar
                </Button>
                <Button type="button" size="sm" variant="ghost" className={BOTON} onClick={() => setEditando(null)}>
                  Cancelar
                </Button>
              </form>
            ) : (
              <h2 className="flex items-center gap-2 text-xl">
                {categoria.nombre}
                {!categoria.activa && <span className="rounded-full bg-white/10 px-2 py-0.5 font-sans text-xs">Oculta</span>}
              </h2>
            )}

            <div className="flex flex-wrap gap-1.5">
              <Button variant="outline" size="sm" className={BOTON} disabled={enCurso || i === 0} onClick={() => ejecutar(() => moverCategoria(categoria.id, 'arriba'))} aria-label={`Subir ${categoria.nombre}`}>
                ↑
              </Button>
              <Button variant="outline" size="sm" className={BOTON} disabled={enCurso || i === menu.length - 1} onClick={() => ejecutar(() => moverCategoria(categoria.id, 'abajo'))} aria-label={`Bajar ${categoria.nombre}`}>
                ↓
              </Button>
              <Button variant="outline" size="sm" className={BOTON} disabled={enCurso} onClick={() => setEditando({ id: categoria.id, nombre: categoria.nombre })}>
                Renombrar
              </Button>
              <Button variant="outline" size="sm" className={BOTON} disabled={enCurso} onClick={() => ejecutar(() => alternarCategoria(categoria.id, !categoria.activa))}>
                {categoria.activa ? 'Ocultar' : 'Mostrar'}
              </Button>
              <Link
                href={`/admin/menu/productos/nuevo?categoria=${categoria.id}`}
                className="inline-flex h-8 items-center rounded-lg bg-pancho-orange px-2.5 text-xs font-semibold text-pancho-black hover:bg-pancho-orange-deep"
              >
                + Producto
              </Link>
            </div>
          </header>

          {categoria.productos.length === 0 ? (
            <p className="text-sm text-pancho-muted">Esta categoría todavía no tiene productos.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {categoria.productos.map((p, j) => (
                <li key={p.id} className={`flex flex-wrap items-center justify-between gap-2 py-2 ${p.activo ? '' : 'opacity-60'}`}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {p.nombre}
                      {p.etiqueta && <span className="ml-2 rounded-full bg-pancho-orange/20 px-2 py-0.5 text-xs text-pancho-orange">{p.etiqueta}</span>}
                      {!p.activo && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">Inactivo</span>}
                    </p>
                    <p className="text-sm text-pancho-muted">{formatearPrecio(p.precio)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" className={BOTON} disabled={enCurso || j === 0} onClick={() => ejecutar(() => moverProducto(p.id, 'arriba'))} aria-label={`Subir ${p.nombre}`}>
                      ↑
                    </Button>
                    <Button variant="outline" size="sm" className={BOTON} disabled={enCurso || j === categoria.productos.length - 1} onClick={() => ejecutar(() => moverProducto(p.id, 'abajo'))} aria-label={`Bajar ${p.nombre}`}>
                      ↓
                    </Button>
                    <Link href={`/admin/menu/productos/${p.id}`} className="inline-flex h-8 items-center rounded-lg border border-white/20 px-2.5 text-xs font-semibold hover:bg-white/5">
                      Editar
                    </Link>
                    <Button variant="outline" size="sm" className={BOTON} disabled={enCurso} onClick={() => ejecutar(() => alternarProducto(p.id, !p.activo))}>
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
        className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-white/20 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          ejecutar(() => crearCategoria(nueva), () => setNueva(''))
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block text-pancho-muted">Nueva categoría</span>
          <input
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            maxLength={60}
            placeholder="Ej.: Papas"
            className="h-9 w-56 rounded-lg border border-white/15 bg-pancho-black px-2 outline-none focus:border-pancho-orange"
          />
        </label>
        <Button type="submit" size="lg" disabled={enCurso || nueva.trim() === ''} className="h-9 bg-pancho-orange px-4 text-pancho-black hover:bg-pancho-orange-deep">
          Agregar categoría
        </Button>
      </form>
    </div>
  )
}
