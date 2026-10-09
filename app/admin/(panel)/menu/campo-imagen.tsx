'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { pedirFirmaSubida } from '@/lib/menu/actions'

const FORMATOS = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

interface Props {
  url: string
  onCambiar: (url: string) => void
  /** Avisa mientras se sube, para que el formulario no se guarde a medias. */
  onSubiendo: (subiendo: boolean) => void
  onError: (error: string | null) => void
  cloudinaryListo: boolean
}

/** Foto de un producto o de un plato: la vista previa a la izquierda y, al lado, cómo cambiarla. */
export function CampoImagen({ url, onCambiar, onSubiendo, onError, cloudinaryListo }: Props) {
  const [subiendo, setSubiendo] = useState(false)

  function marcarSubiendo(valor: boolean) {
    setSubiendo(valor)
    onSubiendo(valor)
  }

  async function subirImagen(archivo: File) {
    onError(null)
    if (!FORMATOS.includes(archivo.type)) return onError('La imagen tiene que ser JPG, PNG o WebP.')
    if (archivo.size > MAX_MB * 1024 * 1024) return onError(`La imagen pesa más de ${MAX_MB} MB. Probá con una más liviana.`)

    marcarSubiendo(true)
    try {
      // La firma la genera el servidor (solo el dueño puede pedirla); el archivo va directo a Cloudinary.
      const firma = await pedirFirmaSubida()
      if (!firma.ok) return onError(firma.error)

      const datos = new FormData()
      datos.append('file', archivo)
      datos.append('api_key', firma.firma.apiKey)
      datos.append('timestamp', String(firma.firma.timestamp))
      datos.append('folder', firma.firma.folder)
      datos.append('allowed_formats', firma.firma.allowedFormats)
      datos.append('signature', firma.firma.signature)

      const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${firma.firma.cloudName}/image/upload`, {
        method: 'POST',
        body: datos,
      })
      const resultado = await respuesta.json().catch(() => ({}))
      if (!respuesta.ok || typeof resultado.secure_url !== 'string') {
        return onError(resultado?.error?.message ?? 'No se pudo subir la imagen. Probá de nuevo.')
      }
      onCambiar(resultado.secure_url)
    } catch {
      onError('No se pudo subir la imagen. Revisá tu conexión.')
    } finally {
      marcarSubiendo(false)
    }
  }

  return (
    <div className="border-y border-pancho-black/10 py-5">
      <span className="pn-label">Imagen</span>
      <div className="flex flex-wrap items-start gap-5">
        {url ? (
          <div className="relative size-36 flex-none overflow-hidden border border-pancho-black/15 bg-pancho-paper">
            <Image src={url} alt="Vista previa de la imagen del producto" fill sizes="144px" className="object-cover" />
          </div>
        ) : (
          <div className="pn-muted grid size-36 flex-none place-items-center border border-dashed border-pancho-black/25 p-3 text-center text-xs font-semibold">
            Sin imagen: en la carta se muestra el logo.
          </div>
        )}

        <div className="min-w-56 flex-1 space-y-3 text-sm">
          {cloudinaryListo ? (
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept={FORMATOS.join(',')}
                disabled={subiendo}
                aria-label="Elegir imagen del producto"
                onChange={(e) => {
                  const archivo = e.target.files?.[0]
                  if (archivo) void subirImagen(archivo)
                  e.target.value = ''
                }}
                className="max-w-full text-xs font-semibold file:mr-3 file:h-10 file:cursor-pointer file:rounded-xs file:border file:border-solid file:border-pancho-black/25 file:bg-white file:px-3 file:font-sans file:text-[0.6875rem] file:font-extrabold file:tracking-[0.06em] file:text-pancho-black file:uppercase"
              />
              {subiendo && <span className="pn-muted font-semibold">Subiendo…</span>}
              {url && !subiendo && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onCambiar('')}>
                  Quitar imagen
                </Button>
              )}
            </div>
          ) : (
            <p className="pn-alert pn-alert--warn">
              La subida de imágenes todavía no está configurada (faltan las claves de Cloudinary en el servidor).
            </p>
          )}
          <p className="pn-muted text-xs font-medium">JPG, PNG o WebP, hasta {MAX_MB} MB. Se ve mejor una foto cuadrada.</p>
        </div>
      </div>
    </div>
  )
}
