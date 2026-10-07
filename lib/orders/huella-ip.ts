import { createHash } from 'node:crypto'

/**
 * Huella de la IP: hash SHA-256 con un secreto del servidor. Sirve para contar pedidos por
 * conexión sin guardar la IP real (dato personal). Null si no hay IP o falta el secreto.
 */
export function huellaIp(ip: string | null): string | null {
  const secreto = process.env.BETTER_AUTH_SECRET
  if (!ip || !secreto) return null
  return createHash('sha256').update(`${secreto}:${ip}`).digest('base64url')
}
