import type { SleepQualityScore } from '../../../types/sleepLog'
import { vdRequest } from './client'

export type SleepTimeRegistroDto = {
  id: string
  clientLogId: string
  bedAt: string
  wakeAt: string
  durationMinutes: number
  quality: SleepQualityScore
  wakeCount: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type RegisterSleepTimeRegistroResult = {
  registro: SleepTimeRegistroDto
}

export type CreateSleepTimeRegistroInput = {
  clientLogId: string
  bedAt: string
  wakeAt: string
  quality: SleepQualityScore
  wakeCount: number
  notes?: string
}

export type SleepTimeRegistroListResultDto = {
  registros: SleepTimeRegistroDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type ListSleepTimeRegistrosQuery = {
  startIso?: string
  endIso?: string
  page?: number
  pageSize?: number
}

export async function registerSleepLog(
  input: CreateSleepTimeRegistroInput,
): Promise<RegisterSleepTimeRegistroResult> {
  return vdRequest<RegisterSleepTimeRegistroResult>({
    method: 'POST',
    path: '/vd/sleep-time/registros',
    body: input,
    credentials: 'include',
  })
}

export async function listSleepLogs(
  query: ListSleepTimeRegistrosQuery = {},
): Promise<SleepTimeRegistroListResultDto> {
  return vdRequest<SleepTimeRegistroListResultDto>({
    method: 'GET',
    path: '/vd/sleep-time/registros',
    query: {
      startIso: query.startIso,
      endIso: query.endIso,
      page: query.page != null ? String(query.page) : undefined,
      pageSize: query.pageSize != null ? String(query.pageSize) : undefined,
    },
    credentials: 'include',
  })
}

export async function deleteSleepLog(id: string): Promise<RegisterSleepTimeRegistroResult> {
  return vdRequest<RegisterSleepTimeRegistroResult>({
    method: 'DELETE',
    path: `/vd/sleep-time/registros/${encodeURIComponent(id)}`,
    credentials: 'include',
  })
}
