'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { guardarPlato } from '@/lib/menu/actions'
import { etiquetaTamano } from '@/lib/menu/variantes'
import { CampoImagen } from '../../campo-imagen'

interface Fila {
  tamano: number | null
  descripcion: string
  precio: number | null
  precioPanceta: number | null
}

interface Props {
  categorias: { id: number; nombre: string }[]
  cloudinaryListo: boolean
  inicial: {
    id: number
    nombre: string
    categoriaId: number
    etiqueta: string
    imagenUrl: string
    activo: boolean
    filas: Fila[]
  }
}

/** Precio escrito en el campo: vacío = esa variante no va (null). */
const leerPrecio = (valor: string) => (valor.trim() === '' ? null : Number(valor))

/**
 * Un plato con todas sus variantes: lo común arriba (nombre, categoría, foto, etiqueta) y una
 * hoja por tamaño con su descripción y los precios sin y con panceta.
 */
export function FormularioPlato({ categorias, cloudinaryListo, inicial }: Props) {
  const router = useRouter()
  const [imagenUrl, setImagenUrl] = useState(inicial.imagenUrl)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enCurso, iniciar] = useTransition()
  const [filas, setFilas] = useState(
    inicial.filas.map((f) => ({
      tamano: f.tamano,
      descripcion: f.descripcion,
      precio: f.precio === null ? '' : String(f.precio),
      precioPanceta: f.precioPanceta === null ? '' : String(f.precioPanceta),
    })),
  )
  const unSoloTamano = filas.length === 1 && filas[0].tamano === null

  function cambiarFila(indice: number, cambio: Partial<(typeof filas)[number]>) {
    setFilas((actuales) => actuales.map((f, i) => (i === indice ? { ...f, ...cambio } : f)))
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setError(null)

    iniciar(async () => {
      const resultado = await guardarPlato({
        id: inicial.id,
        nombre: datos.get('nombre'),
        categoriaId: Number(datos.get('categoriaId')),
        etiqueta: datos.get('etiqueta'),
        imagenUrl,
        activo: datos.get('activo') === 'on',
        filas: filas.map((f) => ({
          tamano: f.tamano,
          descripcion: f.descripcion,
          precio: leerPrecio(f.precio),
          precioPanceta: leerPrecio(f.precioPanceta),
        })),
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
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block sm:col-span-3">
          <span className="pn-label">Nombre del plato</span>
          <input name="nombre" required maxLength={60} defaultValue={inicial.nombre} className="pn-field" />
          <span className="pn-muted mt-1 block text-xs font-medium">
            Sin el tamaño ni «con panceta»: en la carta se arma solo (DON CHEESE x2 (con panceta)).
          </span>
        </label>
        <label className="block sm:col-span-2">
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

      {/* Una hoja por tamaño: la descripción y los dos precios */}
      <fieldset className="space-y-3">
        <legend className="pn-label">{unSoloTamano ? 'Descripción y precios' : 'Tamaños'}</legend>
        {filas.map((fila, i) => {
          const titulo = fila.tamano === null ? null : etiquetaTamano(fila.tamano)
          return (
            <div key={fila.tamano ?? 'unico'} className="border border-pancho-black/12 bg-white/60 p-4">
              {titulo && <p className="mb-3 font-display text-2xl leading-none">{titulo}</p>}
              <label className="block">
                <span className="pn-label">Descripción</span>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={fila.descripcion}
                  onChange={(e) => cambiarFila(i, { descripcion: e.target.value })}
                  className="pn-field"
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="pn-label">Precio ($)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={fila.precio}
                    onChange={(e) => cambiarFila(i, { precio: e.target.value })}
                    placeholder="No va"
                    aria-label={`Precio ${titulo ?? ''}`.trim()}
                    className="pn-field"
                  />
                </label>
                <label className="block">
                  <span className="pn-label">Con panceta ($)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={fila.precioPanceta}
                    onChange={(e) => cambiarFila(i, { precioPanceta: e.target.value })}
                    placeholder="No va"
                    aria-label={`Precio ${titulo ?? ''} con panceta`.trim()}
                    className="pn-field"
                  />
                </label>
              </div>
            </div>
          )
        })}
        <p className="pn-muted text-xs font-medium">
          El precio con panceta es el total, no la diferencia. Dejá un precio vacío para sacar esa opción del
          plato; si cargás uno que faltaba, la opción se agrega.
        </p>
      </fieldset>

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
          {enCurso ? 'Guardando…' : 'Guardar plato'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/menu')} disabled={enCurso}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
