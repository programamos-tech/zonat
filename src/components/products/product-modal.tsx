'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, Package, Store, ImageIcon } from 'lucide-react'
import { Product, Category } from '@/types'
import { useProducts } from '@/contexts/products-context'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'

const inputBase =
  'w-full rounded-lg border border-zinc-200/90 bg-white/95 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-[opacity,background-color,border-color] focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25'

function SectionCard({
  title,
  children,
  description,
  className,
}: {
  title: string
  children: React.ReactNode
  description?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'product-modal-section rounded-xl border border-zinc-200/90 bg-white/80 p-3.5 transition-opacity duration-200 dark:border-zinc-700/80 dark:bg-zinc-900/80',
        'focus-within:border-zinc-300 focus-within:bg-white dark:focus-within:border-zinc-600 dark:focus-within:bg-zinc-900',
        className
      )}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Omit<Product, 'id'>) => void
  product?: Product | null
  categories: Category[]
}

export function ProductModal({ isOpen, onClose, onSave, product, categories }: ProductModalProps) {
  const { products } = useProducts()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  const isMainStore = !user?.storeId || user.storeId === MAIN_STORE_ID
  const [formData, setFormData] = useState({
    name: product?.name || '',
    reference: product?.reference || '',
    description: product?.description || '',
    price: product?.price || 0,
    onlinePrice: product?.onlinePrice || 0,
    cost: product?.cost || 0,
    stock: {
      warehouse: product?.stock?.warehouse || 0,
      store: product?.stock?.store || 0,
      total: product?.stock?.total || 0,
    },
    categoryId: product?.categoryId || '',
    brand: product?.brand || '',
    status: product?.status || 'active',
    initialLocation: 'store' as 'warehouse' | 'store',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [catalogImageUrl, setCatalogImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const catalogFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        reference: product.reference || '',
        description: product.description || '',
        price: product.price || 0,
        onlinePrice: product.onlinePrice || 0,
        cost: product.cost || 0,
        stock: {
          warehouse: product.stock?.warehouse || 0,
          store: product.stock?.store || 0,
          total: product.stock?.total || 0,
        },
        categoryId: product.categoryId || '',
        brand: product.brand || '',
        status: product.status || 'active',
        initialLocation: 'store' as 'warehouse' | 'store',
      })
      setCatalogImageUrl(product.imageUrl?.trim() || null)
    } else {
      setCatalogImageUrl(null)
    }
    setUploadPreview(null)
  }, [product])

  const formatNumber = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue) || numValue === 0) return ''

    if (Number.isInteger(numValue)) {
      return numValue.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    }
    return numValue.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  const parseFormattedNumber = (value: string): number => {
    const cleanValue = value.replace(/\./g, '').replace(/,/g, '')
    return parseFloat(cleanValue) || 0
  }

  const getStatusSelectedClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-brand-lime text-white shadow-sm'
      case 'inactive':
        return 'bg-zinc-500 text-white shadow-sm dark:bg-zinc-600'
      case 'discontinued':
        return 'bg-zinc-700 text-white shadow-sm dark:bg-zinc-500'
      case 'out_of_stock':
        return 'bg-brand-coral text-white shadow-sm'
      default:
        return 'bg-zinc-500 text-white shadow-sm'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'inactive':
        return 'Inactivo'
      case 'discontinued':
        return 'Descontinuado'
      case 'out_of_stock':
        return 'Sin Stock'
      default:
        return status
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    if (!formData.reference.trim()) {
      newErrors.reference = 'La referencia es requerida'
    } else {
      const referenceExists = products.some(
        p =>
          p.reference.toLowerCase() === formData.reference.toLowerCase() && (!product || p.id !== product.id)
      )

      if (referenceExists) {
        newErrors.reference = 'Esta referencia ya existe en otro producto'
      }
    }
    if (formData.price <= 0) {
      newErrors.price = 'El precio por mayor debe ser mayor a 0'
    }
    if (formData.onlinePrice < 0) {
      newErrors.onlinePrice = 'El precio tienda virtual no puede ser negativo'
    }
    if (formData.cost < 0) {
      newErrors.cost = 'El costo no puede ser negativo'
    }
    if (formData.stock.warehouse < 0) {
      newErrors.stockWarehouse = 'El stock de bodega no puede ser negativo'
    }
    if (formData.stock.store < 0) {
      newErrors.stockStore = 'El stock de local no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCatalogImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setUploadPreview(blobUrl)
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/storage/upload-product-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al subir')
      const url = typeof json.url === 'string' ? json.url.trim() : ''
      if (!url) throw new Error('El servidor no devolvió la URL de la imagen')
      setCatalogImageUrl(url)
      toast.success('Imagen del catálogo guardada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      URL.revokeObjectURL(blobUrl)
      setUploadPreview(null)
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value,
        },
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSave = () => {
    if (validateForm()) {
      const totalStock = formData.stock.warehouse + formData.stock.store
      const productData: Omit<Product, 'id'> = {
        name: formData.name.trim(),
        reference: formData.reference.trim(),
        description: formData.description.trim(),
        price: formData.price,
        onlinePrice: formData.onlinePrice,
        cost: formData.cost,
        stock: {
          warehouse: formData.stock.warehouse,
          store: formData.stock.store,
          total: totalStock,
        },
        categoryId: formData.categoryId,
        brand: formData.brand.trim(),
        status: formData.status,
        imageUrl: catalogImageUrl?.trim() || null,
        createdAt: product?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      onSave(productData)
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      reference: '',
      description: '',
      price: 0,
      onlinePrice: 0,
      cost: 0,
      stock: {
        warehouse: 0,
        store: 0,
        total: 0,
      },
      categoryId: '',
      brand: '',
      status: 'active',
      initialLocation: 'store',
    })
    setCatalogImageUrl(null)
    setUploadPreview(null)
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  const formId = 'product-modal-form'
  const isEdit = !!product

  const modal = (
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center px-3 py-3 sm:py-5 xl:left-60">
      <div
        className="zonat-preserve-surface flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[min(68rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-950/95 sm:max-h-[calc(100dvh-2.5rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex min-w-0 items-center gap-2.5">
            <Package className="h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">
              <h2 id="product-modal-title" className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                {isEdit ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {isEdit ? `Editando ${product.name}` : 'Crea un producto en tu inventario'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent px-4 py-3 md:px-5 md:py-4">
          <form
            id={formId}
            onSubmit={e => {
              e.preventDefault()
              handleSave()
            }}
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <SectionCard title="Información básica">
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="product-name" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Nombre <span className="text-zinc-400">*</span>
                        </label>
                        <input
                          id="product-name"
                          type="text"
                          value={formData.name}
                          onChange={e => handleInputChange('name', e.target.value)}
                          className={cn(inputBase, errors.name && 'border-red-400')}
                          placeholder="Nombre del producto"
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="product-ref" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Referencia <span className="text-zinc-400">*</span>
                        </label>
                        <input
                          id="product-ref"
                          type="text"
                          value={formData.reference}
                          onChange={e => handleInputChange('reference', e.target.value)}
                          className={cn(inputBase, errors.reference && 'border-red-400')}
                          placeholder="REF-001"
                        />
                        {errors.reference && <p className="mt-1 text-xs text-red-500">{errors.reference}</p>}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="product-desc" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Descripción
                      </label>
                      <textarea
                        id="product-desc"
                        value={formData.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                        className={cn(inputBase, 'min-h-[2.5rem] resize-none')}
                        placeholder="Opcional"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="product-brand" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Marca
                        </label>
                        <input
                          id="product-brand"
                          type="text"
                          value={formData.brand}
                          onChange={e => handleInputChange('brand', e.target.value)}
                          className={inputBase}
                          placeholder="Opcional"
                        />
                      </div>
                      <div>
                        <label htmlFor="product-cat" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Categoría
                        </label>
                        <select
                          id="product-cat"
                          value={formData.categoryId}
                          onChange={e => handleInputChange('categoryId', e.target.value)}
                          className={inputBase}
                        >
                          <option value="">Seleccionar</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Imagen" description="Máx. 5MB">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/60">
                      {uploadPreview || catalogImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={uploadPreview || catalogImageUrl || ''}
                          alt="Vista previa"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-zinc-400" strokeWidth={1.5} aria-hidden />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <input
                        ref={catalogFileInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingImage}
                        onChange={handleCatalogImageFile}
                      />
                      <p className="mr-auto hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
                        {uploadPreview || catalogImageUrl
                          ? 'Imagen lista para el catálogo'
                          : 'Foto para ficha y listados'}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingImage}
                          onClick={() => catalogFileInputRef.current?.click()}
                          className="h-9 min-w-[5.5rem]"
                        >
                          {uploadingImage ? 'Subiendo…' : 'Subir'}
                        </Button>
                        {catalogImageUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 text-zinc-500"
                            disabled={uploadingImage}
                            onClick={() => setCatalogImageUrl(null)}
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Precios">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div>
                      <label htmlFor="product-price" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Mayor <span className="text-zinc-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm text-zinc-400">
                          $
                        </span>
                        <input
                          id="product-price"
                          type="text"
                          value={formatNumber(formData.price)}
                          onChange={e => handleInputChange('price', parseFormattedNumber(e.target.value))}
                          className={cn(inputBase, 'pl-7', errors.price && 'border-red-400')}
                          placeholder="0"
                        />
                      </div>
                      {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                    </div>
                    <div>
                      <label htmlFor="product-online-price" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Web
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm text-zinc-400">
                          $
                        </span>
                        <input
                          id="product-online-price"
                          type="text"
                          value={formatNumber(formData.onlinePrice)}
                          onChange={e => handleInputChange('onlinePrice', parseFormattedNumber(e.target.value))}
                          className={cn(inputBase, 'pl-7')}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="product-cost" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Costo
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm text-zinc-400">
                          $
                        </span>
                        <input
                          id="product-cost"
                          type="text"
                          value={formatNumber(formData.cost)}
                          onChange={e => handleInputChange('cost', parseFormattedNumber(e.target.value))}
                          className={cn(inputBase, 'pl-7')}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">Web en 0 = no aparece en /tienda.</p>
                </SectionCard>
              </div>

              <div className="flex flex-col gap-3">
                <SectionCard title="Control de stock">
                  {product && (
                    <p className="mb-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Solo referencia. Ajusta o transfiere desde la tabla de productos.
                    </p>
                  )}

                  {!product && isMainStore && (
                    <div className="mb-3">
                      <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Ubicación inicial
                      </span>
                      <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                        <button
                          type="button"
                          onClick={() => handleInputChange('initialLocation', 'store')}
                          className={cn(
                            'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors',
                            formData.initialLocation === 'store'
                              ? 'bg-brand-lime text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                          )}
                        >
                          <Store className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Local
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('initialLocation', 'warehouse')}
                          className={cn(
                            'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors',
                            formData.initialLocation === 'warehouse'
                              ? 'bg-brand-coral text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                          )}
                        >
                          <Package className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Bodega
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={cn('grid grid-cols-1 gap-3', isMainStore && 'sm:grid-cols-2')}>
                    <div
                      className={cn(
                        'rounded-lg border border-zinc-200 bg-white p-2.5 transition-shadow dark:border-zinc-700 dark:bg-zinc-900/40',
                        !product && formData.initialLocation === 'store'
                          ? 'shadow-md ring-1 ring-zinc-200/80 dark:ring-zinc-600/60'
                          : 'shadow-none'
                      )}
                    >
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Local</span>
                      </div>
                      {product ? (
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
                          {formatNumber(formData.stock.store)} u.
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formatNumber(formData.stock.store)}
                          onChange={e => handleInputChange('stock.store', parseFormattedNumber(e.target.value))}
                          className={cn(inputBase, errors.stockStore && 'border-red-400')}
                          placeholder="0"
                        />
                      )}
                      {errors.stockStore && <p className="mt-1 text-xs text-red-500">{errors.stockStore}</p>}
                    </div>

                    {isMainStore && (
                      <div
                        className={cn(
                          'rounded-lg border border-zinc-200 bg-white p-2.5 transition-shadow dark:border-zinc-700 dark:bg-zinc-900/40',
                          !product && formData.initialLocation === 'warehouse'
                            ? 'shadow-md ring-1 ring-zinc-200/80 dark:ring-zinc-600/60'
                            : 'shadow-none'
                        )}
                      >
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Bodega</span>
                        </div>
                        {product ? (
                          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
                            {formatNumber(formData.stock.warehouse)} u.
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={formatNumber(formData.stock.warehouse)}
                            onChange={e =>
                              handleInputChange('stock.warehouse', parseFormattedNumber(e.target.value))
                            }
                            className={cn(inputBase, errors.stockWarehouse && 'border-red-400')}
                            placeholder="0"
                          />
                        )}
                        {errors.stockWarehouse && (
                          <p className="mt-1 text-xs text-red-500">{errors.stockWarehouse}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                    <span className="text-xs font-medium text-zinc-500">Stock total</span>
                    <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
                      {formatNumber(
                        isMainStore ? formData.stock.warehouse + formData.stock.store : formData.stock.store
                      )}{' '}
                      <span className="font-normal text-zinc-500">u.</span>
                    </span>
                  </div>
                </SectionCard>

                <SectionCard title="Estado">
                  <div className="flex flex-wrap gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                    {(['active', 'inactive', 'discontinued', 'out_of_stock'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleInputChange('status', status)}
                        className={cn(
                          'min-h-9 flex-1 rounded-md px-2.5 text-xs font-medium transition-colors sm:text-sm',
                          formData.status === status
                            ? getStatusSelectedClass(status)
                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        )}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          </form>
        </div>

        <footer
          className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90"
          style={{ paddingBottom: `max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))` }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            <Package className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </footer>
      </div>
    </div>
  )

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
