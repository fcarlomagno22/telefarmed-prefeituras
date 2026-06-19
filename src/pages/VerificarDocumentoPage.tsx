import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, FileWarning, ShieldCheck } from 'lucide-react'
import { fetchDocumentoVerificacao, type DocumentoVerificacao } from '../lib/services/public/atendimento'

export function VerificarDocumentoPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DocumentoVerificacao | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!codigo) {
      setLoading(false)
      setError('Código de verificação inválido.')
      return
    }

    let cancelled = false

    async function load() {
      try {
        const result = await fetchDocumentoVerificacao(codigo)
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch {
        if (!cancelled) {
          setData(null)
          setError('Documento não encontrado ou código inválido.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [codigo])

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 via-white to-white px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-[var(--brand-primary)]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verificação de documento médico</h1>
          <p className="mt-2 text-sm text-gray-600">
            Confira se o documento foi emitido pela plataforma Telefarmed.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-center text-sm text-gray-500">Verificando documento…</p>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <FileWarning className="h-10 w-10 text-red-500" />
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Documento autêntico</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Este documento foi registrado na plataforma Telefarmed.
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Documento" value={data.titulo} />
                <InfoItem label="Tipo" value={formatTipo(data.tipo)} />
                <InfoItem label="Emitido em" value={data.emitidoEmLabel} />
                <InfoItem label="Código" value={data.codigoVerificacao} />
                <InfoItem label="Paciente" value={data.patientName} />
                <InfoItem label="Profissional" value={data.doctorName} />
                <InfoItem label="Registro" value={data.doctorCrm} />
                {data.doctorRqe ? <InfoItem label="RQE" value={data.doctorRqe} /> : null}
                <InfoItem label="Especialidade" value={data.doctorSpecialty} />
                <InfoItem label="Entidade" value={data.entidadeNome} />
                <InfoItem label="Unidade" value={data.unitName} />
              </dl>

              {data.downloadUrl ? (
                <a
                  href={data.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brand-gradient inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
                >
                  Baixar PDF original
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}

function formatTipo(tipo: string) {
  switch (tipo) {
    case 'receita':
      return 'Receita médica'
    case 'pedido_exame':
      return 'Pedido de exames'
    case 'atestado':
      return 'Atestado médico'
    case 'encaminhamento':
      return 'Encaminhamento médico'
    case 'relatorio':
      return 'Relatório médico'
    case 'laudo':
      return 'Laudo médico'
    case 'avaliacao_presencial':
      return 'Avaliação presencial'
    case 'internacao':
      return 'Internação'
    default:
      return tipo
  }
}
