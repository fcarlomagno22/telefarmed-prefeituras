import { AlertCircle, Calendar, CheckCircle2, IdCard, Loader2, Upload, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MEDICO_CADASTRO_ACCEPTED_DOCUMENT_TYPES } from '../../../config/medicoCadastroForm'
import { profissionalRoutes } from '../../../config/profissionalRoutes'
import {
  consultarMinhaCandidatura,
  enviarCorrecoesMinhaCandidatura,
} from '../../../lib/services/profissional/minhaCandidatura'
import { isProfissionalCadastroApiError } from '../../../lib/services/profissional/cadastro'
import type {
  MinhaCandidatura,
  MinhaCandidaturaAccess,
  MinhaCandidaturaEditableProfile,
} from '../../../types/minhaCandidatura'
import { isValidBirthDate } from '../../../utils/birthDate'
import { isValidCpf } from '../../../utils/cpf'
import { maskBirthDate, maskCpf, maskPhone } from '../../../utils/masks'
import { MinhaCandidaturaDocumentPreview } from './MinhaCandidaturaDocumentPreview'
import { medicoCadastroInputClass } from './MedicoCadastroFormField'
import {
  buildProfileCorrectionPayload,
  countMissingCorrections,
  inferEditableFields,
  isCorrectionBatchReady,
} from './minhaCandidaturaUi'

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10'

const LEGACY_ACCESS_STORAGE_KEY = 'telefarmed.minha-candidatura.access'

export function MinhaCandidaturaDrawerContent() {
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [accessError, setAccessError] = useState<string | null>(null)
  const [isConsulting, setIsConsulting] = useState(false)
  const [candidatura, setCandidatura] = useState<MinhaCandidatura | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileDraft, setProfileDraft] = useState<MinhaCandidaturaEditableProfile | null>(null)
  const [documentDrafts, setDocumentDrafts] = useState<Record<string, File>>({})

  const currentAccess: MinhaCandidaturaAccess | null = candidatura ? { cpf, birthDate } : null

  useEffect(() => {
    sessionStorage.removeItem(LEGACY_ACCESS_STORAGE_KEY)
  }, [])

  const resetCorrectionDrafts = useCallback(() => {
    setProfileDraft(null)
    setDocumentDrafts({})
  }, [])

  const fetchCandidatura = useCallback(
    async (access: MinhaCandidaturaAccess) => {
      setAccessError(null)
      setIsConsulting(true)
      try {
        const result = await consultarMinhaCandidatura(access)
        setCandidatura(result)
        setProfileDraft(result.editableProfile ?? null)
        setDocumentDrafts({})
      } catch (error) {
        setCandidatura(null)
        resetCorrectionDrafts()
        if (isProfissionalCadastroApiError(error)) {
          setAccessError(error.message)
        } else {
          setAccessError('Não encontramos sua candidatura.')
        }
      } finally {
        setIsConsulting(false)
      }
    },
    [resetCorrectionDrafts],
  )

  async function handleConsultSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFeedback(null)

    if (!isValidCpf(cpf)) {
      setAccessError('Informe um CPF válido.')
      return
    }

    if (!isValidBirthDate(birthDate)) {
      setAccessError('Informe uma data de nascimento válida.')
      return
    }

    await fetchCandidatura({ cpf, birthDate })
  }

  async function handleSubmitCorrections() {
    if (!currentAccess || !candidatura?.hasPendingCorrections) return

    const ready = isCorrectionBatchReady({
      candidatura,
      profileDraft,
      documentDrafts,
    })
    if (!ready) return

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const updated = await enviarCorrecoesMinhaCandidatura({
        access: currentAccess,
        ...(candidatura.dataCorrectionNote && profileDraft
          ? {
              dados: buildProfileCorrectionPayload(
                candidatura.dataCorrectionNote,
                profileDraft,
                candidatura.editableProfile,
              ),
            }
          : {}),
        documentos: candidatura.documents.map((doc) => ({
          documentoId: doc.id,
          file: documentDrafts[doc.id],
        })),
      })
      setCandidatura(updated)
      setProfileDraft(updated.editableProfile ?? null)
      setDocumentDrafts({})
      setFeedback({
        kind: 'success',
        message: 'Correções enviadas. Nossa equipe vai revisar.',
      })
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: isProfissionalCadastroApiError(error)
          ? error.message
          : 'Não foi possível enviar as correções.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const editableFields =
    candidatura?.dataCorrectionNote && profileDraft
      ? inferEditableFields(candidatura.dataCorrectionNote, candidatura.editableProfile)
      : null

  const canSubmit = useMemo(() => {
    if (!candidatura?.hasPendingCorrections) return false
    return isCorrectionBatchReady({ candidatura, profileDraft, documentDrafts })
  }, [candidatura, profileDraft, documentDrafts])

  const missingCount = useMemo(() => {
    if (!candidatura?.hasPendingCorrections) return 0
    return countMissingCorrections({ candidatura, profileDraft, documentDrafts })
  }, [candidatura, profileDraft, documentDrafts])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {!candidatura ? (
          <section>
            <p className="text-sm text-gray-600">
              Informe CPF e data de nascimento para ver o que precisa ser corrigido.
            </p>

            <form onSubmit={handleConsultSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">CPF</label>
                <div className="relative">
                  <IdCard
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    className={medicoCadastroInputClass(Boolean(accessError), { withIcon: true })}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => {
                      setCpf(maskCpf(e.target.value))
                      setAccessError(null)
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Data de nascimento
                </label>
                <div className="relative">
                  <Calendar
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    className={medicoCadastroInputClass(Boolean(accessError), { withIcon: true })}
                    placeholder="dd/mm/aaaa"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(maskBirthDate(e.target.value))
                      setAccessError(null)
                    }}
                  />
                </div>
              </div>

              {accessError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {accessError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isConsulting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isConsulting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Buscando…
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </form>
          </section>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-900">{candidatura.fullName}</p>

            {feedback ? (
              <p
                className={[
                  'rounded-lg border px-3 py-2 text-sm',
                  feedback.kind === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-700',
                ].join(' ')}
              >
                {feedback.message}
              </p>
            ) : null}

            {candidatura.status === 'aprovada' ? (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  Candidatura aprovada.{' '}
                  <Link
                    to={profissionalRoutes.finalizarCadastro}
                    className="font-semibold underline underline-offset-2"
                  >
                    Finalize seu cadastro
                  </Link>
                  .
                </p>
              </div>
            ) : null}

            {candidatura.status === 'reprovada' ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>Sua candidatura não foi aprovada.</p>
              </div>
            ) : null}

            {!candidatura.hasPendingCorrections &&
            candidatura.status !== 'aprovada' &&
            candidatura.status !== 'reprovada' ? (
              <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>Nada pendente no momento. Status: {candidatura.statusLabel}.</p>
              </div>
            ) : null}

            {candidatura.hasPendingCorrections ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
                Corrija todos os itens abaixo e envie tudo de uma vez no final.
              </p>
            ) : null}

            {candidatura.dataCorrectionNote && profileDraft && editableFields ? (
              <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-start gap-2 text-sm text-amber-950">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <p className="leading-relaxed">{candidatura.dataCorrectionNote}</p>
                </div>

                <div className="mt-4 space-y-3">
                  {editableFields.has('council') ? (
                    <div className="grid grid-cols-[1fr_4.5rem] gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                          {profileDraft.councilLabel}
                        </label>
                        <input
                          type="text"
                          className={inputClass}
                          value={profileDraft.councilNumber}
                          onChange={(e) =>
                            setProfileDraft((current) =>
                              current ? { ...current, councilNumber: e.target.value } : current,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">UF</label>
                        <input
                          type="text"
                          maxLength={2}
                          className={inputClass}
                          value={profileDraft.councilUf}
                          onChange={(e) =>
                            setProfileDraft((current) =>
                              current
                                ? { ...current, councilUf: e.target.value.toUpperCase() }
                                : current,
                            )
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  {editableFields.has('email') ? (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">E-mail</label>
                      <input
                        type="email"
                        className={inputClass}
                        value={profileDraft.email}
                        onChange={(e) =>
                          setProfileDraft((current) =>
                            current ? { ...current, email: e.target.value } : current,
                          )
                        }
                      />
                    </div>
                  ) : null}

                  {editableFields.has('phone') ? (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Telefone
                      </label>
                      <input
                        type="text"
                        inputMode="tel"
                        className={inputClass}
                        value={profileDraft.phone}
                        onChange={(e) =>
                          setProfileDraft((current) =>
                            current ? { ...current, phone: maskPhone(e.target.value) } : current,
                          )
                        }
                      />
                    </div>
                  ) : null}

                  {editableFields.has('rqe') ? (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">RQE</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={profileDraft.rqe ?? ''}
                        onChange={(e) =>
                          setProfileDraft((current) =>
                            current ? { ...current, rqe: e.target.value } : current,
                          )
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {candidatura.documents.length > 0 ? (
              <ul className="space-y-3">
                {candidatura.documents.map((doc) => {
                  const selectedFile = documentDrafts[doc.id]
                  return (
                    <li key={doc.id} className="rounded-xl border border-amber-200 bg-white p-3">
                      <p className="text-sm font-semibold text-gray-900">{doc.label}</p>
                      {doc.instruction ? (
                        <p className="mt-1 text-xs leading-relaxed text-amber-900">
                          {doc.instruction}
                        </p>
                      ) : null}

                      <div className="mt-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {selectedFile ? 'Novo arquivo' : 'Arquivo enviado'}
                        </p>
                        <p className="mb-1.5 truncate text-xs text-gray-700">
                          {selectedFile ? selectedFile.name : doc.fileName}
                        </p>
                        <MinhaCandidaturaDocumentPreview
                          document={doc}
                          replacementFile={selectedFile}
                        />
                      </div>

                      <label className="mt-3 flex cursor-pointer">
                        <input
                          type="file"
                          className="sr-only"
                          accept={MEDICO_CADASTRO_ACCEPTED_DOCUMENT_TYPES}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setDocumentDrafts((current) => ({ ...current, [doc.id]: file }))
                            e.target.value = ''
                          }}
                        />
                        <span
                          className={[
                            'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs font-semibold transition',
                            selectedFile
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-amber-300 bg-amber-50/50 text-amber-950 hover:border-[var(--brand-primary)]/40',
                          ].join(' ')}
                        >
                          {selectedFile ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" aria-hidden />
                              Trocar arquivo
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" aria-hidden />
                              Selecionar arquivo corrigido
                            </>
                          )}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setCandidatura(null)
                resetCorrectionDrafts()
                setFeedback(null)
              }}
              className="text-xs font-semibold text-gray-500 transition hover:text-gray-800"
            >
              Usar outro CPF
            </button>
          </div>
        )}
      </div>

      {candidatura?.hasPendingCorrections ? (
        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={() => void handleSubmitCorrections()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Enviando correções…
              </>
            ) : canSubmit ? (
              'Enviar todas as correções'
            ) : (
              `Faltam ${missingCount} ${missingCount === 1 ? 'item' : 'itens'}`
            )}
          </button>
        </div>
      ) : null}
    </div>
  )
}
