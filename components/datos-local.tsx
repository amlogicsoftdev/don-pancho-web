'use client'

import { createContext, useContext } from 'react'
import { DATOS_LOCAL_POR_DEFECTO, type DatosLocal } from '@/lib/local/datos'

const DatosLocalContexto = createContext<DatosLocal>(DATOS_LOCAL_POR_DEFECTO)

/** Pone a disposición de los componentes del navegador los datos del local leídos de la base. */
export function DatosLocalProvider({ datos, children }: { datos: DatosLocal; children: React.ReactNode }) {
  return <DatosLocalContexto.Provider value={datos}>{children}</DatosLocalContexto.Provider>
}

/** Nombre, WhatsApp, dirección, horario y redes del local (los que carga el dueño en el panel). */
export function useDatosLocal(): DatosLocal {
  return useContext(DatosLocalContexto)
}
