'use client'

import { UserManagement } from '@/components/roles/user-management'

export default function RolesPage() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <UserManagement />
    </div>
  )
}