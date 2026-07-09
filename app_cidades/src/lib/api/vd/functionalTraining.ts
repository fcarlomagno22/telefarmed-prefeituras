import type { WorkoutMode } from '../../../types/functionalTraining'
import { vdRequest } from './client'

export type FunctionalTrainingFavoritosDto = {
  exerciseIds: string[]
}

export type FunctionalTrainingSessaoDto = {
  id: string
  clientSessionId: string
  mode: WorkoutMode
  durationSec: number
  totalActiveSec: number
  exerciseIds: string[]
  completedAt: string
  createdAt: string
  updatedAt: string
}

export type RegisterFunctionalTrainingSessaoResult = {
  session: FunctionalTrainingSessaoDto
}

export type CreateFunctionalTrainingSessaoInput = {
  clientSessionId: string
  mode: WorkoutMode
  durationSec: number
  totalActiveSec: number
  exerciseIds: string[]
  completedAt: string
}

export type FunctionalTrainingSessaoListResultDto = {
  sessions: FunctionalTrainingSessaoDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type WeeklyTrainingStatsDto = {
  sessionsCount: number
  totalActiveMinutes: number
  uniqueExercises: number
}

export type ListFunctionalTrainingSessoesQuery = {
  startIso?: string
  endIso?: string
  page?: number
  pageSize?: number
}

export async function getFunctionalTrainingFavoritos(): Promise<FunctionalTrainingFavoritosDto> {
  return vdRequest<FunctionalTrainingFavoritosDto>({
    method: 'GET',
    path: '/vd/functional-training/favoritos',
    credentials: 'include',
  })
}

export async function addFunctionalTrainingFavorito(
  exerciseId: string,
): Promise<FunctionalTrainingFavoritosDto> {
  return vdRequest<FunctionalTrainingFavoritosDto>({
    method: 'PUT',
    path: `/vd/functional-training/favoritos/${encodeURIComponent(exerciseId)}`,
    credentials: 'include',
  })
}

export async function removeFunctionalTrainingFavorito(
  exerciseId: string,
): Promise<FunctionalTrainingFavoritosDto> {
  return vdRequest<FunctionalTrainingFavoritosDto>({
    method: 'DELETE',
    path: `/vd/functional-training/favoritos/${encodeURIComponent(exerciseId)}`,
    credentials: 'include',
  })
}

export async function registerFunctionalTrainingSessao(
  input: CreateFunctionalTrainingSessaoInput,
): Promise<RegisterFunctionalTrainingSessaoResult> {
  return vdRequest<RegisterFunctionalTrainingSessaoResult>({
    method: 'POST',
    path: '/vd/functional-training/sessoes',
    body: input,
    credentials: 'include',
  })
}

export async function listFunctionalTrainingSessoes(
  query: ListFunctionalTrainingSessoesQuery = {},
): Promise<FunctionalTrainingSessaoListResultDto> {
  return vdRequest<FunctionalTrainingSessaoListResultDto>({
    method: 'GET',
    path: '/vd/functional-training/sessoes',
    query: {
      startIso: query.startIso,
      endIso: query.endIso,
      page: query.page != null ? String(query.page) : undefined,
      pageSize: query.pageSize != null ? String(query.pageSize) : undefined,
    },
    credentials: 'include',
  })
}

export async function getFunctionalTrainingEstatisticasSemanais(options?: {
  weekStartIso?: string
}): Promise<WeeklyTrainingStatsDto> {
  return vdRequest<WeeklyTrainingStatsDto>({
    method: 'GET',
    path: '/vd/functional-training/estatisticas-semanais',
    query: {
      weekStartIso: options?.weekStartIso,
    },
    credentials: 'include',
  })
}
