import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AdminMunicipalPatient,
  AdminMunicipalPatientDetail,
  AdminPatientContractingEntity,
} from '../types/adminPacientes'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  cancelPacientePreCadastro,
  concludePacientePreCadastro,
  createPaciente,
  createPacientePreCadastroDraft,
  downloadPacientesExport,
  fetchPacienteByCpf,
  fetchPacienteDetail,
  fetchPacientesContractingEntities,
  fetchPacientesRows,
  fetchPacientesSummary,
  inactivatePaciente,
  isAdminPacientesApiError,
  submitPacientePreCadastro,
  updatePaciente,
  type CreatePacientePayload,
  type PacientesSummaryResponse,
  type PreCadastroRegistrationPayload,
  type UpdatePacientePayload,
} from '../lib/services/admin/pacientes'

const SEARCH_DEBOUNCE_MS = 300

export function useAdminPacientesPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [patients, setPatients] = useState<AdminMunicipalPatient[]>([])
  const [summary, setSummary] = useState<PacientesSummaryResponse | null>(null)
  const [contractingEntities, setContractingEntities] = useState<AdminPatientContractingEntity[]>(
    [],
  )
  const [selectedMunicipality, setSelectedMunicipality] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const municipalityFilter = selectedMunicipality === 'all' ? undefined : selectedMunicipality

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const listParams = {
        municipio: municipalityFilter,
        search: debouncedSearch || undefined,
      }
      const [summaryData, rows, entities] = await Promise.all([
        fetchPacientesSummary(token, { municipio: municipalityFilter }),
        fetchPacientesRows(token, listParams),
        fetchPacientesContractingEntities(token),
      ])
      setSummary(summaryData)
      setPatients(rows)
      setContractingEntities(entities)
    } catch (error) {
      const message = isAdminPacientesApiError(error)
        ? error.message
        : 'Não foi possível carregar os pacientes.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, getAccessToken, municipalityFilter])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const municipalityOptions = useMemo(() => {
    if (summary?.municipios?.length) return summary.municipios
    const unique = new Set(patients.map((patient) => patient.municipality))
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [patients, summary?.municipios])

  const cityScopedPatients = useMemo(
    () =>
      selectedMunicipality === 'all'
        ? patients
        : patients.filter((patient) => patient.municipality === selectedMunicipality),
    [patients, selectedMunicipality],
  )

  const removePatient = useCallback((id: string) => {
    setPatients((current) => current.filter((item) => item.id !== id))
  }, [])

  const upsertPatient = useCallback((patient: AdminMunicipalPatient) => {
    setPatients((current) => {
      const index = current.findIndex((item) => item.id === patient.id)
      if (index < 0) return [patient, ...current]
      const next = [...current]
      next[index] = patient
      return next
    })
  }, [])

  const loadDetail = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      if (!token) return null
      const detail = await fetchPacienteDetail(token, id)
      upsertPatient(detail)
      return detail
    },
    [getAccessToken, upsertPatient],
  )

  const savePatientEdits = useCallback(
    async (id: string, payload: UpdatePacientePayload) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }
      const detail = await updatePaciente(token, id, payload)
      upsertPatient(detail)
      const summaryData = await fetchPacientesSummary(token, { municipio: municipalityFilter })
      setSummary(summaryData)
      return detail
    },
    [getAccessToken, municipalityFilter, upsertPatient],
  )

  const completePreCadastro = useCallback(
    async (payload: PreCadastroRegistrationPayload) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }

      const row = await submitPacientePreCadastro(token, payload)
      upsertPatient(row)
      const summaryData = await fetchPacientesSummary(token, { municipio: municipalityFilter })
      setSummary(summaryData)
      return row
    },
    [getAccessToken, municipalityFilter, upsertPatient],
  )

  const savePreCadastroDraft = useCallback(
    async (payload: PreCadastroRegistrationPayload) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }
      return createPacientePreCadastroDraft(token, payload)
    },
    [getAccessToken],
  )

  const concludePreCadastroById = useCallback(
    async (preCadastroId: string) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }

      const row = await concludePacientePreCadastro(token, preCadastroId)
      upsertPatient(row)
      const summaryData = await fetchPacientesSummary(token, { municipio: municipalityFilter })
      setSummary(summaryData)
      return row
    },
    [getAccessToken, municipalityFilter, upsertPatient],
  )

  const cancelPreCadastro = useCallback(
    async (preCadastroId: string) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }
      await cancelPacientePreCadastro(token, preCadastroId)
    },
    [getAccessToken],
  )

  const createPatientDirect = useCallback(
    async (payload: CreatePacientePayload) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }

      const detail = await createPaciente(token, { ...payload, status: payload.status ?? 'ativo' })
      upsertPatient(detail)
      const summaryData = await fetchPacientesSummary(token, { municipio: municipalityFilter })
      setSummary(summaryData)
      return detail
    },
    [getAccessToken, municipalityFilter, upsertPatient],
  )

  const inactivatePatient = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }

      await inactivatePaciente(token, id)
      removePatient(id)
      const summaryData = await fetchPacientesSummary(token, { municipio: municipalityFilter })
      setSummary(summaryData)
    },
    [getAccessToken, municipalityFilter, removePatient],
  )

  const lookupPatientByCpf = useCallback(
    async (cpf: string, entidadeContratanteId: string) => {
      const token = getAccessToken()
      if (!token) return null
      return fetchPacienteByCpf(token, cpf, entidadeContratanteId)
    },
    [getAccessToken],
  )

  const exportPatientsCsv = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      throw new Error('Sessão expirada.')
    }

    setIsExporting(true)
    try {
      const blob = await downloadPacientesExport(token, {
        municipio: municipalityFilter,
        search: debouncedSearch || undefined,
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'pacientes.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }, [debouncedSearch, getAccessToken, municipalityFilter])

  return {
    patients,
    cityScopedPatients,
    summary,
    contractingEntities,
    municipalityOptions,
    selectedMunicipality,
    setSelectedMunicipality,
    searchQuery,
    setSearchQuery,
    isLoading: isLoading || isBootstrapping,
    loadError,
    reload,
    upsertPatient,
    loadDetail,
    savePatientEdits,
    lookupPatientByCpf,
    completePreCadastro,
    savePreCadastroDraft,
    concludePreCadastroById,
    cancelPreCadastro,
    createPatientDirect,
    inactivatePatient,
    exportPatientsCsv,
    isExporting,
  }
}
