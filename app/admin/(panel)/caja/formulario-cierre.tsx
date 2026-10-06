'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cerrarCaja } from '@/lib/caja/actions'
import { formatearPrecio } from '@/lib/orders/estados'

const CAMPO = 'h-10 w-full rounded-lg border border-white/15 bg-pancho-black px-3 outline-none focus:border-pancho-orange'

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
    <div className="space-y-4 rounded-xl border border-white/10 bg-pancho-surface p-4">
      <h2 className="text-lg">Cerrar la caja</h2>

      <label className="block text-sm">
        <span className="mb-1 block text-pancho-muted">Fondo inicial en efectivo (opcional)</span>
        <input type="number" min={0} step={1} inputMode="numeric" value={fondo} onChange={(e) => setFondo(e.target.value)} placeholder="0" className={CAMPO} />
      </label>

      <p className="flex justify-between text-sm">
        <span className="text-pancho-muted">Efectivo esperado según el sistema</span>
        <strong>{formatearPrecio(esperado)}</strong>
      </p>

      <label className="block text-sm">
        <span className="mb-1 block text-pancho-muted">Efectivo que contaste en la caja</span>
        <input type="number" min={0} step={1} inputMode="numeric" value={contado} onChange={(e) => setContado(e.target.value)} className={CAMPO} />
      </label>

      {diferencia !== null && (
        <p
          role="status"
          className={`rounded-lg p-3 text-sm font-semibold ${
            diferencia === 0
              ? 'bg-emerald-400/10 text-emerald-200'
              : diferencia > 0
                ? 'bg-sky-400/10 text-sky-200'
                : 'bg-rose-400/10 text-rose-200'
          }`}
        >
          {diferencia === 0
            ? 'La caja cuadra: no hay diferencia.'
            : diferencia > 0
              ? `Sobran ${formatearPrecio(diferencia)}.`
              : `Faltan ${formatearPrecio(-diferencia)}.`}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}

      <Button
        size="lg"
        disabled={enCurso || !hayContado || Number(contado) < 0}
        onClick={cerrar}
        className="h-10 bg-pancho-orange px-4 text-pancho-black hover:bg-pancho-orange-deep"
      >
        {enCurso ? 'Cerrando…' : 'Cerrar caja'}
      </Button>
      <p className="text-xs text-pancho-muted">
        Queda guardado con la fecha, la hora y tu usuario ({cierraComo}). Una vez cerrada, la caja de este día no se
        puede volver a cerrar.
      </p>
    </div>
  )
}
