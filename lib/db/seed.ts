// Carga datos iniciales de desarrollo: menú actual, configuración del local y un usuario dueño.
// Uso: npm run db:seed (lee .env.local). Se puede correr más de una vez sin duplicar datos.
import { hashPassword } from 'better-auth/crypto'
import { randomUUID } from 'node:crypto'
import { db, schema } from './index'
import { CATEGORIES, PRODUCTS, SITE_CONFIG } from '../data'

async function sembrarMenu() {
  const existentes = await db.select().from(schema.categorias)
  if (existentes.length > 0) {
    console.log('Menú: ya hay categorías cargadas, se omite.')
    return
  }

  const nombres = CATEGORIES.filter((c) => c !== 'Todas')
  const categorias = await db
    .insert(schema.categorias)
    .values(nombres.map((nombre, orden) => ({ nombre, orden })))
    .returning()
  const idPorNombre = new Map(categorias.map((c) => [c.nombre, c.id]))

  await db.insert(schema.productos).values(
    PRODUCTS.map((p, orden) => ({
      categoriaId: idPorNombre.get(p.category)!,
      nombre: p.name,
      descripcion: p.description,
      precio: p.price,
      imagenUrl: p.image,
      etiqueta: p.badge ?? null,
      orden,
    })),
  )
  console.log(`Menú: ${categorias.length} categorías y ${PRODUCTS.length} productos.`)
}

async function sembrarConfiguracion() {
  await db
    .insert(schema.configuracion)
    .values([
      { clave: 'nombre', valor: SITE_CONFIG.name },
      { clave: 'whatsapp', valor: SITE_CONFIG.whatsappNumber },
      { clave: 'direccion', valor: SITE_CONFIG.address },
      { clave: 'horario', valor: SITE_CONFIG.schedule },
    ])
    .onConflictDoNothing()
  console.log('Configuración del local cargada.')
}

async function sembrarDueno() {
  const email = process.env.SEED_OWNER_EMAIL
  const password = process.env.SEED_OWNER_PASSWORD
  if (!email || !password) {
    console.log('Usuario dueño: faltan SEED_OWNER_EMAIL y SEED_OWNER_PASSWORD en .env.local, se omite.')
    return
  }

  const id = randomUUID()
  const insertado = await db
    .insert(schema.usuarios)
    .values({ id, name: 'Dueño de prueba', email: email.toLowerCase(), rol: 'dueno', emailVerified: true })
    .onConflictDoNothing()
    .returning({ id: schema.usuarios.id })

  if (insertado.length === 0) {
    console.log('Usuario dueño: ya existe, se omite.')
    return
  }

  await db.insert(schema.cuentas).values({
    id: randomUUID(),
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: await hashPassword(password),
  })
  console.log(`Usuario dueño creado: ${email}`)
}

async function main() {
  await sembrarMenu()
  await sembrarConfiguracion()
  await sembrarDueno()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
