import { headers } from 'next/headers'

/**
 * Dirección base del sitio (por ejemplo, https://donpancho.com.ar) a partir de la request
 * actual, para armar links absolutos. Funciona igual en local y en Vercel. Solo en el servidor.
 */
export async function urlDelSitio(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const protocolo = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocolo}://${host}`
}
