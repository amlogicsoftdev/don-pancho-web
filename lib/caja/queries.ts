import 'server-only'
import { and, desc, eq, gte, isNull, lt, ne, sql } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { ESTADOS_ACTIVOS } from '@/lib/orders/estados'
import { leerCorteHora, rangoDias } from './dia'

// Consultas de ventas, caja, gastos y anulaciones. No verifican permisos: las páginas y acciones
// que las usan deben pasar antes por una guarda de lib/auth/guards.ts.

/** Una venta es todo pedido que no está cancelado ni borrado (CLAUDE.md, sección 7). */
const esVenta = and(isNull(schema.pedidos.borradoEn), ne(schema.pedidos.estado, 'cancelado'))

/**
 * Venta cobrada: la plata ya está en el local. Una transferencia, cuando se confirmó que llegó;
 * el efectivo, cuando se entregó el pedido (se cobra al entregar). Las ventas de mostrador se
 * registran cobradas (pago_confirmado), salvo el delivery en efectivo, que sigue la regla del
 * efectivo. Ventas y caja solo suman lo cobrado.
 */
const cobrado = sql`(${schema.pedidos.pagoConfirmado} or (${schema.pedidos.metodoPago} = 'efectivo' and ${schema.pedidos.estado} = 'entregado'))`
const esCobrada = and(esVenta, cobrado)

export interface ResumenCaja {
  dia: string
  cantidadVentas: number
  ventasEfectivo: number
  // Transferencias con el pago confirmado: son las que entran al total.
  transferenciasConfirmadas: number
  // Transferencias todavía sin confirmar: se muestran aparte, no se suman.
  transferenciasPorConfirmar: number
  cantidadPorConfirmar: number
  // Pedidos del día que todavía no se entregaron (el efectivo recién entra al entregarlos).
  sinEntregar: number
  gastosEfectivo: number
  gastosTransferencia: number
}

/** Totales del día operativo `dia` (YYYY-MM-DD), calculados siempre desde la base. */
export async function resumenDia(dia: string): Promise<ResumenCaja> {
  const corte = await leerCorteHora()
  const { inicio, fin } = rangoDias(dia, dia, corte)
  const enElDia = and(esVenta, gte(schema.pedidos.creadoEn, inicio), lt(schema.pedidos.creadoEn, fin))

  const [ventas] = await db
    .select({
      // Solo lo cobrado (ver `cobrado`): lo que todavía no se cobró no entra a la caja
      cantidad: sql<number>`count(*) filter (where ${cobrado})::int`,
      efectivo: sql<number>`coalesce(sum(${schema.pedidos.total}) filter (where ${cobrado} and ${schema.pedidos.metodoPago} = 'efectivo'), 0)::int`,
      transfConfirmadas: sql<number>`coalesce(sum(${schema.pedidos.total}) filter (where ${cobrado} and ${schema.pedidos.metodoPago} = 'transferencia'), 0)::int`,
      transfPorConfirmar: sql<number>`coalesce(sum(${schema.pedidos.total}) filter (where ${schema.pedidos.metodoPago} = 'transferencia' and not ${schema.pedidos.pagoConfirmado}), 0)::int`,
      cantPorConfirmar: sql<number>`count(*) filter (where ${schema.pedidos.metodoPago} = 'transferencia' and not ${schema.pedidos.pagoConfirmado})::int`,
      sinEntregar: sql<number>`count(*) filter (where ${schema.pedidos.estado} in (${sql.join(ESTADOS_ACTIVOS.map((e) => sql`${e}`), sql`, `)}))::int`,
    })
    .from(schema.pedidos)
    .where(enElDia)

  const [gastos] = await db
    .select({
      efectivo: sql<number>`coalesce(sum(${schema.gastos.monto}) filter (where ${schema.gastos.metodoPago} = 'efectivo'), 0)::int`,
      transferencia: sql<number>`coalesce(sum(${schema.gastos.monto}) filter (where ${schema.gastos.metodoPago} = 'transferencia'), 0)::int`,
    })
    .from(schema.gastos)
    .where(eq(schema.gastos.fecha, dia))

  return {
    dia,
    cantidadVentas: ventas.cantidad,
    ventasEfectivo: ventas.efectivo,
    transferenciasConfirmadas: ventas.transfConfirmadas,
    transferenciasPorConfirmar: ventas.transfPorConfirmar,
    cantidadPorConfirmar: ventas.cantPorConfirmar,
    sinEntregar: ventas.sinEntregar,
    gastosEfectivo: gastos.efectivo,
    gastosTransferencia: gastos.transferencia,
  }
}

/** efectivo_esperado = fondo inicial + ventas en efectivo − gastos en efectivo (CLAUDE.md, sección 7). */
export const efectivoEsperado = (resumen: ResumenCaja, fondoInicial: number) =>
  fondoInicial + resumen.ventasEfectivo - resumen.gastosEfectivo

export async function buscarCierre(dia: string) {
  const [cierre] = await db
    .select({
      id: schema.cierresCaja.id,
      efectivoEsperado: schema.cierresCaja.efectivoEsperado,
      efectivoContado: schema.cierresCaja.efectivoContado,
      diferencia: schema.cierresCaja.diferencia,
      totalesPorMetodo: schema.cierresCaja.totalesPorMetodo,
      gastosEfectivo: schema.cierresCaja.gastosEfectivo,
      creadoEn: schema.cierresCaja.creadoEn,
      usuario: schema.usuarios.name,
    })
    .from(schema.cierresCaja)
    .innerJoin(schema.usuarios, eq(schema.cierresCaja.usuarioId, schema.usuarios.id))
    .where(eq(schema.cierresCaja.fecha, dia))
    .orderBy(desc(schema.cierresCaja.id))
    .limit(1)
  return cierre ?? null
}

export async function listarCierres(limite = 30) {
  return db
    .select({
      id: schema.cierresCaja.id,
      fecha: schema.cierresCaja.fecha,
      efectivoEsperado: schema.cierresCaja.efectivoEsperado,
      efectivoContado: schema.cierresCaja.efectivoContado,
      diferencia: schema.cierresCaja.diferencia,
      creadoEn: schema.cierresCaja.creadoEn,
      usuario: schema.usuarios.name,
    })
    .from(schema.cierresCaja)
    .innerJoin(schema.usuarios, eq(schema.cierresCaja.usuarioId, schema.usuarios.id))
    .orderBy(desc(schema.cierresCaja.fecha), desc(schema.cierresCaja.id))
    .limit(limite)
}

export interface FiltroVentas {
  desde: string
  hasta: string
  origen: 'todos' | 'web' | 'mostrador'
  metodo: 'todos' | 'efectivo' | 'transferencia'
}

const LIMITE_FILAS = 500

/** Ventas del período con sus totales, más los gastos del mismo período. */
export async function reporteVentas(filtro: FiltroVentas) {
  const corte = await leerCorteHora()
  const { inicio, fin } = rangoDias(filtro.desde, filtro.hasta, corte)

  // Solo ventas cobradas: lo que todavía no se cobró no figura ni en la lista ni en los totales
  const condiciones = and(
    esCobrada,
    gte(schema.pedidos.creadoEn, inicio),
    lt(schema.pedidos.creadoEn, fin),
    filtro.origen === 'todos' ? undefined : eq(schema.pedidos.origen, filtro.origen),
    filtro.metodo === 'todos' ? undefined : eq(schema.pedidos.metodoPago, filtro.metodo),
  )

  const [totales] = await db
    .select({
      cantidad: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${schema.pedidos.total}), 0)::int`,
    })
    .from(schema.pedidos)
    .where(condiciones)

  const filas = await db
    .select({
      id: schema.pedidos.id,
      numero: schema.pedidos.numero,
      origen: schema.pedidos.origen,
      estado: schema.pedidos.estado,
      metodoPago: schema.pedidos.metodoPago,
      pagoConfirmado: schema.pedidos.pagoConfirmado,
      clienteNombre: schema.pedidos.clienteNombre,
      total: schema.pedidos.total,
      creadoEn: schema.pedidos.creadoEn,
    })
    .from(schema.pedidos)
    .where(condiciones)
    .orderBy(desc(schema.pedidos.creadoEn))
    .limit(LIMITE_FILAS)

  const [gastos] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.gastos.monto}), 0)::int` })
    .from(schema.gastos)
    .where(and(gte(schema.gastos.fecha, filtro.desde), sql`${schema.gastos.fecha} <= ${filtro.hasta}`))

  return {
    filas,
    hayMas: totales.cantidad > filas.length,
    cantidad: totales.cantidad,
    totalVentas: totales.total,
    totalGastos: gastos.total,
  }
}

export async function listarGastos(desde: string, hasta: string) {
  return db
    .select({
      id: schema.gastos.id,
      fecha: schema.gastos.fecha,
      descripcion: schema.gastos.descripcion,
      categoria: schema.gastos.categoria,
      monto: schema.gastos.monto,
      metodoPago: schema.gastos.metodoPago,
      usuario: schema.usuarios.name,
    })
    .from(schema.gastos)
    .innerJoin(schema.usuarios, eq(schema.gastos.usuarioId, schema.usuarios.id))
    .where(and(gte(schema.gastos.fecha, desde), sql`${schema.gastos.fecha} <= ${hasta}`))
    .orderBy(desc(schema.gastos.fecha), desc(schema.gastos.id))
    .limit(LIMITE_FILAS)
}

export async function listarAnulaciones(limite = 200) {
  return db
    .select({
      id: schema.anulaciones.id,
      numeroPedido: schema.anulaciones.numeroPedido,
      accion: schema.anulaciones.accion,
      motivo: schema.anulaciones.motivo,
      creadoEn: schema.anulaciones.creadoEn,
      usuario: schema.usuarios.name,
    })
    .from(schema.anulaciones)
    .innerJoin(schema.usuarios, eq(schema.anulaciones.usuarioId, schema.usuarios.id))
    .orderBy(desc(schema.anulaciones.creadoEn))
    .limit(limite)
}
