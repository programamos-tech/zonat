'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ProductDetailRedirect() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.productId as string
  
  useEffect(() => {
    if (productId) {
      router.replace(`/inventory/products/${productId}`)
    }
  }, [router, productId])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  )
}
