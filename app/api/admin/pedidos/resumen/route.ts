import { and, count, isNull, max, eq } from 'drizzle-orm'
import { protegerApi } from '@/lib/auth/guards'
import { db, schema } from '@/lib/db'

// El panel consulta esto cada pocos segundos para avisar de pedidos nuevos.
export async function GET() {
  const acceso = await protegerApi()
  if (acceso.respuesta) return acceso.respuesta

  const [{ pendientes }] = await db
    .select({ pendientes: count() })
    .from(schema.pedidos)
    .where(and(isNull(schema.pedidos.borradoEn), eq(schema.pedidos.estado, 'pendiente')))
  // Solo los pedidos de la web: una venta de mostrador la carga el propio local, no hay que avisar
  const [{ ultimoId }] = await db
    .select({ ultimoId: max(schema.pedidos.id) })
    .from(schema.pedidos)
    .where(and(isNull(schema.pedidos.borradoEn), eq(schema.pedidos.origen, 'web')))

  return Response.json({ pendientes, ultimoId: ultimoId ?? 0 }, { headers: { 'Cache-Control': 'no-store' } })
}
