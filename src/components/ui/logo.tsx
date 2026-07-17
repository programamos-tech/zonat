'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Logo({ className, showText = false, size = 'md' }: LogoProps) {
  const logoSize = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  }[size]

  return (
    <div className={cn('flex items-center', className)}>
      <div className="relative shrink-0" style={{ width: logoSize, height: logoSize }}>
        <Image
          src="/zonat-logo.png"
          alt="ZONA T Logo"
          width={logoSize}
          height={logoSize}
          className="h-full w-full object-contain"
          priority
          unoptimized
        />
      </div>
      {showText && (
        <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
          ZONA T
        </span>
      )}
    </div>
  )
}
