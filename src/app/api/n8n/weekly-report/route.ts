import { NextRequest } from 'next/server'
import { handleWeeklyReportRequest } from '@/lib/weekly-report/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  return handleWeeklyReportRequest(request)
}

export async function POST(request: NextRequest) {
  return handleWeeklyReportRequest(request)
}
