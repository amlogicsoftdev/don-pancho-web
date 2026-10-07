interface Props {
  titulo: string
  /** Renglón chico arriba del título (por ejemplo, el día o el número de pedido). */
  rotulo?: React.ReactNode
  /** Una o dos líneas que explican para qué sirve la pantalla. */
  descripcion?: React.ReactNode
  /** Lo que va a la derecha del título: filtros, un botón. */
  children?: React.ReactNode
}

/** Encabezado de cada pantalla del panel: título de afiche sobre una raya negra. */
export function Encabezado({ titulo, rotulo, descripcion, children }: Props) {
  return (
    <header className="border-b-2 border-pancho-black pb-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {rotulo && <p className="pn-eyebrow mb-1.5">{rotulo}</p>}
          <h1 className="text-5xl leading-none sm:text-6xl">{titulo}</h1>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
      {descripcion && <p className="pn-muted mt-3 max-w-2xl text-sm font-medium">{descripcion}</p>}
    </header>
  )
}
