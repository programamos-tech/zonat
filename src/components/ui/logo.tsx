'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useState } from 'react'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, showText = false, size = 'md' }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  
  const logoSize = {
    sm: 32,
    md: 48,
    lg: 64
  }[size]

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  }[size]

  if (imageError) {
    return (
      <div className={cn("flex items-center", className)}>
        {/* Fallback Logo */}
        <div 
          className={cn(
            "bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold",
            textSize
          )}
          style={{ width: logoSize, height: logoSize }}
        >
          ZT
        </div>
        {showText && (
          <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
            ZONA T
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center", className)}>
      {/* Logo Image */}
      <div className="relative">
        <Image
          src="/zonat-logo.png"
          alt="ZONA T Logo"
          width={logoSize}
          height={logoSize}
          className="rounded-lg object-contain"
          priority
          unoptimized
          onError={() => setImageError(true)}
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
