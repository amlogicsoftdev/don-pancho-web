import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// Reglas generales (CLAUDE.md, sección 4):
// - Montos como enteros en pesos, sin decimales.
// - No se borra físicamente: `activo` en productos y `borrado_en` en pedidos.
// - Fechas en UTC; el "día" se calcula en America/Argentina/Buenos_Aires en la aplicación.

const fecha = (columna: string) => timestamp(columna, { withTimezone: true })

export const rolEnum = pgEnum('rol', ['dueno', 'empleado'])
export const origenEnum = pgEnum('origen_pedido', ['web', 'mostrador'])
export const estadoEnum = pgEnum('estado_pedido', [
  'pendiente',
  'en_preparacion',
  // Solo retiro: ya se puede pasar a buscar
  'listo',
  'en_camino',
  'entregado',
  'cancelado',
])
export const modalidadEnum = pgEnum('modalidad', ['delivery', 'retiro'])
export const metodoPagoEnum = pgEnum('metodo_pago', ['efectivo', 'transferencia'])
export const accionAnulacionEnum = pgEnum('accion_anulacion', ['cancelado', 'borrado'])

// --- Usuarios y autenticación (Better Auth) ---
// Las propiedades de JS conservan los nombres que espera Better Auth (name, email, ...);
// las tablas y columnas de la base están en español.

export const usuarios = pgTable('usuarios', {
  id: text('id').primaryKey(),
  name: text('nombre').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verificado').notNull().default(false),
  image: text('imagen'),
  rol: rolEnum('rol').notNull().default('empleado'),
  activo: boolean('activo').notNull().default(true),
  createdAt: fecha('creado_en').notNull().defaultNow(),
  updatedAt: fecha('actualizado_en').notNull().defaultNow(),
})

export const sesiones = pgTable(
  'sesiones',
  {
    id: text('id').primaryKey(),
    expiresAt: fecha('expira_en').notNull(),
    token: text('token').notNull().unique(),
    createdAt: fecha('creado_en').notNull().defaultNow(),
    updatedAt: fecha('actualizado_en').notNull().defaultNow(),
    ipAddress: text('ip'),
    userAgent: text('user_agent'),
    userId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
  },
  (t) => [index('sesiones_usuario_idx').on(t.userId)],
)

// Acá vive el hash de la contraseña (columna `password_hash`).
export const cuentas = pgTable(
  'cuentas',
  {
    id: text('id').primaryKey(),
    accountId: text('cuenta_id').notNull(),
    providerId: text('proveedor_id').notNull(),
    userId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: fecha('access_token_expira_en'),
    refreshTokenExpiresAt: fecha('refresh_token_expira_en'),
    scope: text('scope'),
    password: text('password_hash'),
    createdAt: fecha('creado_en').notNull().defaultNow(),
    updatedAt: fecha('actualizado_en').notNull().defaultNow(),
  },
  (t) => [index('cuentas_usuario_idx').on(t.userId)],
)

export const verificaciones = pgTable(
  'verificaciones',
  {
    id: text('id').primaryKey(),
    identifier: text('identificador').notNull(),
    value: text('valor').notNull(),
    expiresAt: fecha('expira_en').notNull(),
    createdAt: fecha('creado_en').notNull().defaultNow(),
    updatedAt: fecha('actualizado_en').notNull().defaultNow(),
  },
  (t) => [index('verificaciones_identificador_idx').on(t.identifier)],
)

// --- Catálogo ---

export const categorias = pgTable('categorias', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  nombre: text('nombre').notNull().unique(),
  orden: integer('orden').notNull().default(0),
  activa: boolean('activa').notNull().default(true),
})

export const productos = pgTable(
  'productos',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    categoriaId: integer('categoria_id')
      .notNull()
      .references(() => categorias.id),
    nombre: text('nombre').notNull(),
    descripcion: text('descripcion').notNull().default(''),
    precio: integer('precio').notNull(),
    imagenUrl: text('imagen_url'),
    etiqueta: text('etiqueta'),
    orden: integer('orden').notNull().default(0),
    activo: boolean('activo').notNull().default(true),
  },
  (t) => [index('productos_categoria_idx').on(t.categoriaId)],
)

// --- Pedidos ---

export const pedidos = pgTable(
  'pedidos',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    // Correlativo legible (se muestra con ceros: 0152). Lo asigna la base, sin repetidos.
    numero: integer('numero').notNull().unique().generatedAlwaysAsIdentity(),
    // Valor aleatorio no adivinable para el link de seguimiento.
    tokenSeguimiento: text('token_seguimiento').notNull().unique(),
    origen: origenEnum('origen').notNull().default('web'),
    estado: estadoEnum('estado').notNull().default('pendiente'),
    modalidad: modalidadEnum('modalidad').notNull(),
    metodoPago: metodoPagoEnum('metodo_pago').notNull(),
    pagoConfirmado: boolean('pago_confirmado').notNull().default(false),
    clienteNombre: text('cliente_nombre').notNull(),
    clienteTelefono: text('cliente_telefono').notNull(),
    direccion: text('direccion'),
    referencia: text('referencia'),
    notas: text('notas'),
    subtotal: integer('subtotal').notNull(),
    descuentoPorcentaje: integer('descuento_porcentaje').notNull().default(0),
    descuentoMonto: integer('descuento_monto').notNull().default(0),
    // Quién aplicó el descuento y cuándo (el descuento se carga en cada pedido, desde el panel).
    descuentoAplicadoPor: text('descuento_aplicado_por').references(() => usuarios.id),
    descuentoAplicadoEn: fecha('descuento_aplicado_en'),
    total: integer('total').notNull(),
    // Tiempo de entrega que el local le informa al cliente al confirmar, y la hora que resulta.
    tiempoEstimadoMin: integer('tiempo_estimado_min'),
    entregaEstimada: fecha('entrega_estimada'),
    // Veces que se imprimieron las comandas: desde la segunda sale la marca REIMPRESIÓN.
    comandasImpresas: integer('comandas_impresas').notNull().default(0),
    creadoEn: fecha('creado_en').notNull().defaultNow(),
    actualizadoEn: fecha('actualizado_en').notNull().defaultNow(),
    borradoEn: fecha('borrado_en'),
    // Solo en ventas de mostrador.
    creadoPor: text('creado_por').references(() => usuarios.id),
    // Solo en pedidos web: huella de la IP (hash con secreto, nunca la IP real) para el
    // límite de pedidos por conexión. Null si no se pudo leer la IP.
    ipHash: text('ip_hash'),
  },
  (t) => [
    index('pedidos_estado_idx').on(t.estado),
    index('pedidos_creado_en_idx').on(t.creadoEn),
    index('pedidos_ip_hash_idx').on(t.ipHash, t.creadoEn),
  ],
)

// Copia del nombre y del precio al momento de la venta: si el producto cambia después,
// las ventas viejas y los cierres de caja no se alteran.
export const pedidoItems = pgTable(
  'pedido_items',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    pedidoId: integer('pedido_id')
      .notNull()
      .references(() => pedidos.id),
    productoId: integer('producto_id').references(() => productos.id),
    nombre: text('nombre').notNull(),
    precioUnitario: integer('precio_unitario').notNull(),
    cantidad: integer('cantidad').notNull(),
    aclaraciones: text('aclaraciones'),
  },
  (t) => [index('pedido_items_pedido_idx').on(t.pedidoId)],
)

export const pedidoHistorial = pgTable(
  'pedido_historial',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    pedidoId: integer('pedido_id')
      .notNull()
      .references(() => pedidos.id),
    estadoAnterior: estadoEnum('estado_anterior'),
    estadoNuevo: estadoEnum('estado_nuevo').notNull(),
    // Null cuando el cambio lo hace el sistema (por ejemplo, al crear un pedido web).
    usuarioId: text('usuario_id').references(() => usuarios.id),
    creadoEn: fecha('creado_en').notNull().defaultNow(),
  },
  (t) => [index('pedido_historial_pedido_idx').on(t.pedidoId)],
)

export const anulaciones = pgTable('anulaciones', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  pedidoId: integer('pedido_id')
    .notNull()
    .references(() => pedidos.id),
  numeroPedido: integer('numero_pedido').notNull(),
  accion: accionAnulacionEnum('accion').notNull(),
  motivo: text('motivo').notNull(),
  usuarioId: text('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  creadoEn: fecha('creado_en').notNull().defaultNow(),
})

// --- Gastos y caja ---

export const gastos = pgTable(
  'gastos',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    // Día del gasto (YYYY-MM-DD), ya en horario de Buenos Aires.
    fecha: text('fecha').notNull(),
    descripcion: text('descripcion').notNull(),
    categoria: text('categoria').notNull(),
    monto: integer('monto').notNull(),
    metodoPago: metodoPagoEnum('metodo_pago').notNull(),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    creadoEn: fecha('creado_en').notNull().defaultNow(),
  },
  (t) => [index('gastos_fecha_idx').on(t.fecha)],
)

export const cierresCaja = pgTable(
  'cierres_caja',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    // Día cerrado (YYYY-MM-DD, horario de Buenos Aires).
    fecha: text('fecha').notNull(),
    efectivoEsperado: integer('efectivo_esperado').notNull(),
    efectivoContado: integer('efectivo_contado').notNull(),
    diferencia: integer('diferencia').notNull(),
    totalesPorMetodo: jsonb('totales_por_metodo').$type<Record<string, number>>().notNull(),
    gastosEfectivo: integer('gastos_efectivo').notNull().default(0),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    creadoEn: fecha('creado_en').notNull().defaultNow(),
  },
  (t) => [index('cierres_caja_fecha_idx').on(t.fecha)],
)

// --- Configuración (datos del local, WhatsApp, etc.) ---

export const configuracion = pgTable('configuracion', {
  clave: text('clave').primaryKey(),
  valor: text('valor').notNull(),
})
