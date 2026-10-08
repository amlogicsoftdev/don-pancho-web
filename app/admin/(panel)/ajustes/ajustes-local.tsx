'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  guardarCorteCaja,
  guardarCuentaTransferencia,
  guardarDatosLocal,
  type ResultadoAccion,
} from '@/lib/menu/actions'
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

interface HojaProps {
  titulo: string
  descripcion?: string
  /** Guarda los datos de esta hoja (cada hoja se guarda por separado). */
  onGuardar: (datos: FormData) => Promise<ResultadoAccion>
  suave?: boolean
  children: React.ReactNode
}

/** Una hoja de ajustes: su propio formulario, su botón Guardar y su mensaje. */
function Hoja({ titulo, descripcion, onGuardar, suave = false, children }: HojaProps) {
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [enCurso, iniciar] = useTransition()

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setMensaje(null)
    iniciar(async () => {
      const resultado = await onGuardar(datos)
      setMensaje(resultado.ok ? { ok: true, texto: 'Guardado.' } : { ok: false, texto: resultado.error })
    })
  }

  return (
    <form onSubmit={enviar} className={`pn-card p-5 sm:p-6 ${suave ? 'pn-card--soft' : ''}`}>
      <h2 className="text-2xl leading-none">{titulo}</h2>
      {descripcion && <p className="pn-muted mt-2 text-sm font-medium">{descripcion}</p>}
      <div className="mt-5">{children}</div>
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-pancho-black/10 pt-5">
        <Button type="submit" variant="default" size="lg" disabled={enCurso}>
          {enCurso ? 'Guardando…' : 'Guardar'}
        </Button>
        {mensaje && (
          <p role={mensaje.ok ? 'status' : 'alert'} className={`pn-alert ${mensaje.ok ? 'pn-alert--ok' : 'pn-alert--error'}`}>
            {mensaje.texto}
          </p>
        )}
      </div>
    </form>
  )
}

// El descuento ya no es un ajuste general: se carga en cada pedido (mostrador o detalle).
export function AjustesLocal({ corteHora, transferencia, local }: Props) {
  return (
    <div className="space-y-6">
      <Hoja
        titulo="Datos del local"
        descripcion="Se muestran en el sitio (pie de página, carrito y seguimiento), en las comandas y en los mensajes. Los pedidos y las consultas llegan a este WhatsApp. Si el local no tiene alguna red, dejá el link vacío y no se muestra."
        onGuardar={(d) =>
          guardarDatosLocal({
            nombre: d.get('nombre'),
            whatsapp: d.get('whatsapp'),
            direccion: d.get('direccion'),
            horario: d.get('horario'),
            instagram: d.get('instagram'),
            facebook: d.get('facebook'),
            tiktok: d.get('tiktok'),
          })
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
            placeholder="Ej.: Mar a Dom · 20:15 a 00:15"
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
      </Hoja>

      <Hoja
        titulo="Cuenta para transferencias"
        descripcion="Se muestran al cliente en el seguimiento del pedido y en el mensaje de WhatsApp cuando paga por transferencia. Si dejás alias y CBU vacíos, no se muestra ningún dato."
        onGuardar={(d) =>
          guardarCuentaTransferencia({
            alias: d.get('alias'),
            cbu: d.get('cbu'),
            titular: d.get('titular'),
            banco: d.get('banco'),
          })
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
      </Hoja>

      <Hoja
        titulo="Caja"
        descripcion="Define cuándo cambia el día en la caja y en los reportes. Por ejemplo, 6 = de 06:00 a 06:00 del día siguiente: lo que se vende después de medianoche cuenta para la noche anterior."
        onGuardar={(d) => guardarCorteCaja(Number(d.get('corte')))}
        suave
      >
        <div className="max-w-xs">
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
      </Hoja>
    </div>
  )
}
