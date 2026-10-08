import 'server-only'
import { and, asc, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { leerDatosLocal } from '@/lib/local/queries'
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

/** Cómo se entrega el pedido: todos, solo delivery o solo retiro. */
export type FiltroEntrega = 'todas' | 'delivery' | 'retiro'

export function esFiltroEntrega(valor: unknown): valor is FiltroEntrega {
  return valor === 'todas' || valor === 'delivery' || valor === 'retiro'
}

const porEntrega = (entrega: FiltroEntrega) =>
  entrega === 'todas' ? undefined : eq(schema.pedidos.modalidad, entrega)

/** Lista de pedidos sin los borrados, el más nuevo primero. */
export async function listarPedidos(filtro: FiltroPedidos, entrega: FiltroEntrega = 'todas') {
  const estados = ESTADOS_POR_FILTRO[filtro]
  return db
    .select()
    .from(schema.pedidos)
    .where(
      and(
        isNull(schema.pedidos.borradoEn),
        estados ? inArray(schema.pedidos.estado, [...estados]) : undefined,
        porEntrega(entrega),
      ),
    )
    .orderBy(desc(schema.pedidos.creadoEn))
    .limit(200)
}

/**
 * Busca pedidos (sin los borrados, en cualquier estado) por número, nombre, teléfono o
 * dirección. El texto se usa como dato, nunca como SQL: va parametrizado y sin comodines.
 */
export async function buscarPedidos(texto: string, entrega: FiltroEntrega = 'todas') {
  const limpio = texto.trim().slice(0, 80)
  if (!limpio) return []

  // Los comodines de LIKE (% y _) se escapan: se busca el texto tal cual
  const patron = `%${limpio.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
  const digitos = limpio.replace(/\D/g, '')
  const condiciones = [
    ilike(schema.pedidos.clienteNombre, patron),
    ilike(schema.pedidos.direccion, patron),
    // El teléfono se guarda solo con dígitos: "3442 66-8413" encuentra "3442668413"
    ...(digitos.length >= 3 ? [ilike(schema.pedidos.clienteTelefono, `%${digitos}%`)] : []),
    // Número de pedido: "152" o "0152"
    ...(digitos.length > 0 && digitos.length <= 9 && digitos === limpio.replace(/^#/, '')
      ? [eq(schema.pedidos.numero, Number(digitos))]
      : []),
  ]

  return db
    .select()
    .from(schema.pedidos)
    .where(and(isNull(schema.pedidos.borradoEn), or(...condiciones), porEntrega(entrega)))
    .orderBy(desc(schema.pedidos.creadoEn))
    .limit(50)
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

/** Nombre del local para mensajes y comandas: el mismo que se edita en Ajustes → Datos del local. */
export async function leerNombreLocal(): Promise<string> {
  return (await leerDatosLocal()).nombre
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
