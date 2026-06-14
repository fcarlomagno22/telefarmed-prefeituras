import { ChangeEvent, useState } from 'react'
import { Camera, Check, Upload, UserRound } from 'lucide-react'
import { AttendanceFieldHighlight } from '../../../dashboard/AttendanceFieldHighlight'
import { AttendanceStepFooter } from '../../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../../dashboard/AttendanceStepShell'
import { isPhotoStepReady, type AdminProfessionalCreateDraft } from './adminProfessionalCreateTypes'

type AdminProfessionalPhotoStepProps = {
  draft: AdminProfessionalCreateDraft
  onChange: (draft: AdminProfessionalCreateDraft) => void
  onContinue: () => void
  onBack: () => void
  isSubmitting?: boolean
  submitError?: string | null
}

export function AdminProfessionalPhotoStep({
  draft,
  onChange,
  onContinue,
  onBack,
  isSubmitting = false,
  submitError = null,
}: AdminProfessionalPhotoStepProps) {
  const [showHints, setShowHints] = useState(false)
  const continueReady = isPhotoStepReady(draft)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return
      onChange({ ...draft, photoDataUrl: result })
    }
    reader.readAsDataURL(file)
  }

  function handleContinue() {
    if (!continueReady) {
      setShowHints(true)
      return
    }
    onContinue()
  }

  return (
    <AttendanceStepShell
      title="Foto de cadastro"
      description="Faça o upload da foto do profissional para identificação no painel e nos atendimentos."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={handleContinue}
          continueReady={continueReady && !isSubmitting}
          continueLabel={isSubmitting ? 'Cadastrando…' : 'Concluir cadastro'}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      {submitError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
      <AttendanceFieldHighlight
        highlight={showHints && !continueReady}
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto no-scrollbar py-2 p-2"
      >
        {draft.photoDataUrl ? (
          <div className="relative shrink-0 pb-4">
            <div
              className="size-36 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-gray-100 sm:size-40"
              style={{ borderRadius: '50%' }}
            >
              <img
                src={draft.photoDataUrl}
                alt="Pré-visualização da foto do profissional"
                className="size-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full border-2 border-white bg-emerald-500 px-3 py-1 text-[11px] font-semibold leading-none text-white shadow-[0_4px_12px_rgba(16,185,129,0.45)]">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              Foto enviada
            </span>
          </div>
        ) : (
          <div
            className="flex size-36 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-gray-100 sm:size-40"
            style={{ borderRadius: '50%' }}
            aria-hidden
          >
            <UserRound
              className="h-16 w-16 text-gray-300 sm:h-[4.5rem] sm:w-[4.5rem]"
              strokeWidth={1.5}
            />
          </div>
        )}

        <p className="max-w-sm text-center text-sm text-gray-500">
          Selecione um arquivo de imagem (JPG ou PNG) do profissional para usar como foto de
          cadastro.
        </p>

        <label className="inline-flex w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]">
          <span className="inline-flex items-center gap-2">
            <Upload className="h-4 w-4" strokeWidth={2} />
            Enviar foto
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {draft.photoDataUrl ? (
          <button
            type="button"
            onClick={() => onChange({ ...draft, photoDataUrl: '' })}
            className="text-sm font-medium text-gray-500 underline-offset-2 transition hover:text-gray-700 hover:underline"
          >
            Remover foto
          </button>
        ) : null}

        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
          <Camera className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden />
          Neste fluxo o profissional envia uma foto já existente — não usa a câmera ao vivo.
        </p>
      </AttendanceFieldHighlight>
    </AttendanceStepShell>
  )
}
