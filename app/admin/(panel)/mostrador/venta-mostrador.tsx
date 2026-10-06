'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { registrarVentaMostrador } from '@/lib/orders/actions'
import { formatearNumero, formatearPrecio } from '@/lib/orders/estados'

interface Categoria {
  id: number
  nombre: string
  productos: { id: number; nombre: string; precio: number }[]
}

interface Registrada {
  id: number
  numero: number
  total: number
}

// Los precios acá son solo para mostrar el total mientras se arma la venta. El servidor
// vuelve a calcular todo con los precios de la base.
export function VentaMostrador({ menu }: { menu: Categoria[] }) {
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [registrada, setRegistrada] = useState<Registrada | null>(null)
  const [enCurso, iniciar] = useTransition()

  const productos = menu.flatMap((c) => c.productos)
  const lineas = productos.filter((p) => (cantidades[p.id] ?? 0) > 0)
  const total = lineas.reduce((suma, p) => suma + p.precio * cantidades[p.id], 0)

  function cambiar(id: number, delta: number) {
    setCantidades((actual) => {
      const nueva = Math.max(0, Math.min(50, (actual[id] ?? 0) + delta))
      return { ...actual, [id]: nueva }
    })
  }

  function limpiar() {
    setCantidades({})
    setNombre('')
    setMetodoPago('efectivo')
    setError(null)
  }

  function registrar() {
    setError(null)
    iniciar(async () => {
      const resultado = await registrarVentaMostrador({
        metodoPago,
        clienteNombre: nombre,
        items: lineas.map((p) => ({ productoId: p.id, cantidad: cantidades[p.id] })),
      })
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      setRegistrada({ id: resultado.id, numero: resultado.numero, total: resultado.total })
      limpiar()
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {menu.length === 0 && (
          <p className="rounded-xl border border-white/10 bg-pancho-surface p-4 text-pancho-muted">
            No hay productos activos en el menú.
          </p>
        )}
        {menu.map((categoria) => (
          <div key={categoria.id} className="rounded-xl border border-white/10 bg-pancho-surface p-4">
            <h2 className="mb-2 text-lg">{categoria.nombre}</h2>
            <ul className="divide-y divide-white/10">
              {categoria.productos.map((p) => {
                const cantidad = cantidades[p.id] ?? 0
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate">{p.nombre}</p>
                      <p className="text-sm text-pancho-muted">{formatearPrecio(p.precio)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => cambiar(p.id, -1)}
                        disabled={cantidad === 0}
                        aria-label={`Quitar ${p.nombre}`}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center font-bold">{cantidad}</span>
                      <Button variant="outline" size="icon" onClick={() => cambiar(p.id, 1)} aria-label={`Agregar ${p.nombre}`}>
                        +
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <aside className="h-fit space-y-4 rounded-xl border border-white/10 bg-pancho-surface p-4 lg:sticky lg:top-4">
        <h2 className="text-lg">Venta</h2>

        {registrada && (
          <div role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            <p>
              Venta N° {formatearNumero(registrada.numero)} registrada por {formatearPrecio(registrada.total)}.
            </p>
            <Link href={`/admin/pedidos/${registrada.id}/comandas`} target="_blank" className="font-semibold underline">
              Imprimir comanda
            </Link>
          </div>
        )}

        {lineas.length === 0 ? (
          <p className="text-sm text-pancho-muted">Todavía no agregaste productos.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {lineas.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>
                  {cantidades[p.id]}x {p.nombre}
                </span>
                <span>{formatearPrecio(p.precio * cantidades[p.id])}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
          <span className="text-pancho-muted">Total</span>
          <span className="font-display text-2xl text-pancho-orange">{formatearPrecio(total)}</span>
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Método de pago</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['efectivo', 'transferencia'] as const).map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoPago(metodo)}
                aria-pressed={metodoPago === metodo}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize ${
                  metodoPago === metodo
                    ? 'border-pancho-orange bg-pancho-orange text-pancho-black'
                    : 'border-white/15 text-pancho-muted hover:text-pancho-cream'
                }`}
              >
                {metodo}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Nombre (opcional)</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            className="h-9 w-full rounded-lg border border-white/15 bg-pancho-black px-3 outline-none focus:border-pancho-orange"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}

        <Button
          size="lg"
          disabled={enCurso || lineas.length === 0}
          onClick={registrar}
          className="h-10 w-full bg-pancho-orange text-pancho-black hover:bg-pancho-orange-deep"
        >
          {enCurso ? 'Registrando…' : 'Registrar venta'}
        </Button>
        {lineas.length > 0 && (
          <Button variant="ghost" size="lg" className="h-9 w-full" onClick={limpiar} disabled={enCurso}>
            Vaciar
          </Button>
        )}
      </aside>
    </div>
  )
}
