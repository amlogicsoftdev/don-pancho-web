'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { guardarAjustes } from '@/lib/menu/actions'

const CAMPO_ANCHO = 'h-9 w-full rounded-lg border border-white/15 bg-pancho-black px-2 outline-none focus:border-pancho-orange'
const CAMPO = 'h-9 w-28 rounded-lg border border-white/15 bg-pancho-black px-2 outline-none focus:border-pancho-orange'

interface Props {
  descuentoPorcentaje: number
  corteHora: number
  transferencia: { alias: string; cbu: string; titular: string; banco: string }
}

export function AjustesLocal({ descuentoPorcentaje, corteHora, transferencia }: Props) {
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
        alias: datos.get('alias'),
        cbu: datos.get('cbu'),
        titular: datos.get('titular'),
        banco: datos.get('banco'),
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
      </div>

      <fieldset className="space-y-3 border-t border-white/10 pt-3">
        <legend className="text-sm font-semibold">Cuenta para transferencias</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-pancho-muted">Alias</span>
            <input name="alias" maxLength={20} defaultValue={transferencia.alias} placeholder="Ej.: donpancho.burger" className={CAMPO_ANCHO} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-pancho-muted">CBU o CVU (22 números)</span>
            <input name="cbu" inputMode="numeric" maxLength={22} defaultValue={transferencia.cbu} className={CAMPO_ANCHO} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-pancho-muted">Titular</span>
            <input name="titular" maxLength={80} defaultValue={transferencia.titular} className={CAMPO_ANCHO} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-pancho-muted">Banco o billetera</span>
            <input name="banco" maxLength={60} defaultValue={transferencia.banco} className={CAMPO_ANCHO} />
          </label>
        </div>
        <p className="text-xs text-pancho-muted">
          Se muestran al cliente en el seguimiento del pedido y en el mensaje de WhatsApp cuando paga por transferencia.
          Si dejás alias y CBU vacíos, no se muestra ningún dato.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
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
