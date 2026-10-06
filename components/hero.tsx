'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { CheddarHeroWaveBottom } from './doodles'

export function Hero() {
  const router = useRouter()
  const underlinePathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const underPath = underlinePathRef.current
    if (!underPath) return

    let cancelled = false
    let rafId: number

    // Longitud real del subrayado con remate estilo firma
    const underLen = underPath.getTotalLength()

    underPath.style.strokeDasharray = `${underLen}`
    underPath.style.strokeDashoffset = `${underLen}`
    underPath.style.opacity = '1'

    const t0 = performance.now()
    const underDelay = 350
    const underDuration = 850

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const frame = (now: number) => {
      if (cancelled) return

      const elapsed = now - t0

      if (elapsed >= underDelay) {
        const progress = Math.min((elapsed - underDelay) / underDuration, 1)
        const eased = easeOutCubic(progress)
        underPath.style.strokeDashoffset = `${(1 - eased) * underLen}`
      }

      if (elapsed < underDelay + underDuration) {
        rafId = requestAnimationFrame(frame)
      } else {
        underPath.style.strokeDashoffset = '0'
      }
    }

    rafId = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [])

  const handleScrollToMenu = () => {
    router.push('/menu')
  }

  return (
    <section
      id="inicio"
      className="
        relative
        h-svh
        min-h-150
        sm:min-h-170
        max-h-250
        overflow-hidden
        bg-cheesy-black
      "
    >
      {/* =========================================================
          FONDO
      ========================================================= */}

      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-background.png"
          alt="Ambiente del restaurante CheesyBite"
          fill
          priority
          className="object-cover object-bottom"
        />

        {/* Sombra lateral sutil para contraste del texto sin tapar la mesa de madera */}
        <div
          className="
            absolute
            inset-0
            bg-linear-to-r
            from-cheesy-black/70
            via-cheesy-black/30
            to-transparent

            sm:from-cheesy-black/70
            sm:via-cheesy-black/30
          "
        />

        {/* Difuminado inferior para mobile — funde la hamburguesa con la ola inferior */}
        <div
          className="
            absolute
            inset-0
            bg-linear-to-t
            from-cheesy-black/60
            via-transparent
            to-transparent

            sm:from-transparent
            sm:via-transparent
          "
        />

        {/* Desvanecimiento superior sutil para la barra de navegación */}
        <div
          className="
            absolute
            inset-0
            bg-linear-to-b
            from-cheesy-black/45
            via-transparent
            to-transparent
          "
        />

        {/* Viñeta cinematográfica muy suave */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_68%_48%,transparent_0%,rgba(0,0,0,0.05)_50%,rgba(0,0,0,0.35)_100%)]
          "
        />
      </div>

      {/* =========================================================
          CONTENEDOR DE CONTENIDO
      ========================================================= */}

      <div
        className="
          pointer-events-none
          relative
          z-20
          mx-auto
          flex
          h-full
          w-full
          max-w-360
          flex-col
          justify-start
          pt-20
          px-5

          sm:flex-row
          sm:items-center
          sm:justify-start
          sm:pt-0
          sm:px-6
          lg:px-8
        "
      >
        {/* =======================================================
            CONTENIDO IZQUIERDO (Sección de título balanceada 50/50 con la hamburguesa)
        ======================================================= */}

        <div
          className="
            pointer-events-auto
            relative
            z-30
            w-full
            max-w-full
            sm:max-w-155
            lg:max-w-165
            xl:max-w-175
            sm:-translate-y-5
            lg:-translate-y-8
            xl:-translate-y-10
          "
        >
          {/* =====================================================
              TÍTULO + ENCABEZADO SUPERIOR
          ===================================================== */}

          <div className="relative">
            {/* Texto superior / antetítulo curvado */}
            <div className="mb-1 select-none animate-hero-eyebrow">
              <span className="sr-only">Hamburguesas Artesanales</span>
              <svg
                viewBox="0 0 440 45"
                className="w-full max-w-[80%] sm:max-w-97.5 lg:max-w-107.5 h-auto overflow-visible"
                aria-hidden="true"
              >
                <path id="curve-antetitulo" d="M 5 36 Q 200 8 400 32" fill="none" />
                <text
                  style={{ fontFamily: 'var(--font-display), cursive' }}
                  fontSize="21"
                  letterSpacing="0.14em"
                  fill="#F5B900"
                  className="uppercase font-black"
                >
                  <textPath href="#curve-antetitulo" startOffset="0">
                    Hamburguesas Artesanales
                  </textPath>
                </text>
              </svg>
            </div>

            {/* H1 accesible para SEO y lectores de pantalla */}
            <h1 className="sr-only">El verdadero sabor de la felicidad</h1>

            {/* Título curvado tipo arcoíris (visual) */}
            <div className="relative">
              {/* Líneas decorativas de énfasis — 3 trazos a la izquierda de la "E" */}
              <div
                className="
                  pointer-events-none
                  absolute
                  -left-8
                  top-4.5
                  hidden

                  min-[1450px]:block
                  min-[1450px]:-left-12
                "
              >
                <svg
                  viewBox="-5 -5 55 60"
                  fill="none"
                  className="h-10 w-9 sm:h-12 sm:w-10 lg:h-14 lg:w-12 text-cheesy-yellow overflow-visible"
                  aria-hidden="true"
                >
                  {/* Cuña superior */}
                  <g className="animate-hero-burst-title-1">
                    <path
                      d="M16 2 C14 0 16 6 28 16 C30 18 32 16 30 14 C24 8 18 4 16 2 Z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      transform="rotate(-15 22 9)"
                    />
                  </g>
                  {/* Cuña intermedia — más larga */}
                  <g className="animate-hero-burst-title-2">
                    <path
                      d="M2 22 C0 20 4 18 32 30 C34 32 34 36 32 36 C18 34 4 26 2 24 Z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </g>
                  {/* Cuña inferior */}
                  <g className="animate-hero-burst-title-3">
                    <path
                      d="M2 42 C0 40 4 38 20 44 C22 46 20 50 18 50 C10 48 4 46 2 44 Z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </div>

              {/* Título curvado en SVG - "felicidad" y subrayado con remate estilo firma */}
              <svg
                viewBox="-20 0 580 265"
                className="w-full max-w-full sm:max-w-140 lg:max-w-155 xl:max-w-165 h-auto overflow-visible select-none drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)] animate-hero-title"
                aria-hidden="true"
              >
                <defs>
                  <path id="curve-verdadero" d="M 18 72 Q 240 36 500 72" fill="none" />
                  <path id="curve-sabor" d="M 18 132 Q 225 96 450 132" fill="none" />
                  <path id="curve-felicidad" d="M 24 204 Q 240 174 480 204" fill="none" />
                </defs>

                <text
                  style={{ fontFamily: 'var(--font-chewy), cursive' }}
                  fontSize="70"
                  fill="white"
                >
                  <textPath href="#curve-verdadero" startOffset="0">
                    El verdadero
                  </textPath>
                </text>

                <text
                  style={{ fontFamily: 'var(--font-chewy), cursive' }}
                  fontSize="66"
                  fill="white"
                >
                  <textPath href="#curve-sabor" startOffset="0">
                    sabor de la
                  </textPath>
                </text>

                <text
                  style={{ fontFamily: 'var(--font-chewy), cursive' }}
                  fontSize="88"
                  fill="#F5B900"
                >
                  <textPath href="#curve-felicidad" startOffset="0">
                    felicidad
                  </textPath>
                </text>

                {/* Subrayado limpio curvado a la par de 'felicidad' */}
                <path
                  ref={underlinePathRef}
                  d="M 24 220 Q 190 193 355 206"
                  stroke="#F5B900"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{ opacity: 0 }}
                />
              </svg>
            </div>
          </div>

          {/* =====================================================
              DESCRIPCIÓN
          ===================================================== */}

          <p
            className="
              mt-3
              max-w-70
              text-xs
              font-normal
              leading-relaxed
              text-[#D1D0CB]

              sm:mt-7
              sm:max-w-125
              sm:text-lg
              animate-hero-desc
            "
          >
            Jugosas, frescas y con el mejor queso.
            <br />
            ¡Las hamburguesas que siempre querés!
          </p>

          {/* =====================================================
              BOTÓN DE ACCIÓN (CTA)
          ===================================================== */}

          <button
            onClick={handleScrollToMenu}
            style={{ fontFamily: 'var(--font-sans), sans-serif' }}
            className="
              group
              relative
              mt-5
              inline-flex
              items-center
              gap-2.5
              rounded-b-md
              bg-cheesy-yellow
              px-7
              py-3.5
              text-base
              font-bold
              tracking-tight
              text-cheesy-black
              shadow-[0_12px_28px_rgba(245,185,0,0.22)]
              transition-all
              duration-300
              hover:rounded-t-[26px]
              active:scale-[0.98]
              cursor-pointer
              animate-hero-btn

              sm:mt-8
              sm:px-8
              sm:py-3.5
              sm:text-lg
            "
          >
            {/* Ondulación suave de queso derretido en la parte superior — animada en sincronía al fundirse */}
            <div
              className="
                pointer-events-none
                absolute
                -top-1.5
                left-4
                right-4
                h-2.5
                origin-bottom
                animate-hero-melt-top
              "
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 140 10"
                preserveAspectRatio="none"
                className="
                  h-full
                  w-full
                  text-cheesy-yellow
                  transition-transform
                  duration-300
                  group-hover:scale-y-120
                "
                fill="currentColor"
              >
                <path d="M 0,10 C 18,5 34,7 54,3.5 C 72,0.5 88,4 106,2 C 122,0.5 132,6 140,10 Z" />
              </svg>
            </div>

            {/* Queso cheddar derretido en el borde inferior izquierdo — 3 lóbulos suaves y redondeados */}
            <div
              className="
                pointer-events-none
                absolute
                -bottom-5
                left-0
                h-7.5
                w-17
                origin-top
                animate-hero-melt-left
              "
            >
              <svg
                className="
                  h-full
                  w-full
                  origin-top
                  text-cheesy-yellow
                  transition-transform
                  duration-300
                  group-hover:scale-y-110
                "
                viewBox="0 0 68 30"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M 0 0 L 0 6 C 0 12, 4 18, 10 18 C 14 18, 17 14, 21 14 C 25 14, 28 25, 34 25 C 38 25, 41 15, 45 15 C 49 15, 52 20, 56 20 C 61 20, 64 16, 68 10 L 68 0 Z" />
              </svg>
            </div>

            {/* Queso cheddar derretido en el borde inferior derecho — 2 escalones fluidos en cascada */}
            <div
              className="
                pointer-events-none
                absolute
                -bottom-6.5
                right-0
                h-9
                w-13.5
                origin-top
                animate-hero-melt-right
              "
            >
              <svg
                className="
                  h-full
                  w-full
                  origin-top
                  text-cheesy-yellow
                  transition-transform
                  duration-300
                  group-hover:scale-y-110
                "
                viewBox="0 0 54 36"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M 0 0 L 0 10 C 4 10, 8 18, 16 18 C 22 18, 25 14, 28 14 C 31 14, 34 24, 37 31 C 39 35.5, 45 35.5, 47 30 C 49 24, 52 14, 54 6 L 54 0 Z" />
              </svg>
            </div>

            <span className="relative z-10" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
              Hacer pedido
            </span>

            <ArrowRight
              className="
                relative
                z-10
                h-5
                w-5
                transition-transform
                duration-200
                group-hover:translate-x-1.5
              "
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>

      {/* =========================================================
          GRUPO VISUAL DE LA HAMBURGUESA

      ========================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          z-10

          bottom-0
          left-1/2
          -translate-x-1/2
          h-[43%]
          w-[95%]
          max-w-92.5

          sm:z-20
          sm:max-w-none
          sm:translate-x-0
          sm:left-auto
          sm:bottom-2
          sm:right-[2%]
          sm:h-[75%]
          sm:w-[58%]

          lg:h-[102%]
          lg:right-[3%]
          lg:w-[60%]

          xl:h-[104%]
          xl:right-[4%]
          xl:w-[58%]
        "
      >
        {/* =====================================================
            HAMBURGUESA
        ===================================================== */}

        <div className="relative h-full w-full animate-hero-burger">
          <div className="absolute inset-0 origin-bottom scale-[1.08] lg:scale-[1.12]">
            <Image
              src="/images/hamburguesa-hero.png"
              alt="Hamburguesa artesanal CheesyBite con queso cheddar derretido"
              fill
              priority
              className="object-contain object-bottom drop-shadow-[0_20px_55px_rgba(0,0,0,0.9)]"
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          ILUSTRACIONES / GARABATOS — posicionados respecto a la SECCIÓN,
          no del contenedor de la hamburguesa, ya que la imagen tiene
          márgenes transparentes que vuelven inestables los desplazamientos relativos.
      ========================================================= */}

      {/* Líneas decorativas de énfasis — 3 trazos redondeados arriba a la izquierda del pan */}
      <div
        className="
          pointer-events-none select-none
          absolute z-20
          hidden min-[1920px]:block
          min-[1920px]:top-[17%] min-[1920px]:right-[48%]
        "
      >
        <svg
          viewBox="-8 -10 82 92"
          fill="none"
          className="h-18 w-16 sm:h-21.5 sm:w-19 lg:h-29.5 lg:w-26 text-cheesy-yellow overflow-visible"
          aria-hidden="true"
        >
          {/* Cuña superior — más larga */}
          <g className="animate-hero-burst-burger-1">
            <path
              d="M 16 -2 C 12 -4 14 6 42 28 C 44 30 46 28 44 26 C 28 14 20 2 18 0 Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
              transform="rotate(-10 32 12)"
            />
          </g>
          {/* Cuña intermedia */}
          <g className="animate-hero-burst-burger-2">
            <path
              d="M 0 24 C -2 22 4 20 36 38 C 38 40 38 44 36 44 C 18 42 4 30 0 26 Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
          {/* Cuña inferior — más corta */}
          <g className="animate-hero-burst-burger-3">
            <path
              d="M 0 52 C -2 50 4 48 26 54 C 28 56 26 60 24 60 C 12 58 4 56 0 54 Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* 100% CARNE REAL — arriba a la derecha, flecha apuntando a la hamburguesa */}
      <div
        className="
          pointer-events-none select-none animate-hero-badge
          absolute z-20
          hidden min-[1920px]:block
          min-[1920px]:top-[14%] min-[1920px]:right-[11%]
        "
      >
        <div className="animate-float flex flex-col items-center">
          <span className="font-badge text-center text-base sm:text-lg lg:text-2xl xl:text-3xl leading-[0.95] tracking-wide text-cheesy-yellow">
            100%<br />CARNE DE CALIDAD
          </span>
          <svg
            viewBox="0 0 50 45"
            fill="none"
            className="mr-2 sm:mr-3 mt-1 h-7 w-8 lg:h-10 lg:w-12 text-cheesy-yellow"
            aria-hidden="true"
          >
            <path
              d="M44 4C38 16 26 26 10 30"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="animate-hero-badge-arrow"
            />
            <path
              d="M18 20L10 30L22 36"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-hero-badge-arrowhead"
            />
          </svg>
        </div>
      </div>

      {/* Gotas de queso — abajo a la derecha de la hamburguesa */}
      <div
        className="
          pointer-events-none select-none animate-hero-drops
          absolute z-40
          hidden min-[1920px]:block
          min-[1920px]:bottom-[9%] min-[1920px]:right-[7%]
        "
      >
        <svg
          viewBox="0 0 45 55"
          fill="none"
          className="h-12 w-10 lg:h-17 lg:w-14 text-cheesy-yellow"
          aria-hidden="true"
        >
          <ellipse cx="18" cy="12" rx="7" ry="11" fill="currentColor" transform="rotate(-20 18 12)" />
          <circle cx="32" cy="40" r="7" fill="currentColor" />
          <circle cx="10" cy="38" r="3.5" fill="currentColor" />
        </svg>
      </div>

      {/* =========================================================
          TRANSICIÓN ORGÁNICA INFERIOR DE CHEDDAR (MOCKUP)
      ========================================================= */}

      <CheddarHeroWaveBottom />
    </section>
  )
}