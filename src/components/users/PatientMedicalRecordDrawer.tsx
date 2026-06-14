import {
  AlertCircle,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Printer,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { brand } from '../../config/brand'
import type { PatientProntuarioData, PatientProntuarioEntry } from '../../types/patientProntuario'
import {
  downloadPatientProntuarioPdf,
  printPatientProntuario,
} from '../../utils/patientProntuarioExport'
import { splitPatientFullName } from '../attendance/doctor/doctorRecordPatient'
import { Toast, type ToastVariant } from '../ui/Toast'

type PatientMedicalRecordDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  patientId: string | null
  patientName: string
  patientPhotoUrl?: string
  birthDate: string
  age: number
  city: string
  recordId: string
  loadProntuario?: (patientId: string) => Promise<PatientProntuarioData>
}

function messageFromLabel(from: 'doctor' | 'patient' | 'system') {
  if (from === 'doctor') return 'Profissional'
  if (from === 'patient') return 'Paciente'
  return 'Sistema'
}

function statusBadgeClass(status: PatientProntuarioEntry['status']) {
  return status === 'concluido'
    ? 'bg-emerald-50 text-emerald-800'
    : 'bg-amber-50 text-amber-800'
}

function statusLabel(status: PatientProntuarioEntry['status']) {
  return status === 'concluido' ? 'Concluído' : 'Interrompido'
}

function ProntuarioEntryDetails({ entry }: { entry: PatientProntuarioEntry }) {
  return (
    <div className="space-y-4 border-t border-gray-100 px-4 py-4 sm:px-5">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Protocolo
          </dt>
          <dd className="mt-0.5 font-mono text-gray-800">{entry.attendanceId}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            UBT / Duração
          </dt>
          <dd className="mt-0.5 text-gray-800">
            {entry.ubtName} · {entry.durationMinutes} min
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            CRM
          </dt>
          <dd className="mt-0.5 text-gray-800">{entry.professionalCrm}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Status
          </dt>
          <dd className="mt-0.5">
            <span
              className={[
                'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                statusBadgeClass(entry.status),
              ].join(' ')}
            >
              {statusLabel(entry.status)}
            </span>
          </dd>
        </div>
      </dl>

      {entry.triageSummary ? (
        <section>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Triagem
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{entry.triageSummary}</p>
        </section>
      ) : null}

      {entry.clinicalNotes ? (
        <section>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Anotações clínicas
          </h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {entry.clinicalNotes}
          </p>
        </section>
      ) : null}

      {entry.prescriptions.length > 0 ? (
        <section>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Prescrições
          </h4>
          <ul className="mt-2 space-y-2">
            {entry.prescriptions.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3 text-sm text-gray-700"
              >
                <p className="font-semibold text-gray-900">{item.medicationName}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {[item.dosage, item.route, item.frequency, item.duration]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {item.notes ? <p className="mt-1 text-xs text-gray-500">{item.notes}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.examRequests.length > 0 ? (
        <section>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Pedidos de exame
          </h4>
          <ul className="mt-2 space-y-2">
            {entry.examRequests.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3 text-sm text-gray-700"
              >
                <p className="font-semibold text-gray-900">{item.examName}</p>
                {item.notes ? <p className="mt-1 text-xs text-gray-500">{item.notes}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.issuedDocuments.length > 0 ? (
        <section>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Documentos emitidos
          </h4>
          <ul className="mt-2 space-y-2">
            {entry.issuedDocuments.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3 text-sm text-gray-700"
              >
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.meta}</p>
                {item.signedAtLabel ? (
                  <p className="text-[11px] text-gray-400">{item.signedAtLabel}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.patientUploads.length > 0 ? (
        <section>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Arquivos enviados pelo paciente
          </h4>
          <ul className="mt-2 space-y-2">
            {entry.patientUploads.map((item) => (
              <li
                key={item.id}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2 text-sm text-gray-700"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                {item.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.messages.length > 0 ? (
        <section>
          <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            <MessageSquare className="h-3.5 w-3.5" />
            Registro da consulta
          </h4>
          <ul className="mt-2 space-y-2">
            {entry.messages.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-3 text-sm"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold text-gray-900">
                    {messageFromLabel(item.from)}
                  </span>
                  <span className="text-[11px] tabular-nums text-gray-400">{item.time}</span>
                </div>
                {item.text ? (
                  <p className="mt-1 leading-relaxed text-gray-700">{item.text}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!entry.triageSummary &&
      !entry.clinicalNotes &&
      entry.prescriptions.length === 0 &&
      entry.examRequests.length === 0 &&
      entry.issuedDocuments.length === 0 &&
      entry.patientUploads.length === 0 &&
      entry.messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
          Nenhum registro clínico detalhado neste atendimento.
        </p>
      ) : null}
    </div>
  )
}

function ProntuarioConsultationAccordion({ entry }: { entry: PatientProntuarioEntry }) {
  const [expanded, setExpanded] = useState(false)
  const panelId = `prontuario-entry-${entry.id}`

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-gray-50/80 sm:px-5"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{entry.dateTimeLabel}</p>
          <p className="mt-1 text-sm text-gray-700">{entry.specialty}</p>
          <p className="mt-0.5 text-xs text-gray-500">{entry.professionalName}</p>
        </div>
        <ChevronDown
          className={[
            'h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200',
            expanded ? 'rotate-180' : '',
          ].join(' ')}
          strokeWidth={2}
        />
      </button>

      {expanded ? (
        <div id={panelId}>
          <ProntuarioEntryDetails entry={entry} />
        </div>
      ) : null}
    </article>
  )
}

export function PatientMedicalRecordDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
  patientId,
  patientName,
  patientPhotoUrl,
  birthDate,
  age,
  city,
  recordId,
  loadProntuario,
}: PatientMedicalRecordDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [prontuario, setProntuario] = useState<PatientProntuarioData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const requestIdRef = useRef(0)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const { firstName, lastName } = splitPatientFullName(patientName)
  const photoUrl =
    prontuario?.patient.photoUrl?.trim() ||
    patientPhotoUrl?.trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=f97316&color=fff`

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ message, variant })
  }, [])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setProntuario(null)
      setLoading(false)
      setError(null)
      setDownloading(false)
      setPrinting(false)
      return
    }

    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open || !patientId || !loadProntuario) {
      if (open && !loadProntuario) {
        setError('Carregamento do prontuário não disponível neste contexto.')
      }
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)
    setError(null)
    setProntuario(null)

    void loadProntuario(patientId)
      .then((data) => {
        if (requestIdRef.current !== requestId) return
        setProntuario(data)
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return
        setError('Não foi possível carregar o prontuário médico.')
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return
        setLoading(false)
      })
  }, [loadProntuario, open, patientId])

  async function handleDownload() {
    if (!prontuario || downloading) return
    setDownloading(true)
    try {
      await downloadPatientProntuarioPdf(prontuario)
      showToast('Prontuário baixado em PDF.')
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível baixar o prontuário.',
        'error',
      )
    } finally {
      setDownloading(false)
    }
  }

  async function handlePrint() {
    if (!prontuario || printing) return
    setPrinting(true)
    try {
      await printPatientProntuario(prontuario)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível imprimir o prontuário.',
        'error',
      )
    } finally {
      setPrinting(false)
    }
  }

  if (!isActive) return null

  const displayPatient = prontuario?.patient
  const entries = prontuario?.entries ?? []

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[10001] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          tabIndex={panelVisible ? 0 : -1}
          className={`absolute inset-0 bg-gray-900/45 backdrop-blur-sm transition-opacity duration-300 ${
            panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-label="Fechar prontuário médico"
          onClick={onClose}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-medical-record-drawer-title"
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.propertyName === 'transform') onTransitionEnd()
          }}
          className={`absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-16px_0_48px_rgba(15,23,42,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
            panelVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <img
                  src={photoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Prontuário médico
                  </p>
                  <h2
                    id="patient-medical-record-drawer-title"
                    className="mt-0.5 text-lg font-bold leading-tight text-gray-900 sm:text-xl"
                  >
                    <span>{firstName}</span>
                    {lastName ? (
                      <span className="font-semibold text-gray-800"> {lastName}</span>
                    ) : null}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-gray-500">
                    {displayPatient?.municipalRecordId ?? recordId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600 sm:grid-cols-4">
              <div className="flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" />
                <dd>
                  {displayPatient?.birthDate ?? birthDate} · {displayPatient?.age ?? age} anos
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <dd>{displayPatient?.city ?? city}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <dd>{displayPatient?.genderLabel ?? '—'}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <dd>{entries.length} consulta(s)</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={!prontuario || loading || downloading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloading ? 'Gerando PDF…' : 'Baixar PDF'}
              </button>
              <button
                type="button"
                onClick={() => void handlePrint()}
                disabled={!prontuario || loading || printing}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-primary)]/25 bg-[var(--brand-primary-light)]/40 px-3.5 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-light)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {printing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                Imprimir
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#f5f6f8] px-5 py-4 sm:px-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
                Carregando prontuário completo…
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                <p>{error}</p>
              </div>
            ) : null}

            {!loading && prontuario ? (
              <div className="space-y-4">
                <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="text-sm font-bold text-gray-900">Dados do paciente</h3>
                  <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        CPF
                      </dt>
                      <dd className="mt-0.5 text-gray-800">{prontuario.patient.cpf}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        Entidade contratante
                      </dt>
                      <dd className="mt-0.5 text-gray-800">
                        {prontuario.patient.contractingEntityRazaoSocial}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        Município / Bairro
                      </dt>
                      <dd className="mt-0.5 text-gray-800">
                        {prontuario.patient.municipality} · {prontuario.patient.neighborhood}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        Unidade de cadastro
                      </dt>
                      <dd className="mt-0.5 text-gray-800">{prontuario.patient.registrationUnit}</dd>
                    </div>
                  </dl>
                </section>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">Consultas</h3>
                  {entries.length > 0 ? (
                    entries.map((entry) => (
                      <ProntuarioConsultationAccordion key={entry.id} entry={entry} />
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">
                      Nenhum atendimento finalizado com registro clínico.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <footer className="shrink-0 border-t border-gray-200 bg-[#f5f6f8] px-5 py-4 sm:px-6">
            <div className="flex justify-center">
              <img
                src={brand.logoUrl}
                alt={brand.appName}
                className="h-8 w-auto max-w-[180px] object-contain opacity-90"
              />
            </div>
          </footer>
        </aside>
      </div>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant ?? 'success'}
        onClose={() => setToast(null)}
      />
    </>,
    document.body,
  )
}
