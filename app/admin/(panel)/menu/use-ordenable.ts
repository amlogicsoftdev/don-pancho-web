'use client'

import { useLayoutEffect, useRef, useState } from 'react'

interface Arrastre {
  id: number
  /** Orden al empezar a arrastrar. */
  ids: number[]
  desde: number
  hasta: number
  /** Posición del puntero al empezar, en coordenadas de la página (incluye el scroll). */
  inicioY: number
  /** Mitad de cada elemento al empezar, en coordenadas de la página. */
  mitades: number[]
  /** Cuánto se corren los demás para hacerle lugar: alto del arrastrado más el espacio entre filas. */
  paso: number
  /** Última posición del puntero en la pantalla (para el desplazamiento automático). */
  punteroY: number
  cuadro: number
}

// Cerca del borde de la pantalla la página se desplaza sola. Arriba se deja más margen por la
// barra fija del panel.
const BORDE_ARRIBA = 140
const BORDE_ABAJO = 80

/**
 * Ordenar una lista arrastrando la manija de cada elemento (como en Spotify): con el mouse o
 * con el dedo, y con el teclado (flechas arriba y abajo sobre la manija). Mientras se arrastra
 * solo se mueven los elementos en pantalla; al soltar se guarda el orden nuevo con `guardar`,
 * y si falla vuelve al orden de antes.
 */
export function useOrdenable(
  ids: number[],
  guardar: (nuevo: number[]) => Promise<boolean>,
  deshabilitado = false,
) {
  // Orden local mientras se guarda: vale solo para la lista que vino del servidor (`base`).
  // Cuando llega la lista nueva, manda otra vez la del servidor.
  const clave = ids.join(',')
  const [local, setLocal] = useState<{ base: string; orden: number[] } | null>(null)
  const orden = local && local.base === clave ? local.orden : ids

  const [arrastrando, setArrastrando] = useState<number | null>(null)
  const [anuncio, setAnuncio] = useState('')
  const nodos = useRef(new Map<number, HTMLElement>())
  const asas = useRef(new Map<number, HTMLElement>())
  const arrastre = useRef<Arrastre | null>(null)
  const enfocar = useRef<number | null>(null)

  // Lo que escucha en window llama siempre a las funciones del último render (que conocen la
  // lista y `guardar` actuales); se actualizan más abajo. Las escuchas son estables para poder
  // sacarlas al terminar.
  const ultimo = useRef<{ mover: (punteroY: number) => void; terminar: (soltar: boolean) => void } | null>(null)
  const [escuchas] = useState(() => ({
    mover: (e: PointerEvent) => ultimo.current?.mover(e.clientY),
    soltar: () => ultimo.current?.terminar(true),
    cancelar: () => ultimo.current?.terminar(false),
    tecla: (e: KeyboardEvent) => {
      if (e.key === 'Escape') ultimo.current?.terminar(false)
    },
  }))

  // Al mover con el teclado, React reubica el elemento y la manija puede perder el foco
  useLayoutEffect(() => {
    if (enfocar.current === null) return
    asas.current.get(enfocar.current)?.focus()
    enfocar.current = null
  }, [orden])

  function aplicar(nuevo: number[]) {
    setLocal({ base: clave, orden: nuevo })
    void guardar(nuevo).then((ok) => {
      if (!ok) setLocal(null)
    })
  }

  function limpiarEstilos(lista: number[]) {
    for (const id of lista) {
      const nodo = nodos.current.get(id)
      if (nodo) {
        nodo.style.transform = ''
        nodo.style.transition = ''
      }
    }
  }

  function mover(punteroY: number) {
    const a = arrastre.current
    if (!a) return
    a.punteroY = punteroY
    const y = punteroY + window.scrollY

    // Lugar nuevo: el último elemento cuya mitad quedó del otro lado del puntero
    let hasta = a.desde
    for (let i = a.desde + 1; i < a.ids.length; i++) if (y > a.mitades[i]) hasta = i
    for (let i = a.desde - 1; i >= 0; i--) if (y < a.mitades[i]) hasta = i
    a.hasta = hasta

    a.ids.forEach((id, i) => {
      const nodo = nodos.current.get(id)
      if (!nodo) return
      if (id === a.id) {
        nodo.style.transform = `translateY(${y - a.inicioY}px)`
        return
      }
      let corrimiento = 0
      if (a.desde < i && i <= hasta) corrimiento = -a.paso
      else if (hasta <= i && i < a.desde) corrimiento = a.paso
      nodo.style.transition = 'transform 160ms ease-out'
      nodo.style.transform = corrimiento ? `translateY(${corrimiento}px)` : ''
    })
  }

  function terminar(soltar: boolean) {
    const a = arrastre.current
    if (!a) return
    arrastre.current = null
    cancelAnimationFrame(a.cuadro)
    window.removeEventListener('pointermove', escuchas.mover)
    window.removeEventListener('pointerup', escuchas.soltar)
    window.removeEventListener('pointercancel', escuchas.cancelar)
    window.removeEventListener('keydown', escuchas.tecla)
    document.body.style.userSelect = ''

    // Los estilos se sacan en el mismo momento en que React reordena: no hay salto
    limpiarEstilos(a.ids)
    setArrastrando(null)
    if (soltar && a.hasta !== a.desde) {
      const nuevo = [...a.ids]
      const [movido] = nuevo.splice(a.desde, 1)
      nuevo.splice(a.hasta, 0, movido)
      aplicar(nuevo)
    }
  }

  useLayoutEffect(() => {
    ultimo.current = { mover, terminar }
  })

  function empezar(id: number, e: React.PointerEvent) {
    if (deshabilitado || arrastre.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()

    const lista = [...orden]
    const rects = lista.map((i) => nodos.current.get(i)?.getBoundingClientRect())
    if (rects.some((r) => !r)) return
    const r = rects as DOMRect[]
    const desde = lista.indexOf(id)
    const propio = r[desde]
    const espacio =
      desde < r.length - 1 ? r[desde + 1].top - propio.bottom : desde > 0 ? propio.top - r[desde - 1].bottom : 0

    arrastre.current = {
      id,
      ids: lista,
      desde,
      hasta: desde,
      inicioY: e.clientY + window.scrollY,
      mitades: r.map((x) => x.top + window.scrollY + x.height / 2),
      paso: propio.height + espacio,
      punteroY: e.clientY,
      cuadro: 0,
    }
    setArrastrando(id)
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', escuchas.mover)
    window.addEventListener('pointerup', escuchas.soltar)
    window.addEventListener('pointercancel', escuchas.cancelar)
    window.addEventListener('keydown', escuchas.tecla)

    // Desplazamiento automático cerca de los bordes de la pantalla
    const bucle = () => {
      const a = arrastre.current
      if (!a) return
      let velocidad = 0
      if (a.punteroY < BORDE_ARRIBA) velocidad = -Math.ceil((BORDE_ARRIBA - a.punteroY) / 6)
      else if (a.punteroY > window.innerHeight - BORDE_ABAJO)
        velocidad = Math.ceil((a.punteroY - (window.innerHeight - BORDE_ABAJO)) / 6)
      if (velocidad) {
        window.scrollBy(0, velocidad)
        ultimo.current?.mover(a.punteroY)
      }
      a.cuadro = requestAnimationFrame(bucle)
    }
    arrastre.current.cuadro = requestAnimationFrame(bucle)
  }

  function alTecla(id: number, nombre: string, e: React.KeyboardEvent) {
    if (deshabilitado || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    e.preventDefault()
    const i = orden.indexOf(id)
    const j = e.key === 'ArrowUp' ? i - 1 : i + 1
    if (i < 0 || j < 0 || j >= orden.length) return
    const nuevo = [...orden]
    ;[nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]]
    enfocar.current = id
    setAnuncio(`${nombre}: lugar ${j + 1} de ${orden.length}.`)
    aplicar(nuevo)
  }

  return {
    orden,
    arrastrando,
    /** Texto para lectores de pantalla después de mover con el teclado. */
    anuncio,
    /** ref del elemento que se mueve (la fila o la tarjeta entera). */
    refElemento: (id: number) => (nodo: HTMLElement | null) => {
      if (nodo) nodos.current.set(id, nodo)
      else nodos.current.delete(id)
    },
    /** Props de la manija (botón con las tres líneas). */
    propsAsa: (id: number, nombre: string) => ({
      ref: (nodo: HTMLButtonElement | null) => {
        if (nodo) asas.current.set(id, nodo)
        else asas.current.delete(id)
      },
      type: 'button' as const,
      className: 'pn-asa',
      disabled: deshabilitado,
      'aria-label': `Mover ${nombre}. Arrastralo, o usá las flechas arriba y abajo.`,
      onPointerDown: (e: React.PointerEvent) => empezar(id, e),
      onKeyDown: (e: React.KeyboardEvent) => alTecla(id, nombre, e),
      // El arrastre empieza con el puntero; el clic no hace nada
      onClick: (e: React.MouseEvent) => e.preventDefault(),
    }),
  }
}
