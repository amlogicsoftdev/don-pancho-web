import React from 'react'

/** Ola orgánica de queso cheddar para la transición inferior del Hero */
export function CheddarHeroWaveBottom({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute -bottom-px left-0 right-0 z-10 w-full overflow-hidden leading-none select-none pointer-events-none ${className}`}>
      {/* Versión Mobile: Olas bajas y contenidas en las esquinas para no tapar la hamburguesa */}
      <svg
        viewBox="0 0 1440 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-12 block sm:hidden"
      >
        {/* Ola de cheddar izquierda en mobile — caída rápida y suave que despeja el centro */}
        <path
          d="M 0,35 C 20,40 40,85 60,115 C 80,155 110,195 160,205 C 210,215 250,225 320,240 L 0,240 Z"
          fill="#F5B900"
        />

        {/* Ola de cheddar derecha en mobile — suave y baja como la original */}
        <path
          d="M 1120,240 C 1190,225 1230,215 1280,205 C 1330,195 1360,155 1380,115 C 1400,85 1420,40 1440,35 L 1440,240 Z"
          fill="#F5B900"
        />
      </svg>

      {/* Versión Desktop: Calcada exacta de mockup */}
      <svg
        viewBox="0 0 1440 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-36 lg:h-48 hidden sm:block"
      >
        {/* Ola de cheddar izquierda desktop */}
        <path
          d="M 0,30 C 70,45 120,85 180,85 C 230,85 260,60 310,70 C 360,80 390,135 450,140 C 490,145 520,125 560,145 C 600,165 630,210 670,230 C 690,240 710,240 730,240 L 0,240 Z"
          fill="#F5B900"
        />

        {/* Ola de cheddar derecha desktop */}
        <path
          d="M 1120,240 C 1180,220 1240,205 1300,205 C 1360,205 1395,175 1410,95 C 1420,40 1430,10 1440,0 L 1440,240 Z"
          fill="#F5B900"
        />
      </svg>
    </div>
  )
}
