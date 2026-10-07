'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { PanchoButton } from '@/components/pancho-button'
import { guardarAjustes } from '@/lib/menu/actions'
import type { DatosLocal } from '@/lib/local/datos'

interface Props {
  corteHora: number
  transferencia: { alias: string; cbu: string; titular: string; banco: string }
  local: DatosLocal
}

/** Campo de texto con su rótulo. */
function Campo({ etiqueta, ...input }: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="pn-label">{etiqueta}</span>
      <input className="pn-field" {...input} />
    </label>
  )
}

// El descuento ya no es un ajuste general: se carga en cada pedido (mostrador o detalle).
export function AjustesLocal({ corteHora, transferencia, local }: Props) {
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [enCurso, iniciar] = useTransition()

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setMensaje(null)
    iniciar(async () => {
      const resultado = await guardarAjustes({
        corteHora: Number(datos.get('corte')),
        alias: datos.get('alias'),
        cbu: datos.get('cbu'),
        titular: datos.get('titular'),
        banco: datos.get('banco'),
        nombre: datos.get('nombre'),
        whatsapp: datos.get('whatsapp'),
        direccion: datos.get('direccion'),
        horario: datos.get('horario'),
        instagram: datos.get('instagram'),
        facebook: datos.get('facebook'),
        tiktok: datos.get('tiktok'),
      })
      setMensaje(resultado.ok ? { ok: true, texto: 'Ajustes guardados.' } : { ok: false, texto: resultado.error })
    })
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      {/* ---------- Datos del local ---------- */}
      <fieldset className="pn-card p-5 sm:p-6">
        <legend className="sr-only">Datos del local</legend>
        <h2 className="text-2xl leading-none">Datos del local</h2>
        <p className="pn-muted mt-2 text-sm font-medium">
          Se muestran en el sitio (pie de página, carrito y seguimiento). Los pedidos y las consultas llegan a este
          WhatsApp. Si el local no tiene alguna red, dejá el link vacío y no se muestra.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" name="nombre" required maxLength={60} defaultValue={local.nombre} />
          <Campo
            etiqueta="WhatsApp del local (celular con código de área)"
            name="whatsapp"
            required
            inputMode="tel"
            maxLength={30}
            defaultValue={local.whatsapp}
            placeholder="Ej.: 3442 66-8413"
          />
          <Campo etiqueta="Dirección" name="direccion" required maxLength={120} defaultValue={local.direccion} />
          <Campo
            etiqueta="Horario de atención"
            name="horario"
            required
            maxLength={80}
            defaultValue={local.horario}
            placeholder="Ej.: Mar a Dom · 19:00 a 00:30"
          />
          <Campo
            etiqueta="Instagram (link)"
            name="instagram"
            type="url"
            maxLength={200}
            defaultValue={local.instagram}
            placeholder="https://instagram.com/..."
          />
          <Campo
            etiqueta="Facebook (link)"
            name="facebook"
            type="url"
            maxLength={200}
            defaultValue={local.facebook}
            placeholder="https://facebook.com/..."
          />
          <Campo
            etiqueta="TikTok (link)"
            name="tiktok"
            type="url"
            maxLength={200}
            defaultValue={local.tiktok}
            placeholder="https://tiktok.com/@..."
          />
        </div>
      </fieldset>

      {/* ---------- Cuenta para transferencias ---------- */}
      <fieldset className="pn-card p-5 sm:p-6">
        <legend className="sr-only">Cuenta para transferencias</legend>
        <h2 className="text-2xl leading-none">Cuenta para transferencias</h2>
        <p className="pn-muted mt-2 text-sm font-medium">
          Se muestran al cliente en el seguimiento del pedido y en el mensaje de WhatsApp cuando paga por transferencia.
          Si dejás alias y CBU vacíos, no se muestra ningún dato.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Alias"
            name="alias"
            maxLength={20}
            defaultValue={transferencia.alias}
            placeholder="Ej.: donpancho.burger"
          />
          <Campo
            etiqueta="CBU o CVU (22 números)"
            name="cbu"
            inputMode="numeric"
            maxLength={22}
            defaultValue={transferencia.cbu}
          />
          <Campo etiqueta="Titular" name="titular" maxLength={80} defaultValue={transferencia.titular} />
          <Campo etiqueta="Banco o billetera" name="banco" maxLength={60} defaultValue={transferencia.banco} />
        </div>
      </fieldset>

      {/* ---------- Caja ---------- */}
      <fieldset className="pn-card pn-card--soft p-5 sm:p-6">
        <legend className="sr-only">Caja</legend>
        <h2 className="text-2xl leading-none">Caja</h2>
        <div className="mt-5 max-w-xs">
          <Campo
            etiqueta="El día de caja empieza a las (hora)"
            name="corte"
            type="number"
            min={0}
            max={23}
            step={1}
            required
            defaultValue={corteHora}
          />
        </div>
        <p className="pn-muted mt-2 text-sm font-medium">
          Define cuándo cambia el día en la caja y en los reportes. Por ejemplo, 6 = de 06:00 a 06:00 del día siguiente,
          así lo que se vende después de medianoche cuenta para la noche anterior.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <PanchoButton type="submit" disabled={enCurso}>
          {enCurso ? 'Guardando…' : 'Guardar ajustes'}
        </PanchoButton>
        {mensaje && (
          <p role={mensaje.ok ? 'status' : 'alert'} className={`pn-alert ${mensaje.ok ? 'pn-alert--ok' : 'pn-alert--error'}`}>
            {mensaje.texto}
          </p>
        )}
      </div>
    </form>
  )
}
