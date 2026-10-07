'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { guardarProducto, pedirFirmaSubida } from '@/lib/menu/actions'

const FORMATOS = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

interface Props {
  categorias: { id: number; nombre: string }[]
  cloudinaryListo: boolean
  inicial: {
    id: number | null
    categoriaId: number
    nombre: string
    descripcion: string
    precio: number
    etiqueta: string
    imagenUrl: string
    activo: boolean
  }
}

export function FormularioProducto({ categorias, cloudinaryListo, inicial }: Props) {
  const router = useRouter()
  const [imagenUrl, setImagenUrl] = useState(inicial.imagenUrl)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enCurso, iniciar] = useTransition()

  async function subirImagen(archivo: File) {
    setError(null)
    if (!FORMATOS.includes(archivo.type)) return setError('La imagen tiene que ser JPG, PNG o WebP.')
    if (archivo.size > MAX_MB * 1024 * 1024) return setError(`La imagen pesa más de ${MAX_MB} MB. Probá con una más liviana.`)

    setSubiendo(true)
    try {
      // La firma la genera el servidor (solo el dueño puede pedirla); el archivo va directo a Cloudinary.
      const firma = await pedirFirmaSubida()
      if (!firma.ok) return setError(firma.error)

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
        return setError(resultado?.error?.message ?? 'No se pudo subir la imagen. Probá de nuevo.')
      }
      setImagenUrl(resultado.secure_url)
    } catch {
      setError('No se pudo subir la imagen. Revisá tu conexión.')
    } finally {
      setSubiendo(false)
    }
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setError(null)

    iniciar(async () => {
      const resultado = await guardarProducto({
        id: inicial.id,
        categoriaId: Number(datos.get('categoriaId')),
        nombre: datos.get('nombre'),
        descripcion: datos.get('descripcion'),
        precio: Number(datos.get('precio')),
        etiqueta: datos.get('etiqueta'),
        imagenUrl,
        activo: datos.get('activo') === 'on',
      })
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      router.push('/admin/menu')
      router.refresh()
    })
  }

  return (
    <form onSubmit={enviar} className="pn-card space-y-5 p-5 sm:p-6">
      <label className="block">
        <span className="pn-label">Nombre</span>
        <input name="nombre" required maxLength={80} defaultValue={inicial.nombre} className="pn-field" />
      </label>

      <label className="block">
        <span className="pn-label">Descripción</span>
        <textarea name="descripcion" rows={3} maxLength={300} defaultValue={inicial.descripcion} className="pn-field" />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="pn-label">Precio ($)</span>
          <input
            name="precio"
            type="number"
            required
            min={1}
            step={1}
            inputMode="numeric"
            defaultValue={inicial.precio || ''}
            className="pn-field"
          />
        </label>
        <label className="block">
          <span className="pn-label">Categoría</span>
          <select name="categoriaId" defaultValue={inicial.categoriaId} className="pn-field">
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="pn-label">Etiqueta (opcional)</span>
          <input name="etiqueta" maxLength={30} defaultValue={inicial.etiqueta} placeholder="Ej.: Más pedida" className="pn-field" />
        </label>
      </div>

      {/* Imagen: la vista previa a la izquierda y, al lado, cómo cambiarla */}
      <div className="border-y-2 border-dotted border-pancho-black/25 py-5">
        <span className="pn-label">Imagen</span>
        <div className="flex flex-wrap items-start gap-5">
          {imagenUrl ? (
            <div className="relative size-36 flex-none overflow-hidden border-2 border-pancho-black bg-pancho-paper">
              <Image src={imagenUrl} alt="Vista previa de la imagen del producto" fill sizes="144px" className="object-cover" />
            </div>
          ) : (
            <div className="pn-muted grid size-36 flex-none place-items-center border-2 border-dashed border-pancho-black/35 p-3 text-center text-xs font-semibold">
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
                  className="max-w-full text-xs font-semibold file:mr-3 file:h-10 file:cursor-pointer file:rounded-xs file:border-2 file:border-solid file:border-pancho-black file:bg-white file:px-3 file:font-sans file:text-[0.6875rem] file:font-extrabold file:tracking-[0.06em] file:text-pancho-black file:uppercase"
                />
                {subiendo && <span className="pn-muted font-semibold">Subiendo…</span>}
                {imagenUrl && !subiendo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImagenUrl('')}>
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

      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
        <input type="checkbox" name="activo" defaultChecked={inicial.activo} className="pn-check" />
        Dado de alta (se muestra en la carta)
      </label>

      {error && (
        <p role="alert" className="pn-alert pn-alert--error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="default" size="lg" disabled={enCurso || subiendo}>
          {enCurso ? 'Guardando…' : 'Guardar producto'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/menu')} disabled={enCurso}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
