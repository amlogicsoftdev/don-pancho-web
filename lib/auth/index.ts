import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db'

// Configuración de Better Auth (solo servidor). Variables: BETTER_AUTH_SECRET y BETTER_AUTH_URL.
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.usuarios,
      session: schema.sesiones,
      account: schema.cuentas,
      verification: schema.verificaciones,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // No hay registro público: los usuarios los crea el dueño desde el panel.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      // `input: false`: el rol y el estado nunca se aceptan desde el navegador.
      rol: { type: 'string', required: true, defaultValue: 'empleado', input: false },
      activo: { type: 'boolean', required: true, defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 12, // 12 horas: un turno de trabajo
    updateAge: 60 * 60,
  },
  databaseHooks: {
    session: {
      create: {
        // Un usuario desactivado no puede iniciar sesión.
        before: async (sesion) => {
          const [usuario] = await db
            .select({ activo: schema.usuarios.activo })
            .from(schema.usuarios)
            .where(eq(schema.usuarios.id, sesion.userId))
          if (!usuario?.activo) return false
        },
      },
    },
  },
  // Debe ir último.
  plugins: [nextCookies()],
})
