'use server'

import { revalidatePath } from 'next/cache'
import { requerirDueno, requerirUsuario } from '@/lib/auth/guards'
import { db, schema } from '@/lib/db'
import { esDiaValido } from './dia'
import { CATEGORIAS_GASTO } from './categorias'
import { buscarCierre, efectivoEsperado, resumenDia } from './queries'

// Cada acción verifica sesión y rol en el servidor y recalcula todo desde la base:
// del navegador solo se aceptan los montos que escribe la persona (gasto, fondo y efectivo contado).

export type ResultadoAccion = { ok: true } | { ok: false; error: string }

const MONTO_MAX = 100_000_000

const esMonto = (v: unknown, minimo: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= minimo && v <= MONTO_MAX

/** Carga un gasto. Solo el dueño (CLAUDE.md, sección 9). */
export async function cargarGasto(entrada: unknown): Promise<ResultadoAccion> {
  const usuario = await requerirDueno()
  if (typeof entrada !== 'object' || entrada === null) return { ok: false, error: 'El gasto no es válido.' }
  const d = entrada as Record<string, unknown>

  if (!esDiaValido(d.fecha)) return { ok: false, error: 'Elegí una fecha válida.' }
  const descripcion = typeof d.descripcion === 'string' ? d.descripcion.trim() : ''
  if (descripcion.length < 2 || descripcion.length > 200) {
    return { ok: false, error: 'Escribí una descripción (hasta 200 caracteres).' }
  }
  if (typeof d.categoria !== 'string' || !(CATEGORIAS_GASTO as readonly string[]).includes(d.categoria)) {
    return { ok: false, error: 'Elegí una categoría.' }
  }
  if (!esMonto(d.monto, 1)) return { ok: false, error: 'Ingresá un monto en pesos, entero y mayor a cero.' }
  if (d.metodoPago !== 'efectivo' && d.metodoPago !== 'transferencia') {
    return { ok: false, error: 'Elegí efectivo o transferencia.' }
  }

  await db.insert(schema.gastos).values({
    fecha: d.fecha,
    descripcion,
    categoria: d.categoria,
    monto: d.monto,
    metodoPago: d.metodoPago,
    usuarioId: usuario.id,
  })

  revalidatePath('/admin/gastos')
  revalidatePath('/admin/caja')
  return { ok: true }
}

/**
 * Cierra la caja del día. El efectivo esperado y los totales los calcula el servidor desde la
 * base; la persona solo informa el fondo inicial (opcional) y el efectivo que contó.
 */
export async function cerrarCaja(entrada: unknown): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario()
  if (typeof entrada !== 'object' || entrada === null) return { ok: false, error: 'El cierre no es válido.' }
  const d = entrada as Record<string, unknown>

  if (!esDiaValido(d.fecha)) return { ok: false, error: 'Elegí un día válido.' }
  const fondoInicial = d.fondoInicial === undefined || d.fondoInicial === null || d.fondoInicial === '' ? 0 : d.fondoInicial
  if (!esMonto(fondoInicial, 0)) return { ok: false, error: 'El fondo inicial debe ser un monto en pesos, entero.' }
  if (!esMonto(d.efectivoContado, 0)) return { ok: false, error: 'Ingresá el efectivo que contaste (monto entero en pesos).' }

  if (await buscarCierre(d.fecha)) {
    return { ok: false, error: 'La caja de ese día ya está cerrada.' }
  }

  const resumen = await resumenDia(d.fecha)
  const esperado = efectivoEsperado(resumen, fondoInicial)

  await db.insert(schema.cierresCaja).values({
    fecha: d.fecha,
    efectivoEsperado: esperado,
    efectivoContado: d.efectivoContado,
    diferencia: d.efectivoContado - esperado,
    totalesPorMetodo: {
      efectivo: resumen.ventasEfectivo,
      transferencia: resumen.transferenciasConfirmadas,
      transferenciaPorConfirmar: resumen.transferenciasPorConfirmar,
      fondoInicial,
    },
    gastosEfectivo: resumen.gastosEfectivo,
    usuarioId: usuario.id,
  })

  revalidatePath('/admin/caja')
  return { ok: true }
}
