import { useCallback, useEffect, useState } from 'react'
import type {
  ProfissionalPerfil,
  ProfissionalPerfilCertificadoDigital,
} from '../types/profissionalPerfil'
import { getProfissionalConselhoConfig } from '../config/profissionalConselhoConfig'
import {
  simulateProfissionalCertificadoVinculo,
  type ProfissionalCertificadoVinculoPhase,
} from '../utils/profissional/simulateProfissionalCertificadoVinculo'

type UseProfissionalPerfilCertificadoOptions = {
  profile: ProfissionalPerfil
}

function buildCertificadoConselhoAtivo(
  profile: ProfissionalPerfil,
): ProfissionalPerfilCertificadoDigital {
  const conselho = getProfissionalConselhoConfig(profile.conselhoClasse)
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 2)

  return {
    modo: 'conselho_nuvem',
    status: 'ativo',
    updatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    emissorDescricao: `${conselho.certificadoNuvemTitulo} · ICP-Brasil · VALID`,
    arquivoNome: null,
    titularNome: profile.fullName,
  }
}

export function useProfissionalPerfilCertificado({ profile }: UseProfissionalPerfilCertificadoOptions) {
  const [certificado, setCertificado] = useState(profile.certificadoDigital)
  const [vincularOpen, setVincularOpen] = useState(false)

  useEffect(() => {
    setCertificado(profile.certificadoDigital)
  }, [profile.certificadoDigital])

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

      await simulateProfissionalCertificadoVinculo(onPhase)
      setCertificado(buildCertificadoConselhoAtivo(profile))
    },
    [profile],
  )

  return {
    certificado,
    vincularOpen,
    openVincularModal,
    closeVincularModal,
    vincularCertificadoConselho,
  }
}
