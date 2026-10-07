import 'server-only'
import { cache } from 'react'
import { inArray } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { CAMPOS_OPCIONALES, CLAVES_LOCAL, DATOS_LOCAL_POR_DEFECTO, type DatosLocal } from './datos'

/**
 * Datos públicos del local desde `configuracion`. Si falta un dato, o la base no responde,
 * usa el valor por defecto: el sitio nunca se cae por esto. Se lee una vez por request.
 */
export const leerDatosLocal = cache(async (): Promise<DatosLocal> => {
  try {
    const filas = await db
      .select({ clave: schema.configuracion.clave, valor: schema.configuracion.valor })
      .from(schema.configuracion)
      .where(inArray(schema.configuracion.clave, Object.values(CLAVES_LOCAL)))
    const porClave = new Map(filas.map((f) => [f.clave, f.valor.trim()]))

    const datos = { ...DATOS_LOCAL_POR_DEFECTO }
    for (const campo of Object.keys(CLAVES_LOCAL) as (keyof DatosLocal)[]) {
      const valor = porClave.get(CLAVES_LOCAL[campo])
      if (valor === undefined) continue
      // Una red vacía es a propósito (no se muestra); los demás datos vacíos usan el valor por defecto
      if (valor || CAMPOS_OPCIONALES.includes(campo)) datos[campo] = valor
    }
    return datos
  } catch (error) {
    console.error('No se pudieron leer los datos del local; se usan los valores por defecto.', error)
    return DATOS_LOCAL_POR_DEFECTO
  }
})
