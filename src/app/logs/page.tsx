'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { LogsTable } from '@/components/logs/logs-table'
import { LogDetailModal } from '@/components/logs/log-detail-modal'
import { LogsService, LogEntry } from '@/lib/logs-service'

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [currentOffset, setCurrentOffset] = useState(0)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Cargar logs iniciales al montar el componente
  useEffect(() => {
    loadInitialLogs()
  }, [])

  // Configurar observer para scroll infinito
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreLogs()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [hasMore, loadingMore])

  const loadInitialLogs = async () => {
    setLoading(true)
    setCurrentOffset(0)
    try {
      console.log('🔄 Cargando logs iniciales...')
      const { logs: logsData, hasMore: hasMoreData } = await LogsService.getLogsPaginated(0, 20)
      console.log('✅ Logs iniciales cargados:', logsData)
      setLogs(logsData)
      setHasMore(hasMoreData)
      setCurrentOffset(20)
    } catch (error) {
      console.error('❌ Error cargando logs iniciales:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreLogs = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      console.log(`🔄 Cargando más logs (offset: ${currentOffset})...`)
      const { logs: newLogs, hasMore: hasMoreData } = await LogsService.getLogsPaginated(currentOffset, 20)
      console.log('✅ Más logs cargados:', newLogs)
      
      setLogs(prevLogs => [...prevLogs, ...newLogs])
      setHasMore(hasMoreData)
      setCurrentOffset(prevOffset => prevOffset + 20)
    } catch (error) {
      console.error('❌ Error cargando más logs:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const loadLogs = async () => {
    await loadInitialLogs()
  }

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false)
    setSelectedLog(null)
  }

  // Filtrar logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter

    return matchesSearch && matchesModule && matchesAction
  })

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <LogsTable
        logs={filteredLogs as any}
        onViewDetails={handleViewDetails as any}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        moduleFilter={moduleFilter}
        onModuleFilterChange={setModuleFilter}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        onRefresh={loadLogs}
        loadingMore={loadingMore}
        hasMore={hasMore}
      />

      {/* Indicador de carga para scroll infinito */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          {loadingMore ? (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              <span>Cargando más actividades...</span>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              Desplázate hacia abajo para cargar más
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay más logs */}
      {!hasMore && logs.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            No hay más actividades para mostrar
          </div>
        </div>
      )}

      <LogDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        log={selectedLog as any}
      />
    </div>
  )
}
