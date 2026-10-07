'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { guardarAjustes } from '@/lib/menu/actions'

const CAMPO = 'h-9 w-28 rounded-lg border border-white/15 bg-pancho-black px-2 outline-none focus:border-pancho-orange'

export function AjustesLocal({ descuentoPorcentaje, corteHora }: { descuentoPorcentaje: number; corteHora: number }) {
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [enCurso, iniciar] = useTransition()

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setMensaje(null)
    iniciar(async () => {
      const resultado = await guardarAjustes({
        descuentoPorcentaje: Number(datos.get('descuento')),
        corteHora: Number(datos.get('corte')),
      })
      setMensaje(resultado.ok ? { ok: true, texto: 'Ajustes guardados.' } : { ok: false, texto: resultado.error })
    })
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-xl border border-white/10 bg-pancho-surface p-4">
      <h2 className="text-lg">Ajustes</h2>
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-pancho-muted">Descuento por pedido (%)</span>
          <input name="descuento" type="number" min={0} max={100} step={1} defaultValue={descuentoPorcentaje} className={CAMPO} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-pancho-muted">El día de caja empieza a las (hora)</span>
          <input name="corte" type="number" min={0} max={23} step={1} defaultValue={corteHora} className={CAMPO} />
        </label>
        <Button type="submit" size="lg" disabled={enCurso} className="h-9 bg-pancho-orange px-4 text-pancho-black hover:bg-pancho-orange-deep">
          {enCurso ? 'Guardando…' : 'Guardar ajustes'}
        </Button>
        {mensaje && (
          <p role={mensaje.ok ? 'status' : 'alert'} className={`text-sm ${mensaje.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
            {mensaje.texto}
          </p>
        )}
      </div>
      <p className="text-xs text-pancho-muted">
        El descuento se aplica a los pedidos nuevos (web y mostrador) y queda guardado en cada uno; 0 significa sin descuento.
        La hora de corte define cuándo cambia el día en la caja y en los reportes (por ejemplo 6 = de 06:00 a 06:00).
      </p>
    </form>
  )
}
