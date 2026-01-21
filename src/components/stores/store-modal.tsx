'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  X, 
  Store as StoreIcon,
  Building2,
  MapPin,
  FileText,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { Store } from '@/types'

interface StoreModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (store: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'deletedAt'>) => void
  store?: Store | null
}

export function StoreModal({ isOpen, onClose, onSave, store }: StoreModalProps) {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    nit: store?.nit || '',
    logo: store?.logo || '',
    address: store?.address || '',
    city: store?.city || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)

  // Actualizar formulario cuando cambie la tienda
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        nit: store.nit || '',
        logo: store.logo || '',
        address: store.address || '',
        city: store.city || ''
      })
    } else {
      setFormData({
        name: '',
        nit: '',
        logo: '',
        address: '',
        city: ''
      })
    }
    setErrors({})
  }, [store])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Nombre obligatorio
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la tienda es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      const storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'deletedAt'> = {
        name: formData.name.trim(),
        nit: formData.nit.trim() || undefined,
        logo: formData.logo.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined
      }
      onSave(storeData)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, logo: 'El archivo debe ser una imagen' })
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, logo: 'La imagen no debe superar los 2MB' })
      return
    }

    try {
      setIsUploading(true)
      // Aquí se podría implementar la subida a un servicio de almacenamiento
      // Por ahora, usamos una URL temporal o base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setFormData({ ...formData, logo: result })
        setErrors({ ...errors, logo: '' })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading logo:', error)
      setErrors({ ...errors, logo: 'Error al subir la imagen' })
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <StoreIcon className="h-6 w-6 text-emerald-600" />
              {store ? 'Editar Tienda' : 'Nueva Tienda'}
            </CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Logo Preview/Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo de la Tienda
            </Label>
            <div className="flex items-center gap-4">
              {formData.logo ? (
                <div className="relative">
                  <img
                    src={formData.logo}
                    alt="Logo"
                    className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                  <Button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: '' })}
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isUploading}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? 'Subiendo...' : formData.logo ? 'Cambiar Logo' : 'Subir Logo'}
                  </Button>
                </label>
                {errors.logo && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.logo}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Máximo 2MB. Formatos: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <StoreIcon className="h-4 w-4" />
              Nombre de la Tienda *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Tienda Centro"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* NIT */}
          <div className="space-y-2">
            <Label htmlFor="nit" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              NIT
            </Label>
            <Input
              id="nit"
              value={formData.nit}
              onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
              placeholder="Ej: 900123456-7"
            />
          </div>

          {/* Ciudad */}
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ciudad
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ej: Bogotá"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Dirección
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ej: Calle 10 # 20-30"
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {store ? 'Actualizar' : 'Crear'} Tienda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
