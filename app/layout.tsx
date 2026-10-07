import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Anton, Montserrat } from 'next/font/google'
import './globals.css'
import { DatosLocalProvider } from '@/components/datos-local'
import { leerDatosLocal } from '@/lib/local/queries'

// Títulos y nombres. También es el reemplazo de Agharti (titulares) hasta tener el archivo de esa fuente.
const anton = Anton({
  subsets: ['latin'],
  variable: '--font-anton',
  weight: '400',
})

// Texto, botones, etiquetas y navegación
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Don Pancho & Burger | Hamburguesas y panchos',
  description: 'Hamburguesas y panchos con delivery o retiro. Armá tu pedido desde la web.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: '#ff7300',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // WhatsApp, dirección, horario y redes del local: los carga el dueño en el panel
  const datosLocal = await leerDatosLocal()

  return (
    <html lang="es" className={`${anton.variable} ${montserrat.variable}`}>
      <body className="antialiased bg-pancho-black text-pancho-cream font-sans selection:bg-pancho-orange selection:text-pancho-black">
        <DatosLocalProvider datos={datosLocal}>{children}</DatosLocalProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
