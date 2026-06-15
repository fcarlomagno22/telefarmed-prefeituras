import { ChevronDown, History, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchProfissionalPacienteHistoricoEspecialidade } from '../../../lib/services/profissional/posConsultaHistorico'
import type { ProfissionalConsultaHistoricoItem } from '../../../types/posConsultaHistorico'
import { ProfissionalConsultaHistoricoDetail } from './ProfissionalConsultaHistoricoDetail'

type ProfissionalPacienteHistoricoPanelProps = {
  accessToken: string | null
  pacienteId?: string
  patientName: string
  specialty: string
  className?: string
}

export function ProfissionalPacienteHistoricoPanel({
  accessToken,
  pacienteId,
  patientName,
  specialty,
  className = '',
}: ProfissionalPacienteHistoricoPanelProps) {
  const [loading, setLoading] = useState(true)
  const [consultas, setConsultas] = useState<ProfissionalConsultaHistoricoItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      setError('Sessão expirada.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setExpandedId(null)

    void fetchProfissionalPacienteHistoricoEspecialidade(accessToken, {
      pacienteId,
      patientName,
      specialty,
    })
      .then((response) => {
        if (cancelled) return
        setConsultas(response.consultas)
      })
      .catch(() => {
        if (cancelled) return
        setError('Não foi possível carregar o histórico.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, pacienteId, patientName, specialty])

  if (loading) {
    return (
      <div className={`flex items-center justify-center gap-2 py-12 text-sm text-gray-500 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Carregando histórico…
      </div>
    )
  }

  if (error) {
    return (
      <p className={`rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}>
        {error}
      </p>
    )
  }

  if (consultas.length === 0) {
    return (
      <div
        className={`rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center ${className}`}
      >
        <History className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-gray-700">Sem consultas anteriores</p>
        <p className="mt-1 text-xs text-gray-500">
          Não há atendimentos anteriores deste paciente na especialidade {specialty}.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {consultas.map((consulta) => {
        const expanded = expandedId === consulta.consultaId
        return (
          <div
            key={consulta.consultaId}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedId((current) =>
                  current === consulta.consultaId ? null : consulta.consultaId,
                )
              }
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-gray-50/80"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{consulta.dateTimeLabel}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {consulta.doctorName} · {consulta.posConsultaCheckins.length} check-in(s)
                </p>
              </div>
              <ChevronDown
                className={[
                  'h-4 w-4 shrink-0 text-gray-400 transition-transform',
                  expanded ? 'rotate-180' : '',
                ].join(' ')}
                aria-hidden
              />
            </button>
            {expanded ? (
              <div className="border-t border-gray-100 bg-[#f5f6f8] p-4">
                <ProfissionalConsultaHistoricoDetail consulta={consulta} />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
