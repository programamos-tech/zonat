'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  }[size]

  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn("tracking-tighter", textSizes)} style={{ fontFamily: 'var(--font-inter)', fontWeight: 900, color: 'var(--sidebar-orange)' }}>
        Oviler
      </span>
    </div>
  )
}
