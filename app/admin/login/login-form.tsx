'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setError(null)
    setEnviando(true)

    const { error } = await authClient.signIn.email({
      email: String(datos.get('email')),
      password: String(datos.get('password')),
    })

    if (error) {
      // Mensaje único: no revelamos si el correo existe o si está desactivado.
      setError('Correo o contraseña incorrectos.')
      setEnviando(false)
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Correo
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="h-10 rounded-lg border border-white/15 bg-cheesy-black px-3 outline-none focus:border-cheesy-yellow"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Contraseña
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-10 rounded-lg border border-white/15 bg-cheesy-black px-3 outline-none focus:border-cheesy-yellow"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={enviando} className="h-10 bg-cheesy-yellow text-cheesy-black hover:bg-cheesy-yellow-bright">
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
