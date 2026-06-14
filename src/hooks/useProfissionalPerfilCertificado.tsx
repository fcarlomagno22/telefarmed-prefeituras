import { useCallback, useEffect, useState } from 'react'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import { getProfissionalConselhoConfig } from '../config/profissionalConselhoConfig'
import {
  isProfissionalPerfilApiError,
  uploadProfissionalCertificadoA1,
  vincularProfissionalCertificadoConselho,
} from '../lib/services/profissional/perfil'
import type {
  ProfissionalPerfil,
  ProfissionalPerfilCertificadoDigital,
} from '../types/profissionalPerfil'
import type { ProfissionalCertificadoVinculoPhase } from '../utils/profissional/simulateProfissionalCertificadoVinculo'

type UseProfissionalPerfilCertificadoOptions = {
  profile: ProfissionalPerfil
  onCertificadoChange?: (certificado: ProfissionalPerfilCertificadoDigital) => void
}

export function useProfissionalPerfilCertificado({
  profile,
  onCertificadoChange,
}: UseProfissionalPerfilCertificadoOptions) {
  const { getAccessToken } = useProfissionalAuth()
  const [certificado, setCertificado] = useState(profile.certificadoDigital)
  const [vincularOpen, setVincularOpen] = useState(false)
  const [isSubmittingA1, setIsSubmittingA1] = useState(false)
  const [a1Error, setA1Error] = useState<string | null>(null)

  useEffect(() => {
    setCertificado(profile.certificadoDigital)
  }, [profile.certificadoDigital])

  const applyCertificado = useCallback(
    (next: ProfissionalPerfilCertificadoDigital) => {
      setCertificado(next)
      onCertificadoChange?.(next)
    },
    [onCertificadoChange],
  )

  const openVincularModal = useCallback(() => {
    setVincularOpen(true)
  }, [])

  const closeVincularModal = useCallback(() => {
    setVincularOpen(false)
  }, [])

  const vincularCertificadoConselho = useCallback(
    async (onPhase?: (phase: ProfissionalCertificadoVinculoPhase, progress: number) => void) => {
      const conselho = getProfissionalConselhoConfig(profile.conselhoClasse)
      if (!conselho.certificadoNuvemDisponivel) {
        throw new Error('Certificado em nuvem indisponível para este conselho.')
      }

      onPhase?.('validating', 20)
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      onPhase?.('linking', 60)
      const result = await vincularProfissionalCertificadoConselho(token)
      onPhase?.('done', 100)
      applyCertificado(result.certificadoDigital)
    },
    [applyCertificado, getAccessToken, profile.conselhoClasse],
  )

  const enviarCertificadoA1 = useCallback(
    async (file: File, password: string) => {
      setA1Error(null)
      setIsSubmittingA1(true)
      try {
        const token = getAccessToken()
        if (!token) throw new Error('Sessão expirada.')
        const result = await uploadProfissionalCertificadoA1(token, file, password)
        applyCertificado(result.certificadoDigital)
      } catch (error) {
        const message = isProfissionalPerfilApiError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível enviar o certificado.'
        setA1Error(message)
        throw error
      } finally {
        setIsSubmittingA1(false)
      }
    },
    [applyCertificado, getAccessToken],
  )

  return {
    certificado,
    vincularOpen,
    isSubmittingA1,
    a1Error,
    openVincularModal,
    closeVincularModal,
    vincularCertificadoConselho,
    enviarCertificadoA1,
  }
}
