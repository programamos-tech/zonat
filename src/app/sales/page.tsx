'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SalesTable } from '@/components/sales/sales-table'
import { SaleModal } from '@/components/sales/sale-modal'
import SaleDetailModal from '@/components/sales/sale-detail-modal'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { useSales } from '@/contexts/sales-context'
import { Sale } from '@/types'

export default function SalesPage() {
  const router = useRouter()
  const { 
    sales, 
    loading, 
    currentPage, 
    totalSales, 
    hasMore, 
    createSale, 
    deleteSale, 
    cancelSale,
    finalizeDraftSale,
    goToPage,
    searchSales,
    refreshSales
  } = useSales()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Marcar como montado para evitar errores de hidratación
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Verificar si hay una factura seleccionada en sessionStorage (solo en cliente)
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return
    
    const selectedInvoice = sessionStorage.getItem('selectedInvoice')
    if (selectedInvoice) {
      // Buscar la venta correspondiente a esta factura
      const foundSale = sales.find(sale => 
        sale.invoiceNumber.toLowerCase().includes(selectedInvoice.toLowerCase())
      )
      if (foundSale) {
        setSelectedSale(foundSale)
        setIsDetailModalOpen(true)
        // Limpiar el sessionStorage después de usarlo
        sessionStorage.removeItem('selectedInvoice')
      }
    }
  }, [sales, isMounted])

  // Sincronizar selectedSale con el estado actualizado del contexto
  useEffect(() => {
    if (selectedSale) {
      const updatedSale = sales.find(sale => sale.id === selectedSale.id)
      if (updatedSale && updatedSale.status !== selectedSale.status) {

        setSelectedSale(updatedSale)
      }
    }
  }, [sales, selectedSale])

  const handleEdit = (sale: Sale) => {

    // TODO: Implement edit modal
  }

  const handleDelete = async (sale: Sale) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la venta #${sale.id}?`)) {
      try {
        await deleteSale(sale.id)
      } catch (error) {
      // Error silencioso en producción
        alert('Error al eliminar la venta')
      }
    }
  }

  const handleView = (sale: Sale) => {
    setSelectedSale(sale)
    setIsDetailModalOpen(true)
  }

  const handleRefresh = async () => {
    await refreshSales()
  }

  const handleCreate = () => {
    setIsModalOpen(true)
  }

  const handleSaveSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    try {
      await createSale(saleData)
      setIsModalOpen(false)
    } catch (error) {
      // Error silencioso en producción
      alert('Error al crear la venta')
    }
  }

  const handlePrint = async (sale: Sale) => {
    try {
      // Importar el servicio de empresa dinámicamente
      const { CompanyService } = await import('@/lib/company-service')
      
      // Obtener configuración de empresa
      let companyConfig = await CompanyService.getCompanyConfig()
      if (!companyConfig) {
        companyConfig = await CompanyService.initializeDefaultConfig()
      }
      
      if (!companyConfig) {
        alert('Error: No se pudo cargar la configuración de la empresa')
        return
      }

      // Crear datos del cliente (usar datos de la venta o valores por defecto)
      const client = {
        id: sale.clientId,
        name: sale.clientName,
        email: 'N/A',
        phone: 'N/A',
        document: 'N/A',
        address: 'N/A',
        city: 'N/A',
        state: 'N/A',
        type: 'consumidor_final' as const,
        creditLimit: 0,
        currentDebt: 0,
        status: 'active' as const,
        nit: 'N/A',
        createdAt: sale.createdAt
      }

      // Crear ventana de impresión
      const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes')
      if (!printWindow) {
        alert('No se pudo abrir la ventana de impresión. Verifica que los pop-ups estén habilitados.')
        return
      }

      // Función para formatear moneda
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount)
      }

      // Generar HTML del ticket (incluye logo y datos fijos de Zona T)
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>ZONA T - Factura</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              margin: 0; 
              padding: 5px; 
              color: #000; 
              background: #fff;
              font-size: 12px;
              line-height: 1.2;
            }
            .ticket { 
              width: 300px; 
              margin: 0 auto; 
              border: 1px solid #000;
            }
            .header { 
              text-align: center; 
              padding: 10px 5px; 
              border-bottom: 1px dashed #000;
            }
            .logo {
              width: 64px;
              height: 64px;
              object-fit: contain;
              margin: 0 auto 6px auto;
              display: block;
            }
            .company-name { 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .company-info { 
              font-size: 10px; 
              line-height: 1.1;
            }
            .invoice-title { 
              text-align: center; 
              font-size: 14px; 
              font-weight: bold; 
              padding: 8px 0;
              border-bottom: 1px dashed #000;
            }
            .invoice-details { 
              padding: 8px 5px; 
              border-bottom: 1px dashed #000;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 2px 0; 
              font-size: 11px;
            }
            .client-info { 
              padding: 8px 5px; 
              border-bottom: 1px dashed #000;
            }
            .client-title { 
              font-weight: bold; 
              margin-bottom: 5px; 
              font-size: 11px;
            }
            .client-details { 
              font-size: 10px; 
              line-height: 1.1;
            }
            .products { 
              border-bottom: 1px dashed #000;
            }
            .product-item { 
              padding: 5px; 
              border-bottom: 1px dotted #ccc;
            }
            .product-name { 
              font-weight: bold; 
              font-size: 11px; 
              margin-bottom: 2px;
            }
            .product-details { 
              display: flex; 
              justify-content: space-between; 
              font-size: 10px;
            }
            .product-ref { 
              font-size: 9px; 
              color: #666; 
              margin-top: 2px;
            }
            .summary { 
              padding: 8px 5px; 
              border-bottom: 1px dashed #000;
            }
            .summary-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 2px 0; 
              font-size: 11px;
            }
            .total-row { 
              border-top: 1px solid #000; 
              padding-top: 5px; 
              margin-top: 5px; 
              font-weight: bold; 
              font-size: 12px;
            }
            .payment-info { 
              padding: 8px 5px; 
              border-bottom: 1px dashed #000;
            }
            .footer { 
              text-align: center; 
              padding: 10px 5px; 
              font-size: 9px; 
              line-height: 1.1;
            }
            .separator { 
              text-align: center; 
              margin: 5px 0; 
              font-size: 10px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .ticket { border: none; }
              .no-print { display: none !important; }
            }
            @page {
              margin: 0;
              size: 80mm auto;
            }
            @media print {
              @page {
                margin: 0;
                size: 80mm auto;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .ticket {
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <!-- Header -->
            <div class="header">
              <img src="/zonat-logo.png" class="logo" alt="ZONA T" />
              <div class="company-name">ZONA T</div>
              <div class="company-info">
                NIT 1035770226 - 9<br>
                Carrera 20#22-02, Sincelejo, Colombia.<br>
                3135206736
              </div>
            </div>

            <!-- Título de Factura -->
            <div class="invoice-title">FACTURA DE VENTA</div>

            <!-- Detalles de la Factura -->
            <div class="invoice-details">
              <div class="detail-row">
                <span><strong>No. Factura:</strong></span>
                <span><strong>${sale.invoiceNumber}</strong></span>
              </div>
              <div class="detail-row">
                <span>Fecha:</span>
                <span>${new Date(sale.createdAt).toLocaleDateString('es-CO')}</span>
              </div>
              <div class="detail-row">
                <span>Hora:</span>
                <span>${new Date(sale.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <!-- Información del Cliente -->
            <div class="client-info">
              <div class="client-title">CLIENTE:</div>
              <div class="client-details">
                ${client.name}<br>
                ${client.nit && client.nit !== 'N/A' ? `NIT: ${client.nit}` : ''}
              </div>
            </div>

            <!-- Productos -->
            <div class="products">
              ${sale.items.map(item => {
                const baseTotal = item.quantity * item.unitPrice
                const discountAmount = item.discountType === 'percentage' 
                  ? (baseTotal * (item.discount || 0)) / 100 
                  : (item.discount || 0)
                const subtotalAfterDiscount = Math.max(0, baseTotal - discountAmount)
                
                return `
                  <div class="product-item">
                    <div class="product-name">${item.productName}</div>
                    <div class="product-details">
                      <span>${item.quantity} x ${formatCurrency(item.unitPrice)}</span>
                      <span>${formatCurrency(subtotalAfterDiscount)}</span>
                    </div>
                    ${item.discount && item.discount > 0 ? `
                      <div style="font-size: 9px; color: #d32f2f;">
                        Desc: ${item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                      </div>
                    ` : ''}
                    <div class="product-ref">Ref: ${item.productReferenceCode || 'N/A'}</div>
                  </div>
                `
              }).join('')}
            </div>

            <!-- Resumen -->
            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(sale.items.reduce((sum, item) => {
                  const baseTotal = item.quantity * item.unitPrice
                  const discountAmount = item.discountType === 'percentage' 
                    ? (baseTotal * (item.discount || 0)) / 100 
                    : (item.discount || 0)
                  return sum + Math.max(0, baseTotal - discountAmount)
                }, 0))}</span>
              </div>
              ${sale.discount && sale.discount > 0.001 ? `
                <div class="summary-row" style="color: #d32f2f;">
                  <span>Descuento:</span>
                  <span>${sale.discountType === 'percentage' ? `-${sale.discount}%` : `-${formatCurrency(sale.discount)}`}</span>
                </div>
              ` : ''}
              ${sale.tax && sale.tax > 0 ? `
                <div class="summary-row">
                  <span>IVA (19%):</span>
                  <span>${formatCurrency(sale.tax)}</span>
                </div>
              ` : ''}
              <div class="summary-row total-row">
                <span>TOTAL:</span>
                <span>${formatCurrency(sale.total)}</span>
              </div>
            </div>

            <!-- Información de Pago -->
            <div class="payment-info">
              <div class="detail-row">
                <span>Método de Pago:</span>
                <span>${sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'credit' ? 'Crédito' : sale.paymentMethod === 'transfer' ? 'Transferencia' : sale.paymentMethod === 'warranty' ? 'Garantía' : 'Mixto'}</span>
              </div>
              ${sale.paymentMethod === 'mixed' && sale.payments && sale.payments.length > 0 ? `
                <div style="margin-top: 8px;">
                  <div style="font-weight: bold; margin-bottom: 4px;">Desglose de Pago:</div>
                  ${sale.payments.map(payment => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 11px;">
                      <span>${payment.paymentType === 'cash' ? 'Efectivo' : payment.paymentType === 'transfer' ? 'Transferencia' : payment.paymentType === 'credit' ? 'Crédito' : 'Garantía'}${payment.notes ? ` (${payment.notes})` : ''}:</span>
                      <span>${formatCurrency(payment.amount)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              <div class="detail-row">
                <span>Estado:</span>
                <span>${sale.status === 'completed' ? 'Completada' : sale.status === 'pending' ? 'Pendiente' : 'Anulada'}</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="separator">═══════════════════════════════</div>
              <div><strong>Factura: ${sale.invoiceNumber}</strong></div>
              <div>¡Gracias por su compra!</div>
              <div>ZONA T</div>
              <div class="separator">═══════════════════════════════</div>
            </div>
          </div>
        </body>
        </html>
      `

      // Escribir el HTML en la ventana
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()

      // Esperar a que se cargue y luego imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

    } catch (error) {
      // Error silencioso en producción
      alert('Error al generar la factura. Intenta nuevamente.')
    }
  }

  const handleCancelSale = async (saleId: string, reason: string) => {
    try {
      const result = await cancelSale(saleId, reason)
      // NO cerrar el modal, mantenerlo abierto para ver el resultado
      // setIsDetailModalOpen(false)
      // setSelectedSale(null)
      return result
    } catch (error) {
      // Error silencioso en producción
      alert('Error al cancelar la venta')
      throw error
    }
  }

  const handleFinalizeDraft = async (saleId: string) => {
    try {
      await finalizeDraftSale(saleId)
      // Actualizar la venta seleccionada si es la misma
      if (selectedSale && selectedSale.id === saleId) {
        const updatedSale = sales.find(s => s.id === saleId)
        if (updatedSale) {
          setSelectedSale(updatedSale)
        }
      }
    } catch (error) {
      // Error silencioso en producción
      alert('Error al facturar el borrador')
      throw error
    }
  }

  // Calcular total de ventas directas del día de hoy (solo efectivo y transferencia)
  const todaySalesTotal = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return sales
      .filter(sale => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= today && saleDate < tomorrow && sale.status !== 'cancelled'
      })
      .reduce((sum, sale) => {
        // Solo contar ventas con pago directo (efectivo o transferencia)
        if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'transfer') {
          return sum + sale.total
        } else if (sale.paymentMethod === 'mixed' && sale.payments) {
          // Para pagos mixtos, solo contar la parte en efectivo/transferencia
          const directPaymentAmount = sale.payments
            .filter(payment => payment.paymentType === 'cash' || payment.paymentType === 'transfer')
            .reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
          return sum + directPaymentAmount
        }
        // No contar ventas a crédito o garantía
        return sum
      }, 0)
  }, [sales])

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 dark:border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando ventas...</p>
        </div>
      </div>
    )
  }

  return (
    <RoleProtectedRoute module="sales" requiredAction="view">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-white dark:bg-gray-900 min-h-screen">
      <SalesTable
        todaySalesTotal={todaySalesTotal}
        sales={sales}
        loading={loading}
        currentPage={currentPage}
        totalSales={totalSales}
        hasMore={hasMore}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onCreate={handleCreate}
        onPrint={handlePrint}
        onPageChange={goToPage}
        onSearch={searchSales}
        onRefresh={handleRefresh}
      />

      <SaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSale}
      />

      <SaleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedSale(null)
        }}
        sale={selectedSale}
        onCancel={handleCancelSale}
        onPrint={handlePrint}
        onFinalizeDraft={handleFinalizeDraft}
      />
    </div>
    </RoleProtectedRoute>
  )
}
