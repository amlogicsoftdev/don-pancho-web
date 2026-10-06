'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { guardarProducto, pedirFirmaSubida } from '@/lib/menu/actions'

const CAMPO = 'h-10 w-full rounded-lg border border-white/15 bg-pancho-black px-3 outline-none focus:border-pancho-orange'
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
    <form onSubmit={enviar} className="space-y-4 rounded-xl border border-white/10 bg-pancho-surface p-4">
      <label className="block text-sm">
        <span className="mb-1 block text-pancho-muted">Nombre</span>
        <input name="nombre" required maxLength={80} defaultValue={inicial.nombre} className={CAMPO} />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-pancho-muted">Descripción</span>
        <textarea
          name="descripcion"
          rows={3}
          maxLength={300}
          defaultValue={inicial.descripcion}
          className="w-full rounded-lg border border-white/15 bg-pancho-black p-3 outline-none focus:border-pancho-orange"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-pancho-muted">Precio ($)</span>
          <input name="precio" type="number" required min={1} step={1} inputMode="numeric" defaultValue={inicial.precio || ''} className={CAMPO} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-pancho-muted">Categoría</span>
          <select name="categoriaId" defaultValue={inicial.categoriaId} className={CAMPO}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-pancho-muted">Etiqueta (opcional)</span>
          <input name="etiqueta" maxLength={30} defaultValue={inicial.etiqueta} placeholder="Ej.: Más pedida" className={CAMPO} />
        </label>
      </div>

      <div className="space-y-2 text-sm">
        <span className="block text-pancho-muted">Imagen</span>
        {imagenUrl ? (
          <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-white/15">
            <Image src={imagenUrl} alt="Vista previa de la imagen del producto" fill sizes="160px" className="object-cover" />
          </div>
        ) : (
          <p className="text-pancho-muted">Sin imagen: en la carta se muestra el logo.</p>
        )}
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
              className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-pancho-cream"
            />
            {subiendo && <span className="text-pancho-muted">Subiendo…</span>}
            {imagenUrl && !subiendo && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setImagenUrl('')}>
                Quitar imagen
              </Button>
            )}
          </div>
        ) : (
          <p className="text-amber-300">
            La subida de imágenes todavía no está configurada (faltan las claves de Cloudinary en el servidor).
          </p>
        )}
        <p className="text-xs text-pancho-muted">JPG, PNG o WebP, hasta {MAX_MB} MB. Se ve mejor una foto cuadrada.</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activo" defaultChecked={inicial.activo} className="size-4 accent-pancho-orange" />
        Activo (se muestra en la carta)
      </label>

      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={enCurso || subiendo} className="h-10 bg-pancho-orange px-4 text-pancho-black hover:bg-pancho-orange-deep">
          {enCurso ? 'Guardando…' : 'Guardar producto'}
        </Button>
        <Button type="button" variant="ghost" size="lg" className="h-10" onClick={() => router.push('/admin/menu')} disabled={enCurso}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
