'use client'

import { Minus, Plus, Printer } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { PanchoButton } from '@/components/pancho-button'
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
    <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* La carta: se suma o se quita con los botones de cada renglón */}
      <div className="space-y-6">
        {menu.length === 0 && <p className="pn-card pn-muted p-6 font-semibold">No hay productos activos en el menú.</p>}
        {menu.map((categoria) => (
          <div key={categoria.id} className="pn-card p-5 sm:p-6">
            <h2 className="text-2xl leading-none">{categoria.nombre}</h2>
            <ul className="pn-rows mt-3">
              {categoria.productos.map((p) => {
                const cantidad = cantidades[p.id] ?? 0
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-base leading-snug font-bold">{p.nombre}</p>
                      <p className="pn-muted text-sm font-semibold tabular-nums">{formatearPrecio(p.precio)}</p>
                    </div>
                    <div className="flex flex-none items-center gap-1.5">
                      <Button
                        size="icon"
                        onClick={() => cambiar(p.id, -1)}
                        disabled={cantidad === 0}
                        aria-label={`Quitar ${p.nombre}`}
                      >
                        <Minus strokeWidth={3} />
                      </Button>
                      <span
                        className={`grid h-11 w-10 place-items-center font-heading text-2xl leading-none tabular-nums ${cantidad > 0 ? 'bg-pancho-black text-white' : ''}`}
                      >
                        {cantidad}
                      </span>
                      <Button size="icon" onClick={() => cambiar(p.id, 1)} aria-label={`Agregar ${p.nombre}`}>
                        <Plus strokeWidth={3} />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* La venta: queda a la vista mientras se recorre la carta */}
      <aside className="pn-card space-y-5 p-5 lg:sticky lg:top-20">
        <h2 className="text-2xl leading-none">Venta</h2>

        {registrada && (
          <div role="status" className="pn-alert pn-alert--ok">
            <p>
              Venta N° {formatearNumero(registrada.numero)} registrada por {formatearPrecio(registrada.total)}.
            </p>
            <Link
              href={`/admin/pedidos/${registrada.id}/comandas`}
              target="_blank"
              className="pn-link mt-1 inline-flex items-center gap-1.5"
            >
              <Printer className="size-4" aria-hidden="true" />
              Imprimir comanda
            </Link>
          </div>
        )}

        {lineas.length === 0 ? (
          <p className="pn-muted text-sm font-semibold">Todavía no agregaste productos.</p>
        ) : (
          <ul className="space-y-1.5 text-sm font-semibold tabular-nums">
            {lineas.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>
                  <strong className="font-extrabold">{cantidades[p.id]}x</strong> {p.nombre}
                </span>
                <span>{formatearPrecio(p.precio * cantidades[p.id])}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-baseline justify-between border-t-2 border-pancho-black pt-3">
          <span className="font-display text-2xl leading-none">Total</span>
          <span className="font-display text-4xl leading-none tabular-nums">{formatearPrecio(total)}</span>
        </div>

        <fieldset>
          <legend className="pn-label">Método de pago</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['efectivo', 'transferencia'] as const).map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoPago(metodo)}
                aria-pressed={metodoPago === metodo}
                className="pn-option"
              >
                {metodo}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="pn-label">Nombre (opcional)</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} className="pn-field" />
        </label>

        {error && (
          <p role="alert" className="pn-alert pn-alert--error">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <PanchoButton block disabled={enCurso || lineas.length === 0} onClick={registrar}>
            {enCurso ? 'Registrando…' : 'Registrar venta'}
          </PanchoButton>
          {lineas.length > 0 && (
            <Button variant="ghost" className="w-full" onClick={limpiar} disabled={enCurso}>
              Vaciar
            </Button>
          )}
        </div>
      </aside>
    </div>
  )
}
