import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Chewy, Inter, Caveat_Brush } from 'next/font/google'
import './globals.css'

const chewy = Chewy({
  subsets: ['latin'],
  variable: '--font-chewy',
  weight: '400',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const caveatBrush = Caveat_Brush({
  subsets: ['latin'],
  variable: '--font-badge',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'CheesyBite | Burgers con alma',
  description: 'Hamburguesas artesanales, jugosas y con el mejor cheddar. Pedí tu CheesyBite por WhatsApp.',
  icons: {
    icon: '/images/icono.png',
    apple: '/images/icono.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${chewy.variable} ${inter.variable} ${caveatBrush.variable}`}>
      <body className="antialiased bg-cheesy-black text-cheesy-cream font-sans selection:bg-cheesy-yellow selection:text-cheesy-black">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
