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
  /** Link de Instagram (la única red del local), o texto vacío para no mostrarlo. */
  instagram: string
}

/** Datos que el local puede dejar vacíos a propósito (la red). */
export const CAMPOS_OPCIONALES: readonly (keyof DatosLocal)[] = ['instagram']

export const CLAVES_LOCAL: Record<keyof DatosLocal, string> = {
  nombre: 'nombre',
  whatsapp: 'whatsapp',
  direccion: 'direccion',
  horario: 'horario',
  instagram: 'instagram',
}

/** Valores por defecto si la base no tiene un dato (o no responde). */
export const DATOS_LOCAL_POR_DEFECTO: DatosLocal = {
  nombre: SITE_CONFIG.name,
  whatsapp: SITE_CONFIG.whatsappNumber,
  direccion: SITE_CONFIG.address,
  horario: SITE_CONFIG.schedule,
  instagram: SITE_CONFIG.socialLinks.instagram,
}
