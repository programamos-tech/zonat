'use client'

import { useState } from 'react'
import { WarrantyTable } from '@/components/warranties/warranty-table'
import { WarrantyDetailModal } from '@/components/warranties/warranty-detail-modal'
import { WarrantyModal } from '@/components/warranties/warranty-modal'
import { WarrantyEditModal } from '@/components/warranties/warranty-edit-modal'
import { useWarranties } from '@/contexts/warranty-context'
import { Warranty } from '@/types'

export default function WarrantiesPage() {
  const {
    warranties,
    loading,
    createWarranty,
    updateWarrantyStatus,
    searchWarranties,
    refreshWarranties
  } = useWarranties()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showWarrantyEditModal, setShowWarrantyEditModal] = useState(false)
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null)
  const [searchResults, setSearchResults] = useState<Warranty[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleCreateWarranty = () => {
    setSelectedWarranty(null)
    setShowCreateModal(true)
  }

  const handleViewWarranty = (warranty: Warranty) => {
    setSelectedWarranty(warranty)
    setShowDetailModal(true)
  }

  const handleEditWarranty = (warranty: Warranty) => {
    setSelectedWarranty(warranty)
    setShowWarrantyEditModal(true)
  }

  const handleSaveWarranty = async (warrantyData: Omit<Warranty, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createWarranty(warrantyData)
      setShowCreateModal(false)
      setShowEditModal(false)
      await refreshWarranties()
    } catch (error) {
      console.error('Error saving warranty:', error)
    }
  }

  const handleWarrantyEditSave = async (warranty: Warranty) => {
    try {
      await refreshWarranties()
      setShowWarrantyEditModal(false)
    } catch (error) {
      console.error('Error refreshing warranties:', error)
    }
  }

  const handleStatusChange = async (warrantyId: string, newStatus: string, notes?: string) => {
    try {
      await updateWarrantyStatus(warrantyId, newStatus, notes)
      await refreshWarranties()
    } catch (error) {
      console.error('Error updating warranty status:', error)
    }
  }

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await searchWarranties(searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching warranties:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const warrantiesToShow = searchResults.length > 0 ? searchResults : warranties

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <WarrantyTable
          warranties={warrantiesToShow}
          loading={loading || isSearching}
          onCreate={handleCreateWarranty}
          onView={handleViewWarranty}
          onEdit={handleEditWarranty}
          onStatusChange={handleStatusChange}
          onSearch={handleSearch}
        />

        {/* Modales */}
        {showCreateModal && (
          <WarrantyModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={handleSaveWarranty}
          />
        )}

        {showEditModal && selectedWarranty && (
          <WarrantyModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveWarranty}
            warranty={selectedWarranty}
          />
        )}

        {showDetailModal && selectedWarranty && (
          <WarrantyDetailModal
            warranty={selectedWarranty}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEditWarranty}
            onStatusChange={handleStatusChange}
          />
        )}

        {showWarrantyEditModal && selectedWarranty && (
          <WarrantyEditModal
            warranty={selectedWarranty}
            isOpen={showWarrantyEditModal}
            onClose={() => setShowWarrantyEditModal(false)}
            onSave={handleWarrantyEditSave}
          />
        )}
    </div>
  )
}
