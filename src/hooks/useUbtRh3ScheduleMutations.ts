import { useCallback } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  createRh3ImmediateConsultation,
  fetchRh3ScheduleAvailability,
  scheduleRh3Appointment,
  type CreateRh3ImmediateConsultationPayload,
  type ScheduleRh3AppointmentPayload,
} from '../lib/services/ubt/rh3'

export function useUbtRh3ScheduleMutations() {
  const { getAccessToken } = useUbtAuth()

  const loadRh3Availability = useCallback(
    async (
      rh3EspecialidadId: number,
      params?: { date?: string; date_from?: string; language?: string },
    ) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchRh3ScheduleAvailability(token, rh3EspecialidadId, params)
    },
    [getAccessToken],
  )

  const bookRh3Appointment = useCallback(
    async (payload: ScheduleRh3AppointmentPayload) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return scheduleRh3Appointment(token, payload)
    },
    [getAccessToken],
  )

  const bookRh3ImmediateConsultation = useCallback(
    async (payload: CreateRh3ImmediateConsultationPayload) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return createRh3ImmediateConsultation(token, payload)
    },
    [getAccessToken],
  )

  return {
    loadRh3Availability,
    bookRh3Appointment,
    bookRh3ImmediateConsultation,
  }
}
