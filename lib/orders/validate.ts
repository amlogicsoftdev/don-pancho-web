// Validación del pedido que llega desde la web. Todo lo que viene del navegador es
// información no confiable: acá solo se aceptan los campos esperados, con tipos y largos acotados.
// Los precios y el total NO se leen del navegador; se recalculan en el servidor (create.ts).

import { esPorcentajeValido, TIEMPOS_ENTREGA } from './estados'

export const MODALIDADES = ['delivery', 'retiro'] as const
export const METODOS_PAGO = ['efectivo', 'transferencia'] as const

export type Modalidad = (typeof MODALIDADES)[number]
export type MetodoPago = (typeof METODOS_PAGO)[number]

export interface ItemPedidoEntrada {
  productoId: number
  cantidad: number
  aclaraciones: string | null
  /** Descuento de la línea en porcentaje entero. Solo lo carga el local: los pedidos de la web van en 0. */
  descuentoPorcentaje: number
}

export interface PedidoEntrada {
  modalidad: Modalidad
  metodoPago: MetodoPago
  clienteNombre: string
  clienteTelefono: string
  direccion: string | null
  referencia: string | null
  notas: string | null
  items: ItemPedidoEntrada[]
}

export const LIMITES = {
  nombre: 80,
  direccion: 200,
  referencia: 200,
  notas: 300,
  aclaraciones: 200,
  maxLineas: 30,
  maxCantidad: 50,
  telefonoMin: 8,
  telefonoMax: 15,
} as const

type Resultado = { ok: true; pedido: PedidoEntrada } | { ok: false; error: string }

function texto(valor: unknown, max: number): string | null | undefined {
  // undefined = tipo inválido; null = vacío o ausente.
  if (valor === undefined || valor === null) return null
  if (typeof valor !== 'string') return undefined
  const limpio = valor.trim()
  if (limpio.length === 0) return null
  if (limpio.length > max) return undefined
  return limpio
}

function esEnum<T extends string>(valores: readonly T[], valor: unknown): valor is T {
  return typeof valor === 'string' && (valores as readonly string[]).includes(valor)
}

/** Deja solo los dígitos: "+54 3442 66-8413" → "543442668413". */
export function normalizarTelefono(valor: string): string {
  return valor.replace(/\D/g, '')
}

type ResultadoItems = { ok: true; items: ItemPedidoEntrada[] } | { ok: false; error: string }

// `conDescuento` solo se activa para las ventas del panel: el descuento que mande el navegador
// del cliente en un pedido de la web se ignora.
function validarItems(crudos: unknown, conDescuento = false): ResultadoItems {
  if (!Array.isArray(crudos) || crudos.length === 0) {
    return { ok: false, error: 'El pedido no tiene productos.' }
  }
  if (crudos.length > LIMITES.maxLineas) {
    return { ok: false, error: 'El pedido tiene demasiados productos.' }
  }

  const items: ItemPedidoEntrada[] = []
  for (const crudo of crudos) {
    if (typeof crudo !== 'object' || crudo === null) {
      return { ok: false, error: 'Hay un producto inválido en el pedido.' }
    }
    const { productoId, cantidad, aclaraciones, descuentoPorcentaje } = crudo as Record<string, unknown>
    if (!Number.isInteger(productoId) || (productoId as number) <= 0) {
      return { ok: false, error: 'Hay un producto inválido en el pedido.' }
    }
    if (!Number.isInteger(cantidad) || (cantidad as number) < 1 || (cantidad as number) > LIMITES.maxCantidad) {
      return { ok: false, error: `La cantidad de cada producto debe estar entre 1 y ${LIMITES.maxCantidad}.` }
    }
    const aclaracion = texto(aclaraciones, LIMITES.aclaraciones)
    if (aclaracion === undefined) {
      return { ok: false, error: 'Una aclaración es demasiado larga.' }
    }
    const descuento = conDescuento ? (descuentoPorcentaje ?? 0) : 0
    if (!esPorcentajeValido(descuento)) {
      return { ok: false, error: 'El descuento debe ser un número entero entre 0 y 100.' }
    }
    items.push({
      productoId: productoId as number,
      cantidad: cantidad as number,
      aclaraciones: aclaracion,
      descuentoPorcentaje: descuento,
    })
  }
  return { ok: true, items }
}

export function validarPedido(cuerpo: unknown): Resultado {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return { ok: false, error: 'El pedido no es válido.' }
  }
  const dato = cuerpo as Record<string, unknown>

  if (!esEnum(MODALIDADES, dato.modalidad)) {
    return { ok: false, error: 'Elegí delivery o retiro.' }
  }
  if (!esEnum(METODOS_PAGO, dato.metodoPago)) {
    return { ok: false, error: 'Elegí efectivo o transferencia.' }
  }

  const nombre = texto(dato.clienteNombre, LIMITES.nombre)
  if (!nombre) return { ok: false, error: 'Ingresá tu nombre.' }

  const telefonoCrudo = texto(dato.clienteTelefono, 30)
  const telefono = telefonoCrudo ? normalizarTelefono(telefonoCrudo) : ''
  if (telefono.length < LIMITES.telefonoMin || telefono.length > LIMITES.telefonoMax) {
    return { ok: false, error: 'Ingresá un teléfono válido para poder confirmarte el pedido.' }
  }

  const direccion = texto(dato.direccion, LIMITES.direccion)
  const referencia = texto(dato.referencia, LIMITES.referencia)
  const notas = texto(dato.notas, LIMITES.notas)
  if (direccion === undefined || referencia === undefined || notas === undefined) {
    return { ok: false, error: 'Algún dato del pedido es demasiado largo o no es válido.' }
  }
  if (dato.modalidad === 'delivery' && !direccion) {
    return { ok: false, error: 'Ingresá la dirección de entrega.' }
  }

  const resultadoItems = validarItems(dato.items)
  if (!resultadoItems.ok) return resultadoItems
  const items = resultadoItems.items

  return {
    ok: true,
    pedido: {
      modalidad: dato.modalidad,
      metodoPago: dato.metodoPago,
      clienteNombre: nombre,
      clienteTelefono: telefono,
      // En retiro no hace falta dirección: no se guarda aunque venga.
      direccion: dato.modalidad === 'delivery' ? direccion : null,
      referencia: dato.modalidad === 'delivery' ? referencia : null,
      notas,
      items,
    },
  }
}

export interface VentaMostradorEntrada {
  metodoPago: MetodoPago
  modalidad: Modalidad
  clienteNombre: string | null
  /** Solo dígitos. Opcional: hace falta para avisarle por WhatsApp. */
  clienteTelefono: string | null
  /** Obligatoria si es delivery. */
  direccion: string | null
  notas: string | null
  /** Cada línea trae su propio descuento (`descuentoPorcentaje`, 0 = sin descuento). */
  items: ItemPedidoEntrada[]
  /** Tiempo de entrega informado, en minutos (uno de TIEMPOS_ENTREGA). */
  tiempoEstimadoMin: number
}

type ResultadoMostrador = { ok: true; venta: VentaMostradorEntrada } | { ok: false; error: string }

/**
 * Venta cargada en el mostrador: para retirar o delivery (con dirección). El teléfono es
 * opcional y solo sirve para avisarle al cliente por WhatsApp.
 */
export function validarVentaMostrador(cuerpo: unknown): ResultadoMostrador {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return { ok: false, error: 'La venta no es válida.' }
  }
  const dato = cuerpo as Record<string, unknown>

  if (!esEnum(METODOS_PAGO, dato.metodoPago)) {
    return { ok: false, error: 'Elegí efectivo o transferencia.' }
  }
  if (!esEnum(MODALIDADES, dato.modalidad)) {
    return { ok: false, error: 'Elegí retiro o delivery.' }
  }
  const nombre = texto(dato.clienteNombre, LIMITES.nombre)
  const notas = texto(dato.notas, LIMITES.notas)
  const direccion = texto(dato.direccion, LIMITES.direccion)
  const telefonoCrudo = texto(dato.clienteTelefono, 30)
  if (nombre === undefined || notas === undefined || direccion === undefined || telefonoCrudo === undefined) {
    return { ok: false, error: 'Algún dato de la venta es demasiado largo o no es válido.' }
  }
  if (dato.modalidad === 'delivery' && !direccion) {
    return { ok: false, error: 'Para delivery, cargá la dirección de entrega.' }
  }
  const telefono = telefonoCrudo ? normalizarTelefono(telefonoCrudo) : null
  if (telefono !== null && (telefono.length < LIMITES.telefonoMin || telefono.length > LIMITES.telefonoMax)) {
    return { ok: false, error: 'El teléfono no es válido (o dejalo vacío).' }
  }

  const resultadoItems = validarItems(dato.items, true)
  if (!resultadoItems.ok) return resultadoItems

  if (!esTiempoEntrega(dato.tiempoEstimadoMin)) {
    return { ok: false, error: 'Elegí el tiempo de entrega.' }
  }

  return {
    ok: true,
    venta: {
      metodoPago: dato.metodoPago,
      modalidad: dato.modalidad,
      clienteNombre: nombre,
      clienteTelefono: telefono,
      direccion: dato.modalidad === 'delivery' ? direccion : null,
      notas,
      items: resultadoItems.items,
      tiempoEstimadoMin: dato.tiempoEstimadoMin,
    },
  }
}

/** Tiempo de entrega válido: uno de los que ofrece el cuadro de confirmación. */
export function esTiempoEntrega(valor: unknown): valor is number {
  return typeof valor === 'number' && (TIEMPOS_ENTREGA as readonly number[]).includes(valor)
}
