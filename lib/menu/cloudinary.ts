import { createHash } from 'node:crypto'

// Subida de imágenes a Cloudinary con firma. El navegador sube el archivo directo a Cloudinary
// (no pasa por nuestro servidor) y nosotros solo guardamos la URL. La clave secreta nunca sale
// del servidor: acá se firma el pedido de subida, y solo lo puede pedir el dueño.
//
// Variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.

const CARPETA = 'don-pancho/productos'
const FORMATOS = 'jpg,png,webp'

export interface FirmaSubida {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  allowedFormats: string
  signature: string
}

function leerCredenciales() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

export const cloudinaryConfigurado = () => leerCredenciales() !== null

/** Firma una subida. Los parámetros se ordenan alfabéticamente, como pide Cloudinary. */
export function firmarSubida(): FirmaSubida | null {
  const credenciales = leerCredenciales()
  if (!credenciales) return null

  const timestamp = Math.floor(Date.now() / 1000)
  const aFirmar = `allowed_formats=${FORMATOS}&folder=${CARPETA}&timestamp=${timestamp}`
  const signature = createHash('sha1').update(aFirmar + credenciales.apiSecret).digest('hex')

  return {
    cloudName: credenciales.cloudName,
    apiKey: credenciales.apiKey,
    timestamp,
    folder: CARPETA,
    allowedFormats: FORMATOS,
    signature,
  }
}

/** Solo se aceptan imágenes que estén en la cuenta de Cloudinary del local. */
export function esUrlDeCloudinary(url: string): boolean {
  const credenciales = leerCredenciales()
  if (!credenciales) return false
  return url.startsWith(`https://res.cloudinary.com/${credenciales.cloudName}/`)
}
