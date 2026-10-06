'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cargarGasto } from '@/lib/caja/actions'
import { CATEGORIAS_GASTO } from '@/lib/caja/categorias'

const CAMPO = 'h-9 w-full rounded-lg border border-white/15 bg-cheesy-black px-2 outline-none focus:border-cheesy-yellow'

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
    <form onSubmit={enviar} className="space-y-3 rounded-xl border border-white/10 bg-cheesy-surface p-4">
      <h2 className="text-lg">Cargar un gasto</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">
          <span className="mb-1 block text-cheesy-muted">Fecha</span>
          <input type="date" name="fecha" required defaultValue={diaPorDefecto} className={CAMPO} />
        </label>
        <label className="text-sm lg:col-span-2">
          <span className="mb-1 block text-cheesy-muted">Descripción</span>
          <input name="descripcion" required maxLength={200} placeholder="Ej.: carne, pan, gas…" className={CAMPO} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-cheesy-muted">Categoría</span>
          <select name="categoria" required defaultValue="Insumos" className={CAMPO}>
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-cheesy-muted">Monto ($)</span>
          <input name="monto" type="number" required min={1} step={1} inputMode="numeric" className={CAMPO} />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-cheesy-muted">Pagado con</span>
          <select name="metodoPago" defaultValue="efectivo" className={CAMPO}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
        <Button type="submit" size="lg" disabled={enCurso} className="h-9 bg-cheesy-yellow px-4 text-cheesy-black hover:bg-cheesy-yellow-bright">
          {enCurso ? 'Guardando…' : 'Cargar gasto'}
        </Button>
        {aviso && (
          <p role="status" className="text-sm text-emerald-300">
            {aviso}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
      </div>
      <p className="text-xs text-cheesy-muted">Los gastos en efectivo se descuentan del efectivo esperado en el cierre de caja.</p>
    </form>
  )
}
