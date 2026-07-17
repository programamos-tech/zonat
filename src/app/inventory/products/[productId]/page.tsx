'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

/**
 * La ficha de producto ya no se usa: al entrar por URL antigua
 * redirigimos a la lista abriendo el modal de edición.
 */
export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.productId as string | undefined

  useEffect(() => {
    if (!productId) {
      router.replace('/inventory/products')
      return
    }
    router.replace(`/inventory/products?edit=${encodeURIComponent(productId)}`)
  }, [router, productId])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
    </div>
  )
}
