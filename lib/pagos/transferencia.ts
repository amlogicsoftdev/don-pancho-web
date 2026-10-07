import { inArray } from 'drizzle-orm'
import { db, schema } from '@/lib/db'

// Datos de la cuenta para los pagos por transferencia. Viven en la tabla `configuracion`
// (claves transferencia_*), así el local los cambia sin tocar código.

export interface DatosTransferencia {
  alias: string | null
  cbu: string | null
  titular: string | null
  banco: string | null
}

const CLAVES = {
  alias: 'transferencia_alias',
  cbu: 'transferencia_cbu',
  titular: 'transferencia_titular',
  banco: 'transferencia_banco',
} as const

/** Datos de la cuenta, o null si el local todavía no cargó ni alias ni CBU. */
export async function leerDatosTransferencia(): Promise<DatosTransferencia | null> {
  const filas = await db
    .select({ clave: schema.configuracion.clave, valor: schema.configuracion.valor })
    .from(schema.configuracion)
    .where(inArray(schema.configuracion.clave, Object.values(CLAVES)))
  const valor = (clave: string) => filas.find((f) => f.clave === clave)?.valor.trim() || null

  const datos: DatosTransferencia = {
    alias: valor(CLAVES.alias),
    cbu: valor(CLAVES.cbu),
    titular: valor(CLAVES.titular),
    banco: valor(CLAVES.banco),
  }
  return datos.alias || datos.cbu ? datos : null
}
