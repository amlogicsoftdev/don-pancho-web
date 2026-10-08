'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cerrarCaja } from '@/lib/caja/actions'
import { formatearPrecio } from '@/lib/orders/estados'

interface Props {
  dia: string
  ventasEfectivo: number
  gastosEfectivo: number
  cierraComo: string
}

// El esperado se calcula acá solo para mostrar la diferencia en el momento; al cerrar, el
// servidor lo vuelve a calcular desde la base y es el que queda guardado.
export function FormularioCierre({ dia, ventasEfectivo, gastosEfectivo, cierraComo }: Props) {
  const router = useRouter()
  const [fondo, setFondo] = useState('')
  const [contado, setContado] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enCurso, iniciar] = useTransition()

  const fondoNumero = fondo === '' ? 0 : Number(fondo)
  const esperado = fondoNumero + ventasEfectivo - gastosEfectivo
  const hayContado = contado !== ''
  const diferencia = hayContado ? Number(contado) - esperado : null

  function cerrar() {
    setError(null)
    iniciar(async () => {
      const resultado = await cerrarCaja({ fecha: dia, fondoInicial: fondoNumero, efectivoContado: Number(contado) })
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="pn-card space-y-5 p-5 sm:p-6">
      <h2 className="text-2xl leading-none">Cerrar la caja</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="pn-label">Fondo inicial en efectivo (opcional)</span>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={fondo}
            onChange={(e) => setFondo(e.target.value)}
            placeholder="0"
            className="pn-field"
          />
        </label>

        <label className="block">
          <span className="pn-label">Efectivo que contaste en la caja</span>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={contado}
            onChange={(e) => setContado(e.target.value)}
            className="pn-field"
          />
        </label>
      </div>

      <p className="flex items-baseline justify-between gap-3 border-y border-pancho-black/10 py-3 text-sm font-semibold">
        <span className="pn-muted">Efectivo esperado según el sistema</span>
        <strong className="font-display text-2xl leading-none font-normal tabular-nums">{formatearPrecio(esperado)}</strong>
      </p>

      {diferencia !== null && (
        <p
          role="status"
          className={`pn-alert ${diferencia === 0 ? 'pn-alert--ok' : diferencia > 0 ? 'pn-alert--warn' : 'pn-alert--error'}`}
        >
          {diferencia === 0
            ? 'La caja cuadra: no hay diferencia.'
            : diferencia > 0
              ? `Sobran ${formatearPrecio(diferencia)}.`
              : `Faltan ${formatearPrecio(-diferencia)}.`}
        </p>
      )}

      {error && (
        <p role="alert" className="pn-alert pn-alert--error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button variant="default" size="lg" disabled={enCurso || !hayContado || Number(contado) < 0} onClick={cerrar}>
          {enCurso ? 'Cerrando…' : 'Cerrar caja'}
        </Button>
        <p className="pn-muted min-w-56 flex-1 text-xs font-medium">
          Queda guardado con la fecha, la hora y tu usuario ({cierraComo}). Una vez cerrada, la caja de este día no se
          puede volver a cerrar.
        </p>
      </div>
    </div>
  )
}
