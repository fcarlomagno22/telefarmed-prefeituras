import { useCallback, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { Toast } from '../../ui/Toast'
import {
  DOCTOR_RECORD_SPECIALTY_LABELS,
  getDoctorRecordNotesForSpecialty,
  resolveDoctorRecordSpecialtyKey,
} from '../../../data/doctorConsultationMock'
import { DoctorFullRecordModal } from './DoctorFullRecordModal'
import { doctorConsultationCardClass } from './doctorConsultationUi'
import type { DoctorRecordPatientProfile } from './doctorRecordPatient'
import type { DoctorRecordNote } from './doctorRecordTypes'

type DoctorPatientRecordPanelProps = {
  doctorSpecialty: string
  doctorName: string
  patient: DoctorRecordPatientProfile
  className?: string
}

function formatRecordNoteDate(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function sortRecordNotesNewestFirst(notes: DoctorRecordNote[]) {
  return [...notes].sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('/').map(Number)
    const [dayB, monthB, yearB] = b.date.split('/').map(Number)
    return (
      new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime()
    )
  })
}

export function DoctorPatientRecordPanel({
  doctorSpecialty,
  doctorName,
  patient,
  className,
}: DoctorPatientRecordPanelProps) {
  const [draftNote, setDraftNote] = useState('')
  const [fullRecordOpen, setFullRecordOpen] = useState(false)
  const [savedSessionNotes, setSavedSessionNotes] = useState<DoctorRecordNote[]>([])
  const [saveToastVisible, setSaveToastVisible] = useState(false)

  const dismissSaveToast = useCallback(() => setSaveToastVisible(false), [])

  const specialtyKey = useMemo(
    () => resolveDoctorRecordSpecialtyKey(doctorSpecialty),
    [doctorSpecialty],
  )
  const specialtyLabel = DOCTOR_RECORD_SPECIALTY_LABELS[specialtyKey]
  const recordNotes = useMemo(
    () =>
      sortRecordNotesNewestFirst([
        ...savedSessionNotes,
        ...getDoctorRecordNotesForSpecialty(doctorSpecialty),
      ]),
    [doctorSpecialty, savedSessionNotes],
  )

  const canSave = draftNote.trim().length > 0

  function handleSaveNote() {
    const text = draftNote.trim()
    if (!text) return

    setSavedSessionNotes((current) => [
      {
        id: `session-note-${Date.now()}`,
        specialty: specialtyKey,
        date: formatRecordNoteDate(),
        doctorName,
        note: text,
      },
      ...current,
    ])
    setDraftNote('')
    setSaveToastVisible(false)
    requestAnimationFrame(() => setSaveToastVisible(true))
  }

  return (
    <>
      <section
        className={[doctorConsultationCardClass, 'flex h-full min-h-0 flex-col', className]
          .filter(Boolean)
          .join(' ')}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Prontuário</h2>
            <p className="text-[10px] text-gray-500">{specialtyLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setFullRecordOpen(true)}
            className="shrink-0 text-xs font-semibold text-[var(--brand-primary)] underline-offset-2 transition hover:underline"
          >
            Ver prontuário completo
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          <label htmlFor="doctor-record-draft" className="sr-only">
            Anotação da consulta
          </label>
          <textarea
            id="doctor-record-draft"
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                handleSaveNote()
              }
            }}
            placeholder="Digite a anotação desta consulta…"
            className="min-h-[5.5rem] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-3 pb-12 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
          />

          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!canSave}
              className="btn-brand-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" strokeWidth={2} />
              Salvar
            </button>
          </div>
        </div>
      </section>

      <DoctorFullRecordModal
        open={fullRecordOpen}
        onClose={() => setFullRecordOpen(false)}
        doctorSpecialty={doctorSpecialty}
        patient={patient}
        notes={recordNotes}
      />

      <Toast
        message="Anotação salva"
        visible={saveToastVisible}
        variant="success"
        onClose={dismissSaveToast}
      />
    </>
  )
}
