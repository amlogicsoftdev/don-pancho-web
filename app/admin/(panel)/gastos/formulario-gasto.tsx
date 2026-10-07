'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { PanchoButton } from '@/components/pancho-button'
import { cargarGasto } from '@/lib/caja/actions'
import { CATEGORIAS_GASTO } from '@/lib/caja/categorias'

export function FormularioGasto({ diaPorDefecto }: { diaPorDefecto: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enCurso, iniciar] = useTransition()

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const datos = new FormData(formulario)
    setError(null)
    setAviso(null)

    iniciar(async () => {
      const resultado = await cargarGasto({
        fecha: datos.get('fecha'),
        descripcion: datos.get('descripcion'),
        categoria: datos.get('categoria'),
        monto: Number(datos.get('monto')),
        metodoPago: datos.get('metodoPago'),
      })
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      formulario.reset()
      setAviso('Gasto cargado.')
      router.refresh()
    })
  }

  return (
    <form onSubmit={enviar} className="pn-card space-y-5 p-5 sm:p-6">
      <h2 className="text-2xl leading-none">Cargar un gasto</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="block lg:col-span-4">
          <span className="pn-label">Descripción</span>
          <input name="descripcion" required maxLength={200} placeholder="Ej.: carne, pan, gas…" className="pn-field" />
        </label>
        <label className="block lg:col-span-2">
          <span className="pn-label">Monto ($)</span>
          <input name="monto" type="number" required min={1} step={1} inputMode="numeric" className="pn-field" />
        </label>
        <label className="block lg:col-span-2">
          <span className="pn-label">Fecha</span>
          <input type="date" name="fecha" required defaultValue={diaPorDefecto} className="pn-field" />
        </label>
        <label className="block lg:col-span-2">
          <span className="pn-label">Categoría</span>
          <select name="categoria" required defaultValue="Insumos" className="pn-field">
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block lg:col-span-2">
          <span className="pn-label">Pagado con</span>
          <select name="metodoPago" defaultValue="efectivo" className="pn-field">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
      </div>

      {aviso && (
        <p role="status" className="pn-alert pn-alert--ok">
          {aviso}
        </p>
      )}
      {error && (
        <p role="alert" className="pn-alert pn-alert--error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <PanchoButton type="submit" disabled={enCurso}>
          {enCurso ? 'Guardando…' : 'Cargar gasto'}
        </PanchoButton>
        <p className="pn-muted min-w-56 flex-1 text-xs font-medium">
          Los gastos en efectivo se descuentan del efectivo esperado en el cierre de caja.
        </p>
      </div>
    </form>
  )
}
