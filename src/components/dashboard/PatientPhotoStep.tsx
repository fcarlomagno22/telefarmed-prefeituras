import { Camera, Check, UserRound } from 'lucide-react'
import { useState } from 'react'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'

type PatientPhotoStepProps = {
  photoDataUrl: string
  onOpenCapture: () => void
  onContinue: () => void
  onBack: () => void
}

export function PatientPhotoStep({
  photoDataUrl,
  onOpenCapture,
  onContinue,
  onBack,
}: PatientPhotoStepProps) {
  const [showHints, setShowHints] = useState(false)
  const continueReady = Boolean(photoDataUrl)

  return (
    <AttendanceStepShell
      title="Foto de cadastro"
      description="Registre uma foto do rosto do paciente para identificação no atendimento."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueReady={continueReady}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <AttendanceFieldHighlight
        highlight={showHints && !continueReady}
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto no-scrollbar py-2 p-2"
      >
        {photoDataUrl ? (
          <div className="relative shrink-0 pb-4">
            <div
              className="size-36 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-gray-100 sm:size-40"
              style={{ borderRadius: '50%' }}
            >
              <img
                src={photoDataUrl}
                alt="Pré-visualização da foto do paciente"
                className="size-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full border-2 border-white bg-emerald-500 px-3 py-1 text-[11px] font-semibold leading-none text-white shadow-[0_4px_12px_rgba(16,185,129,0.45)]">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              Foto capturada
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
          Posicione o rosto do paciente na câmera deste equipamento para concluir o cadastro.
        </p>

        <button
          type="button"
          onClick={onOpenCapture}
          className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
        >
          <Camera className="h-4 w-4" strokeWidth={2} />
          Tirar foto
        </button>

        {photoDataUrl ? (
          <button
            type="button"
            onClick={onOpenCapture}
            className="text-sm font-medium text-gray-500 underline-offset-2 transition hover:text-gray-700 hover:underline"
          >
            Capturar novamente
          </button>
        ) : null}
      </AttendanceFieldHighlight>
    </AttendanceStepShell>
  )
}
