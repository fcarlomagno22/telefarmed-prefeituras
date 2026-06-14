import { useCallback } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  createUbtAgendaConsulta,
  createUbtAgendaWalkIn,
  updateUbtAgendaConsulta,
} from '../lib/services/ubt/agenda'
import { invalidateUbtScheduleCatalogCache } from './useUbtScheduleCatalog'

export function useUbtAgendaMutations() {
  const { getAccessToken } = useUbtAuth()

  const scheduleConsulta = useCallback(
    async (payload: {
      pacienteId: string
      profissionalId: string
      especialidadeId: string
      data: string
      hora: string
      telefoneContato?: string
    }) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const appointment = await createUbtAgendaConsulta(token, payload)
      invalidateUbtScheduleCatalogCache()
      return appointment
    },
    [getAccessToken],
  )

  const rescheduleConsulta = useCallback(
    async (
      consultaId: string,
      payload: {
        profissionalId: string
        especialidadeId: string
        data: string
        hora: string
      },
    ) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const appointment = await updateUbtAgendaConsulta(token, consultaId, {
        ...payload,
        status: 'agendado',
      })
      invalidateUbtScheduleCatalogCache()
      return appointment
    },
    [getAccessToken],
  )

  const registerWalkIn = useCallback(
    async (payload: {
      pacienteId: string
      especialidadeId: string
      profissionalId: string
      hora: string
      telefoneContato?: string
    }) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const appointment = await createUbtAgendaWalkIn(token, payload)
      invalidateUbtScheduleCatalogCache()
      return appointment
    },
    [getAccessToken],
  )

  return {
    scheduleConsulta,
    rescheduleConsulta,
    registerWalkIn,
  }
}
