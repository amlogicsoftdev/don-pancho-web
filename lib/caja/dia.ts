import 'server-only'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db'

// "Día operativo" del local. Si el local atiende pasada la medianoche, un pedido de las 00:30
// pertenece al día anterior. El día va de `corteHora` a `corteHora` del día siguiente, en horario
// de Buenos Aires (configuración `corte_dia_hora`, por defecto 6 → de 06:00 a 06:00).
//
// Argentina no tiene horario de verano: Buenos Aires es siempre UTC-3. Si eso cambiara, hay que
// revisar OFFSET_HORAS.

const OFFSET_HORAS = 3
const MS_HORA = 3_600_000
const CORTE_POR_DEFECTO = 6

export async function leerCorteHora(): Promise<number> {
  const [fila] = await db
    .select({ valor: schema.configuracion.valor })
    .from(schema.configuracion)
    .where(eq(schema.configuracion.clave, 'corte_dia_hora'))
  const hora = Number(fila?.valor ?? CORTE_POR_DEFECTO)
  return Number.isInteger(hora) && hora >= 0 && hora <= 23 ? hora : CORTE_POR_DEFECTO
}

const formatoDia = (d: Date) => d.toISOString().slice(0, 10)

/** Día operativo (YYYY-MM-DD) al que pertenece un instante. */
export function diaOperativo(instante: Date, corteHora: number): string {
  const local = new Date(instante.getTime() - OFFSET_HORAS * MS_HORA - corteHora * MS_HORA)
  return formatoDia(local)
}

export function esDiaValido(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const fecha = new Date(`${valor}T00:00:00Z`)
  return !Number.isNaN(fecha.getTime()) && formatoDia(fecha) === valor
}

/** Instantes UTC [desde, hasta) que cubren los días operativos de `desde` a `hasta` inclusive. */
export function rangoDias(desde: string, hasta: string, corteHora: number): { inicio: Date; fin: Date } {
  const inicio = new Date(`${desde}T00:00:00Z`).getTime() + (corteHora + OFFSET_HORAS) * MS_HORA
  const fin = new Date(`${hasta}T00:00:00Z`).getTime() + (24 + corteHora + OFFSET_HORAS) * MS_HORA
  return { inicio: new Date(inicio), fin: new Date(fin) }
}

/** Suma (o resta) días a un día YYYY-MM-DD. */
export function sumarDias(dia: string, cantidad: number): string {
  const fecha = new Date(`${dia}T00:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + cantidad)
  return formatoDia(fecha)
}

/** "05/10/2026" a partir de "2026-10-05". */
export function mostrarDia(dia: string): string {
  const [a, m, d] = dia.split('-')
  return `${d}/${m}/${a}`
}
