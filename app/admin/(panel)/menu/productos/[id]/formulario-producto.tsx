'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { guardarProducto } from '@/lib/menu/actions'
import { CampoImagen } from '../../campo-imagen'

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

      <CampoImagen
        url={imagenUrl}
        onCambiar={setImagenUrl}
        onSubiendo={setSubiendo}
        onError={setError}
        cloudinaryListo={cloudinaryListo}
      />

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
