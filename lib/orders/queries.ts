import 'server-only'
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { ESTADOS_ACTIVOS, type EstadoPedido } from './estados'

// Consultas del panel. No verifican permisos: quien las llama (páginas y route handlers del
// panel) debe haber pasado antes por una guarda de lib/auth/guards.ts.

export type FiltroPedidos = 'activos' | 'entregados' | 'cancelados' | 'todos'

const ESTADOS_POR_FILTRO: Record<FiltroPedidos, readonly EstadoPedido[] | null> = {
  activos: ESTADOS_ACTIVOS,
  entregados: ['entregado'],
  cancelados: ['cancelado'],
  todos: null,
}

export function esFiltro(valor: unknown): valor is FiltroPedidos {
  return typeof valor === 'string' && valor in ESTADOS_POR_FILTRO
}

/** Lista de pedidos sin los borrados, el más nuevo primero. */
export async function listarPedidos(filtro: FiltroPedidos) {
  const estados = ESTADOS_POR_FILTRO[filtro]
  return db
    .select()
    .from(schema.pedidos)
    .where(
      and(
        isNull(schema.pedidos.borradoEn),
        estados ? inArray(schema.pedidos.estado, [...estados]) : undefined,
      ),
    )
    .orderBy(desc(schema.pedidos.creadoEn))
    .limit(200)
}

/** Cantidad de pedidos por estado, para las pestañas de la lista. */
export async function contarPedidosActivos() {
  const filas = await db
    .select({ id: schema.pedidos.id, estado: schema.pedidos.estado })
    .from(schema.pedidos)
    .where(and(isNull(schema.pedidos.borradoEn), inArray(schema.pedidos.estado, [...ESTADOS_ACTIVOS])))
  return {
    pendientes: filas.filter((f) => f.estado === 'pendiente').length,
    activos: filas.length,
  }
}

/** Pedido con ítems e historial. Devuelve null si no existe o está borrado. */
export async function obtenerPedido(id: number) {
  const [pedido] = await db
    .select()
    .from(schema.pedidos)
    .where(and(eq(schema.pedidos.id, id), isNull(schema.pedidos.borradoEn)))
  if (!pedido) return null

  const [items, historial, anulacion] = await Promise.all([
    db.select().from(schema.pedidoItems).where(eq(schema.pedidoItems.pedidoId, id)).orderBy(asc(schema.pedidoItems.id)),
    db
      .select({
        id: schema.pedidoHistorial.id,
        estadoAnterior: schema.pedidoHistorial.estadoAnterior,
        estadoNuevo: schema.pedidoHistorial.estadoNuevo,
        creadoEn: schema.pedidoHistorial.creadoEn,
        usuario: schema.usuarios.name,
      })
      .from(schema.pedidoHistorial)
      .leftJoin(schema.usuarios, eq(schema.pedidoHistorial.usuarioId, schema.usuarios.id))
      .where(eq(schema.pedidoHistorial.pedidoId, id))
      .orderBy(asc(schema.pedidoHistorial.id)),
    db
      .select({ motivo: schema.anulaciones.motivo, creadoEn: schema.anulaciones.creadoEn, usuario: schema.usuarios.name })
      .from(schema.anulaciones)
      .innerJoin(schema.usuarios, eq(schema.anulaciones.usuarioId, schema.usuarios.id))
      .where(and(eq(schema.anulaciones.pedidoId, id), eq(schema.anulaciones.accion, 'cancelado')))
      .limit(1),
  ])

  // Quién aplicó el descuento (si hay)
  const [descuentoDe] = pedido.descuentoAplicadoPor
    ? await db
        .select({ nombre: schema.usuarios.name })
        .from(schema.usuarios)
        .where(eq(schema.usuarios.id, pedido.descuentoAplicadoPor))
    : []

  return {
    pedido,
    items,
    historial,
    cancelacion: anulacion[0] ?? null,
    descuentoAplicadoPor: descuentoDe?.nombre ?? null,
  }
}

/** Nombre del local para los mensajes (configuración), con un valor por defecto. */
export async function leerNombreLocal(): Promise<string> {
  const [fila] = await db
    .select({ valor: schema.configuracion.valor })
    .from(schema.configuracion)
    .where(eq(schema.configuracion.clave, 'nombre'))
  return fila?.valor ?? 'Don Pancho & Burger'
}

/** Menú vigente (categorías y productos activos) para cargar ventas de mostrador. */
export async function listarMenuActivo() {
  const filas = await db
    .select({
      categoriaId: schema.categorias.id,
      categoria: schema.categorias.nombre,
      productoId: schema.productos.id,
      nombre: schema.productos.nombre,
      precio: schema.productos.precio,
    })
    .from(schema.productos)
    .innerJoin(schema.categorias, eq(schema.productos.categoriaId, schema.categorias.id))
    .where(and(eq(schema.productos.activo, true), eq(schema.categorias.activa, true)))
    .orderBy(asc(schema.categorias.orden), asc(schema.productos.orden), asc(schema.productos.id))

  const porCategoria = new Map<number, { id: number; nombre: string; productos: { id: number; nombre: string; precio: number }[] }>()
  for (const f of filas) {
    const grupo = porCategoria.get(f.categoriaId) ?? { id: f.categoriaId, nombre: f.categoria, productos: [] }
    grupo.productos.push({ id: f.productoId, nombre: f.nombre, precio: f.precio })
    porCategoria.set(f.categoriaId, grupo)
  }
  return [...porCategoria.values()]
}
