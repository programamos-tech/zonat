'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ProductDetailRedirect() {
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
