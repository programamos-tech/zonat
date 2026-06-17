import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicProductDetailById, getPublicCatalogStoreInfo } from '@/lib/public-catalog'
import { ProductDetailClient } from '@/components/tienda/product-detail-client'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ productId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params
  const p = await getPublicProductDetailById(productId)
  if (!p) {
    return { title: 'Producto | ZONA T' }
  }
  const desc = p.description?.trim().slice(0, 155) || `Producto ${p.name} — ZONA T`
  return {
    title: `${p.name} | ZONA T`,
    description: desc
  }
}

export default async function TiendaProductPage({ params }: Props) {
  const { productId } = await params
  const [product, store] = await Promise.all([
    getPublicProductDetailById(productId),
    getPublicCatalogStoreInfo()
  ])
  if (!product) {
    notFound()
  }
  return <ProductDetailClient product={product} store={store} />
}
