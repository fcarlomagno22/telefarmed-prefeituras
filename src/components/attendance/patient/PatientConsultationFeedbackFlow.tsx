import { useState } from 'react'
import { Video } from 'lucide-react'
import { FeedbackStarRating } from './FeedbackStarRating'
import type {
  PatientConsultationFeedback,
  PatientConsultationFeedbackProfessional,
} from './patientConsultationFeedbackTypes'

type FeedbackStep = 'doctor' | 'experience'

type PatientConsultationFeedbackFlowProps = {
  professional: PatientConsultationFeedbackProfessional
  onSubmit: (feedback: PatientConsultationFeedback) => void
}

const STEPS: { id: FeedbackStep; label: string }[] = [
  { id: 'doctor', label: 'Profissional' },
  { id: 'experience', label: 'Teleconsulta' },
]

export function PatientConsultationFeedbackFlow({
  professional,
  onSubmit,
}: PatientConsultationFeedbackFlowProps) {
  const [step, setStep] = useState<FeedbackStep>('doctor')
  const [doctorRating, setDoctorRating] = useState(0)
  const [doctorComment, setDoctorComment] = useState('')
  const [experienceRating, setExperienceRating] = useState(0)
  const [experienceComment, setExperienceComment] = useState('')

  const stepIndex = step === 'doctor' ? 0 : 1

  function handleContinueFromDoctor() {
    if (doctorRating < 1) return
    setStep('experience')
  }

  function handleSubmitExperience() {
    if (experienceRating < 1) return
    onSubmit({
      doctorRating,
      doctorComment: doctorComment.trim(),
      experienceRating,
      experienceComment: experienceComment.trim(),
    })
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center text-center">
      <div className="mb-8 flex w-full items-center justify-center gap-2">
        {STEPS.map((item, index) => {
          const isActive = index === stepIndex
          const isDone = index < stepIndex
          return (
            <div key={item.id} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={[
                      'h-0.5 flex-1 rounded-full',
                      isDone || isActive ? 'bg-[var(--brand-primary)]' : 'bg-gray-200',
                    ].join(' ')}
                  />
                ) : (
                  <span className="flex-1" />
                )}
                <span
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isActive || isDone
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'border border-gray-200 bg-white text-gray-400',
                  ].join(' ')}
                >
                  {index + 1}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    className={[
                      'h-0.5 flex-1 rounded-full',
                      isDone ? 'bg-[var(--brand-primary)]' : 'bg-gray-200',
                    ].join(' ')}
                  />
                ) : (
                  <span className="flex-1" />
                )}
              </div>
              <span
                className={[
                  'text-[11px] font-semibold',
                  isActive ? 'text-[var(--brand-primary)]' : 'text-gray-400',
                ].join(' ')}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {step === 'doctor' ? (
        <div className="flex w-full flex-col items-center">
          <div className="mb-6 flex flex-col items-center">
            <img
              src={professional.photoUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover ring-4 ring-orange-50 sm:h-24 sm:w-24"
            />
            <p className="mt-4 text-lg font-bold text-gray-900 sm:text-xl">{professional.name}</p>
            <p className="mt-1 text-sm font-medium text-gray-500 sm:text-base">
              {professional.specialty}
            </p>
          </div>

          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Como foi o atendimento com o profissional?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            Selecione uma nota para o médico. O comentário é opcional.
          </p>

          <div className="mt-8 w-full">
            <FeedbackStarRating
              value={doctorRating}
              onChange={setDoctorRating}
              ariaLabel="Nota do profissional"
            />
          </div>

          <label className="mt-8 w-full text-left">
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Comentário sobre o profissional{' '}
              <span className="font-normal text-gray-400">(opcional)</span>
            </span>
            <textarea
              value={doctorComment}
              onChange={(event) => setDoctorComment(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Conte como foi o atendimento com o médico..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>

          <button
            type="button"
            disabled={doctorRating < 1}
            onClick={handleContinueFromDoctor}
            className="btn-brand-gradient mt-8 w-full rounded-xl px-8 py-3.5 text-sm font-semibold"
          >
            Continuar
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center">
          <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-[var(--brand-primary)] sm:h-24 sm:w-24">
            <Video className="h-10 w-10 sm:h-11 sm:w-11" strokeWidth={2} />
          </span>

          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Você gostou de ser atendido(a) por teleconsulta?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            Conte como foi a sua experiência de consulta à distância — se sentiu bem atendido(a) por
            esse formato, se foi prático e confortável para você. Esta avaliação é sobre a
            teleconsulta em si, não sobre o profissional.
          </p>

          <div className="mt-8 w-full">
            <FeedbackStarRating
              value={experienceRating}
              onChange={setExperienceRating}
              ariaLabel="Nota da experiência com teleconsulta"
            />
          </div>

          <label className="mt-8 w-full text-left">
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Como foi a experiência?{' '}
              <span className="font-normal text-gray-400">(opcional)</span>
            </span>
            <textarea
              value={experienceComment}
              onChange={(event) => setExperienceComment(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ex.: gostei de ser atendido(a) de casa, me senti à vontade, preferi ir presencialmente..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>

          <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep('doctor')}
              className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 sm:flex-1"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={experienceRating < 1}
              onClick={handleSubmitExperience}
              className="btn-brand-gradient w-full rounded-xl px-6 py-3.5 text-sm font-semibold sm:flex-1"
            >
              Enviar avaliação
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
