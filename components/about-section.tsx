'use client'

import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { Heart, Flame, Sparkles, ChefHat } from 'lucide-react'
import { useInView } from '@/hooks/use-in-view'

// 16 Partículas radiales suaves para la explosión del título "Nuestro Secreto Artesanal" (sin sombras, estilo filtro del menú)
const TITLE_EXPLOSION_PARTICLES = [
  { x: 0, y: -45, size: 6, delay: 0 },
  { x: 32, y: -32, size: 6, delay: 30 },
  { x: 55, y: -12, size: 5, delay: 15 },
  { x: 62, y: 0, size: 6, delay: 45 },
  { x: 55, y: 12, size: 5, delay: 20 },
  { x: 32, y: 32, size: 6, delay: 50 },
  { x: 0, y: 45, size: 6, delay: 10 },
  { x: -32, y: 32, size: 6, delay: 35 },
  { x: -55, y: 12, size: 5, delay: 25 },
  { x: -62, y: 0, size: 6, delay: 45 },
  { x: -55, y: -12, size: 5, delay: 15 },
  { x: -32, y: -32, size: 6, delay: 40 },
  { x: 20, y: -48, size: 5, delay: 60 },
  { x: -20, y: -48, size: 5, delay: 60 },
  { x: 20, y: 48, size: 5, delay: 70 },
  { x: -20, y: 48, size: 5, delay: 70 },
]

interface HandwrittenBadgeProps {
  isTriggered: boolean
}

function HandwrittenBadge({ isTriggered }: HandwrittenBadgeProps) {
  return (
    <div className="flex flex-col items-start select-none rotate-[-7deg]">
      {/* Contenedor del texto manuscrito trazado por su contorno real */}
      <svg
        viewBox="0 0 170 70"
        className="w-37.5 sm:w-43.75 lg:w-48.75 h-auto overflow-visible select-none pointer-events-none"
        aria-label="BURGERS CON ALMA"
      >
        {/* Línea 1: BURGERS trazada por contorno real a partir de 2.55s */}
        <text
          x="2"
          y="28"
          className={`font-badge select-none ${
            isTriggered ? 'animate-badge-contour-line1' : 'opacity-0'
          }`}
          style={{
            fontFamily: 'var(--font-badge), cursive, sans-serif',
            fontSize: '31px',
            letterSpacing: '0.04em',
            stroke: '#F5B900',
            strokeWidth: '1.4px',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
        >
          BURGERS
        </text>

        {/* Línea 2: CON ALMA trazada por contorno real a partir de 3.30s */}
        <text
          x="2"
          y="62"
          className={`font-badge select-none ${
            isTriggered ? 'animate-badge-contour-line2' : 'opacity-0'
          }`}
          style={{
            fontFamily: 'var(--font-badge), cursive, sans-serif',
            fontSize: '31px',
            letterSpacing: '0.04em',
            stroke: '#F5B900',
            strokeWidth: '1.4px',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
        >
          CON ALMA
        </text>
      </svg>

      {/* Línea curva desde la esquina inferior que termina en el costado del corazón */}
      <div className="flex items-center mt-1 -ml-1">
        <svg viewBox="0 0 65 30" fill="none" className="w-14 sm:w-16 h-7 sm:h-8 text-cheesy-yellow overflow-visible">
          <path
            d="M 6 2 C 10 16, 32 24, 60 18"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            className={isTriggered ? 'animate-badge-curve' : 'opacity-0'}
          />
        </svg>

        {/* Corazón latiendo al costado de la curva */}
        <div
          className={`ml-1.5 -mt-1 ${
            isTriggered ? 'animate-badge-heart' : 'opacity-0'
          }`}
        >
          <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-cheesy-yellow fill-current animate-heartbeat rotate-12" />
        </div>
      </div>
    </div>
  )
}

interface ScrollPillarBandProps {
  step: string
  title: string
  description: string
  icon: React.ElementType
  direction: 'left-to-right' | 'right-to-left'
  theme: 'dark' | 'yellow'
}

function ScrollPillarBand({
  step,
  title,
  description,
  icon: Icon,
  direction,
  theme,
}: ScrollPillarBandProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const paragraphRef = useRef<HTMLDivElement>(null)

  const isLeftToRight = direction === 'left-to-right'
  const isDark = theme === 'dark'

  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, posicionamos directamente en su destino
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      if (bannerRef.current) {
        bannerRef.current.style.transform = 'translate3d(0%, 0, 0)'
      }
      if (stepRef.current) {
        stepRef.current.style.opacity = '1'
        stepRef.current.style.transform = 'translate3d(0, 0, 0)'
      }
      if (titleRef.current) {
        titleRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)'
      }
      if (paragraphRef.current) {
        paragraphRef.current.style.opacity = '1'
        paragraphRef.current.style.transform = 'translate3d(0, 0, 0)'
      }
      return
    }

    const updatePositions = () => {
      if (
        !containerRef.current ||
        !stickyRef.current ||
        !bannerRef.current
      ) {
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const stickyRect = stickyRef.current.getBoundingClientRect()
      const topOffset =
        parseFloat(window.getComputedStyle(stickyRef.current).top) || 112

      const totalDistance = containerRect.height - stickyRect.height
      if (totalDistance <= 0) return

      const distanceTraveled = topOffset - containerRect.top
      const rawProgress = distanceTraveled / totalDistance
      const progress = Math.max(0, Math.min(1, rawProgress))

      const isDesktop = window.innerWidth >= 640
      const maxScale = isDesktop ? 1.4 : 1.28
      const startY = isDesktop ? 36 : 24

      // 1. Desplazamiento horizontal del banner sobre el scroll (llega entre 0 y 0.40)
      const slideProgress = Math.min(1, progress / 0.40)
      const easedSlide =
        slideProgress * slideProgress * (3 - 2 * slideProgress)

      let currentXPercent = 0
      if (isLeftToRight) {
        currentXPercent = -100 * (1 - easedSlide)
      } else {
        currentXPercent = 100 * (1 - easedSlide)
      }

      bannerRef.current.style.transform = `translate3d(${currentXPercent.toFixed(2)}%, 0, 0)`

      // 2. Título: aparece grande y abajo, y entre 0.38 y 0.68 se achica a 1.0 desplazándose hacia arriba
      if (titleRef.current) {
        const settleProgress = Math.max(0, Math.min(1, (progress - 0.38) / 0.30))
        const easedSettle =
          settleProgress * settleProgress * (3 - 2 * settleProgress)
        const currentScale = maxScale - (maxScale - 1) * easedSettle
        const currentY = (1 - easedSettle) * startY

        titleRef.current.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(3)})`
      }

      // 2b. Cabecera con número de paso (aparece suave mientras el título sube)
      if (stepRef.current) {
        const stepProgress = Math.max(0, Math.min(1, (progress - 0.40) / 0.26))
        const easedStep =
          stepProgress * stepProgress * (3 - 2 * stepProgress)

        stepRef.current.style.opacity = easedStep.toFixed(3)
        stepRef.current.style.transform = `translate3d(0, ${((1 - easedStep) * 10).toFixed(2)}px, 0)`
      }

      // 3. Párrafo descriptivo: recién cuando el título terminó de acomodarse (a partir de 0.68), aparece el texto
      if (paragraphRef.current) {
        const pReveal = Math.max(0, Math.min(1, (progress - 0.68) / 0.27))
        const easedReveal =
          pReveal * pReveal * (3 - 2 * pReveal)
        const paragraphY = (1 - easedReveal) * 20

        paragraphRef.current.style.opacity = easedReveal.toFixed(3)
        paragraphRef.current.style.transform = `translate3d(0, ${paragraphY.toFixed(2)}px, 0)`
      }
    }

    updatePositions()

    let rafId: number | null = null
    const handleScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        updatePositions()
        rafId = null
      })
    }

    const handleResize = () => {
      updatePositions()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [direction, isLeftToRight])

  return (
    <div
      ref={containerRef}
      className="relative h-[125vh] sm:h-[140vh] lg:h-[150vh] w-full"
    >
      <div
        ref={stickyRef}
        className="sticky top-24 sm:top-28 lg:top-32 w-full z-10 overflow-hidden"
      >
        {/* Contenedor que ingresa desde el costado sobre el fondo negro de la página */}
        <div
          ref={bannerRef}
          className={`
            relative w-full overflow-hidden transition-colors duration-500 rounded-none will-change-transform
            ${
              isDark
                ? 'bg-[#0E0E0E] border-y border-neutral-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
                : 'bg-cheesy-yellow border-y border-[#E0A800]'
            }
          `}
          style={{
            transform: isLeftToRight
              ? 'translate3d(-100%, 0, 0)'
              : 'translate3d(100%, 0, 0)',
          }}
        >
          {/* Gráfico decorativo de fondo: posicionado en el lado opuesto al texto para equilibrar el espacio */}
          <div
            className={`pointer-events-none absolute select-none ${
              isLeftToRight
                ? '-left-6 -bottom-10 sm:left-4 lg:left-12'
                : '-right-6 -bottom-10 sm:right-4 lg:right-12'
            } ${isDark ? 'text-white opacity-5' : 'text-black opacity-10'}`}
          >
            <Icon className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96" strokeWidth={1} />
          </div>

          {/* Contenido interior que utiliza todo el ancho de la página */}
          <div className="py-10 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-16 relative z-10 w-full">
            <div
              className={`w-full flex ${
                isLeftToRight ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Bloque de texto principal */}
              <div className="w-full max-w-[88%] sm:max-w-md lg:max-w-xl text-left">
                {/* Cabecera del bloque: Paso */}
                <div
                  ref={stepRef}
                  className="mb-2 sm:mb-3 will-change-[opacity,transform]"
                  style={{
                    opacity: 0,
                    transform: 'translate3d(0, 10px, 0)',
                  }}
                >
                  <span
                    className={`font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tighter leading-none ${
                      isDark ? 'text-cheesy-yellow/35' : 'text-black/25'
                    }`}
                  >
                    {step}
                  </span>
                </div>

                {/* Título de la sección: arranca agrandado y desplazado hacia abajo, luego se achica y sube */}
                <h4
                  ref={titleRef}
                  className={`text-2xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight leading-tight origin-top-left will-change-transform ${
                    isDark ? 'text-white' : 'text-[#0A0A0A]'
                  }`}
                  style={{
                    transformOrigin: 'left top',
                    transform: 'translate3d(0, 36px, 0) scale(1.35)',
                  }}
                >
                  {title}
                </h4>

                {/* Párrafo que aparece recién cuando el título terminó de acomodarse arriba */}
                <div
                  ref={paragraphRef}
                  className="mt-4 sm:mt-6 will-change-[opacity,transform]"
                  style={{
                    opacity: 0,
                    transform: 'translate3d(0, 24px, 0)',
                  }}
                >
                  <p
                    className={`text-sm sm:text-base lg:text-lg leading-relaxed ${
                      isDark
                        ? 'text-neutral-400 font-normal'
                        : 'text-neutral-900 font-medium'
                    }`}
                  >
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AboutSection() {
  const { ref: heroRef, isInView: isHeroInView } = useInView({
    threshold: 0.25,
    rootMargin: '0px 0px -100px 0px',
  })
  const { ref: pillarsRef, isInView: isPillarsInView } = useInView({
    threshold: 0.3,
    rootMargin: '0px 0px -120px 0px',
  })

  const pillars: Array<{
    step: string
    icon: React.ElementType
    title: string
    description: string
    direction: 'left-to-right' | 'right-to-left'
    theme: 'dark' | 'yellow'
  }> = [
    {
      step: '01',
      icon: Flame,
      title: 'El Blend Smash',
      description:
        'Cortes seleccionados 100% novillo. Smasheados al hierro candente para lograr esa costra dorada crocante que concentra todo el jugo.',
      direction: 'left-to-right',
      theme: 'dark',
    },
    {
      step: '02',
      icon: Sparkles,
      title: 'Cascada de Cheddar',
      description:
        'El corazón de CheesyBite. Queso cheddar de verdad, fundido al vapor para envolver cada piso con la textura cremosa que nos define.',
      direction: 'right-to-left',
      theme: 'yellow',
    },
    {
      step: '03',
      icon: ChefHat,
      title: 'Pan de Papa Diario',
      description:
        'Horneado cada mañana. Ultra esponjoso, tostado en manteca y con la resistencia justa para aguantar cada bocado sin desarmarse.',
      direction: 'left-to-right',
      theme: 'dark',
    },
  ]

  return (
    <section
      id="nosotros"
      className="relative py-20 sm:py-28 lg:py-36 select-none w-full overflow-x-clip"
    >
      {/* =========================================================
          BLOQUE SUPERIOR: CHEF, HISTORIA Y DOODLE (Centrado)
      ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={heroRef} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Columna Izquierda: Imagen con animación pronunciada + Líneas estirándose apuntando a su posición final */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
          {/* Líneas de énfasis arriba a la izquierda — fijas apuntando a la posición final, estirándose con la animación del hero */}
          <div
            className="pointer-events-none absolute -top-8 left-2 sm:-top-10 sm:-left-6 lg:-top-12 lg:-left-8 z-20 text-cheesy-yellow rotate-32"
          >
            <svg
              viewBox="-5 -5 55 60"
              fill="none"
              className="h-14 w-12 sm:h-16 sm:w-14 lg:h-18 lg:w-16 overflow-visible"
              aria-hidden="true"
            >
              {/* Cuña superior */}
              <g className={isHeroInView ? 'animate-about-burst-1' : 'opacity-0'}>
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
              <g className={isHeroInView ? 'animate-about-burst-2' : 'opacity-0'}>
                <path
                  d="M2 22 C0 20 4 18 32 30 C34 32 34 36 32 36 C18 34 4 26 2 24 Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </g>
              {/* Cuña inferior */}
              <g className={isHeroInView ? 'animate-about-burst-3' : 'opacity-0'}>
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

          {/* Imagen con borde sobre su silueta redondeada y rotación leve al hover */}
          <div
            className={`
              group relative w-full max-w-lg lg:max-w-xl aspect-1672/941 cursor-pointer select-none
              ${isHeroInView ? 'animate-about-image' : 'opacity-0'}
            `}
          >
            {/* Imagen orgánica sin caja rectangular: borde dorado y rotación sutil al hover */}
            <div className="relative w-full h-full">
              <Image
                src="/images/nosotros1.png"
                alt="Chef de CheesyBite preparando una hamburguesa artesanal"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                className="object-contain about-organic-image"
                priority={false}
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Texto escalonado con choque de pared y rebote (sin recortes de div) */}
        <div className="lg:col-span-6 flex flex-col items-start relative overflow-visible">
          {/* 1. Antetítulo SOBRE NOSOTROS (más grande, viene de la derecha, choca contra la pared y rebota) */}
          <div className="mb-4 overflow-visible">
            <span
              className={`
                inline-block text-cheesy-yellow font-extrabold tracking-[0.28em] text-sm sm:text-base uppercase font-display
                ${isHeroInView ? 'animate-bounce-eyebrow' : 'opacity-0'}
              `}
            >
              Sobre Nosotros
            </span>
          </div>

          {/* 2 y 3. Título escalonado línea por línea (sin recortes, choque y rebote natural) */}
          <div className="mb-6 flex flex-col items-start overflow-visible">
            <div className="overflow-visible">
              <h2
                className={`
                  text-3xl sm:text-5xl lg:text-6xl font-display font-black text-white leading-[1.08] tracking-tight
                  ${isHeroInView ? 'animate-bounce-title-1' : 'opacity-0'}
                `}
              >
                Una pasión
              </h2>
            </div>
            <div className="overflow-visible">
              <span
                className={`
                  inline-block text-3xl sm:text-5xl lg:text-6xl font-display font-black text-cheesy-yellow leading-[1.08] tracking-tight
                  ${isHeroInView ? 'animate-bounce-title-2' : 'opacity-0'}
                `}
              >
                que se comparte
              </span>
            </div>
          </div>

          {/* 4. Párrafo descriptivo (aparece último con clara diferencia de tiempo) */}
          <p
            className={`
              text-[#D1D0CB] text-base sm:text-lg leading-relaxed mb-3 sm:mb-4 max-w-lg font-normal
              ${isHeroInView ? 'animate-bounce-desc' : 'opacity-0'}
            `}
          >
            En <strong className="text-white font-semibold">CheesyBite</strong> creemos que una buena hamburguesa no es solo comida, es una experiencia. Por eso, usamos ingredientes de calidad, recetas originales y mucho amor en cada pedido.
          </p>

          {/* =====================================================
              BADGE ABAJO A LA DERECHA:
              - Animación de escritura live tras cargar el párrafo superior
              - Tipografía idéntica al badge del hero (font-badge / Caveat Brush)
              - Pegado al párrafo y desplazado a la derecha
              - Línea curva y corazón sincronizados al terminar de escribir
          ===================================================== */}
          <div className="w-full flex justify-end mt-0 sm:mt-1 translate-x-0 sm:translate-x-8 lg:translate-x-12">
            <HandwrittenBadge isTriggered={isHeroInView} />
          </div>
        </div>
      </div>
    </div>

      {/* =========================================================
          BLOQUE INFERIOR: NUESTRO SECRETO ARTESANAL (SCROLL-DRIVEN)
      ========================================================= */}
      <div className="mt-28 sm:mt-36 pt-16 border-t border-neutral-900 w-full">
        {/* Encabezado: "Nuestro" + Gota de Cheddar que explota y revela "Secreto Artesanal" */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={pillarsRef}
            className="text-center max-w-4xl mx-auto mb-16 sm:mb-24"
          >
            {/* Título interactivo */}
            <h3 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black leading-tight tracking-tight flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4">
              {/* "Nuestro" con aparición estética */}
              <span
                className={`text-white transition-all ${
                  isPillarsInView ? 'animate-nuestro-reveal' : 'opacity-0'
                }`}
              >
                Nuestro
              </span>

              {/* Contenedor de "Secreto Artesanal" con círculo y explosión estilo menú (sin sombras) */}
              <span className="relative inline-flex items-center justify-center">
                {/* Círculo que aparece y estalla con partículas radiales tipo filtro del menú */}
                {isPillarsInView && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
                    {/* Círculo amarillo central limpio (sin sombras) */}
                    <span className="animate-cheddar-circle w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-cheesy-yellow inline-block" />

                    {/* Partículas radiales expulsadas al estallar (sin sombras) */}
                    {TITLE_EXPLOSION_PARTICLES.map((p, i) => (
                      <span
                        key={i}
                        className="animate-title-particle absolute rounded-full bg-cheesy-yellow"
                        style={
                          {
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            '--tx': `${p.x}px`,
                            '--ty': `${p.y}px`,
                            animationDelay: `${800 + p.delay}ms`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </span>
                )}

                {/* Frase "Secreto Artesanal" que sale de la explosión (sin sombra) */}
                <span
                  className={`relative z-10 inline-block text-cheesy-yellow ${
                    isPillarsInView ? 'animate-cheddar-secret-emerge' : 'opacity-0'
                  }`}
                >
                  Secreto Artesanal
                </span>
              </span>
            </h3>

            <p
              className={`mt-4 text-neutral-400 text-sm sm:text-base max-w-xl mx-auto font-normal transition-opacity duration-1000 delay-1000 ${
                isPillarsInView ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Tres pilares donde la temperatura, los cortes seleccionados y la textura se funden a medida que avanzás en el recorrido.
            </p>
          </div>
        </div>

        {/* Las 3 secciones intercaladas que usan todo el largo de la página (w-full, sin padding lateral) */}
        <div className="w-full space-y-16 sm:space-y-24">
          {pillars.map((pillar) => (
            <ScrollPillarBand
              key={pillar.step}
              step={pillar.step}
              title={pillar.title}
              description={pillar.description}
              icon={pillar.icon}
              direction={pillar.direction}
              theme={pillar.theme}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
