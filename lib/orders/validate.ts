// Validación del pedido que llega desde la web. Todo lo que viene del navegador es
// información no confiable: acá solo se aceptan los campos esperados, con tipos y largos acotados.
// Los precios y el total NO se leen del navegador; se recalculan en el servidor (create.ts).

export const MODALIDADES = ['delivery', 'retiro'] as const
export const METODOS_PAGO = ['efectivo', 'transferencia'] as const

export type Modalidad = (typeof MODALIDADES)[number]
export type MetodoPago = (typeof METODOS_PAGO)[number]

export interface ItemPedidoEntrada {
  productoId: number
  cantidad: number
  aclaraciones: string | null
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

function validarItems(crudos: unknown): ResultadoItems {
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
    const { productoId, cantidad, aclaraciones } = crudo as Record<string, unknown>
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
    items.push({ productoId: productoId as number, cantidad: cantidad as number, aclaraciones: aclaracion })
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
  clienteNombre: string | null
  notas: string | null
  items: ItemPedidoEntrada[]
  /** Descuento de esta venta, en porcentaje entero (0 = sin descuento). */
  descuentoPorcentaje: number
}

type ResultadoMostrador = { ok: true; venta: VentaMostradorEntrada } | { ok: false; error: string }

/** Venta cargada a mano en el mostrador: no pide teléfono ni dirección. */
export function validarVentaMostrador(cuerpo: unknown): ResultadoMostrador {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return { ok: false, error: 'La venta no es válida.' }
  }
  const dato = cuerpo as Record<string, unknown>

  if (!esEnum(METODOS_PAGO, dato.metodoPago)) {
    return { ok: false, error: 'Elegí efectivo o transferencia.' }
  }
  const nombre = texto(dato.clienteNombre, LIMITES.nombre)
  const notas = texto(dato.notas, LIMITES.notas)
  if (nombre === undefined || notas === undefined) {
    return { ok: false, error: 'Algún dato de la venta es demasiado largo o no es válido.' }
  }
  const resultadoItems = validarItems(dato.items)
  if (!resultadoItems.ok) return resultadoItems

  const descuento = dato.descuentoPorcentaje ?? 0
  if (typeof descuento !== 'number' || !Number.isInteger(descuento) || descuento < 0 || descuento > 100) {
    return { ok: false, error: 'El descuento debe ser un número entero entre 0 y 100.' }
  }

  return {
    ok: true,
    venta: {
      metodoPago: dato.metodoPago,
      clienteNombre: nombre,
      notas,
      items: resultadoItems.items,
      descuentoPorcentaje: descuento,
    },
  }
}
