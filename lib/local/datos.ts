import { SITE_CONFIG } from '@/lib/data'

// Datos públicos del local (los que ve el cliente en el sitio). Viven en la tabla
// `configuracion` y el dueño los edita en el panel (Menú → Ajustes). Este archivo no toca
// la base: lo pueden usar el servidor y el navegador.

export interface DatosLocal {
  nombre: string
  /** WhatsApp del local en formato internacional: 549 + área + número. */
  whatsapp: string
  direccion: string
  horario: string
  // Redes: link completo, o texto vacío si el local no tiene esa red (no se muestra)
  instagram: string
  facebook: string
  tiktok: string
}

/** Datos que el local puede dejar vacíos a propósito (las redes). */
export const CAMPOS_OPCIONALES: readonly (keyof DatosLocal)[] = ['instagram', 'facebook', 'tiktok']

export const CLAVES_LOCAL: Record<keyof DatosLocal, string> = {
  nombre: 'nombre',
  whatsapp: 'whatsapp',
  direccion: 'direccion',
  horario: 'horario',
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
}

/** Valores por defecto si la base no tiene un dato (o no responde). */
export const DATOS_LOCAL_POR_DEFECTO: DatosLocal = {
  nombre: SITE_CONFIG.name,
  whatsapp: SITE_CONFIG.whatsappNumber,
  direccion: SITE_CONFIG.address,
  horario: SITE_CONFIG.schedule,
  instagram: SITE_CONFIG.socialLinks.instagram,
  facebook: SITE_CONFIG.socialLinks.facebook,
  tiktok: SITE_CONFIG.socialLinks.tiktok,
}
