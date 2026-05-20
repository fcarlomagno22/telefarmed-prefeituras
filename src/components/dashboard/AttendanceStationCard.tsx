import { Monitor } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { brand } from '../../config/brand'
import {
  emptyAttendanceSession,
  emptyPatientRegistration,
  inferAgeGroupFromBirthDate,
  registrationToPatient,
  type AttendanceSession,
  type PatientRegistration,
  type RegisteredPatient,
  type StationStatus,
  unitStation,
} from '../../data/unitDashboardMock'
import { AttendanceFlowStepper, isFlowStepStatus } from './AttendanceFlowStepper'
import { AgeGroupSelectionStep } from './AgeGroupSelectionStep'
import { readConsultationLockFromStorage } from '../../hooks/useConsultationSessionGuard'
import { ConsultationLockOverlay } from './ConsultationLockOverlay'
import { CpfLookupStep } from './CpfLookupStep'
import { PatientPanel } from './PatientPanel'
import { PatientAddressStep } from './PatientAddressStep'
import { PatientContactsStep } from './PatientContactsStep'
import { FaceCaptureModal } from './FaceCaptureModal'
import { PatientPhotoStep } from './PatientPhotoStep'
import { PatientRegistrationConfirmStep } from './PatientRegistrationConfirmStep'
import { PatientRegistrationForm } from './PatientRegistrationForm'
import { SpecialtySelectionStep } from './SpecialtySelectionStep'
import { WaitingRoomPanel } from './WaitingRoomPanel'

const statusLabels: Record<StationStatus, { label: string; className: string }> = {
  idle: {
    label: 'Posto disponível',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  specialty: {
    label: 'Especialidade',
    className: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
  age_group: {
    label: 'Faixa etária',
    className: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  },
  cpf_lookup: {
    label: 'Identificação',
    className: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  confirm_registration: {
    label: 'Confirmar cadastro',
    className: 'bg-orange-50 text-orange-800 ring-orange-200',
  },
  registration: {
    label: 'Cadastro do paciente',
    className: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  contacts: {
    label: 'Dados de contato',
    className: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  },
  address: {
    label: 'Endereço',
    className: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  photo: {
    label: 'Foto de cadastro',
    className: 'bg-pink-50 text-pink-700 ring-pink-200',
  },
  waiting_room: {
    label: 'Sala de espera',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  waiting_doctor: {
    label: 'Aguardando médico',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  in_consultation: {
    label: 'Em atendimento',
    className:
      'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-orange-200',
  },
}

const flowSteps: StationStatus[] = [
  'specialty',
  'cpf_lookup',
  'confirm_registration',
  'age_group',
  'registration',
  'contacts',
  'address',
  'photo',
  'waiting_room',
]

function cardBackgroundImage(status: StationStatus): string {
  if (status === 'specialty') {
    return brand.dashboardSpecialtyImageUrl
  }
  if (status === 'age_group') {
    return brand.dashboardAgeImageUrl
  }
  if (status === 'confirm_registration' || status === 'registration') {
    return brand.dashboardRegistrationImageUrl
  }
  if (status === 'contacts') {
    return brand.dashboardContactsImageUrl
  }
  if (status === 'address') {
    return brand.dashboardAddressImageUrl
  }
  if (status === 'photo') {
    return brand.dashboardPhotoImageUrl
  }
  if (status === 'waiting_room') {
    return brand.dashboardWaitingRoomImageUrl
  }
  if (flowSteps.includes(status) || status === 'waiting_doctor') {
    return brand.dashboardDoctorsImageUrl
  }
  return brand.dashboardFlowImageUrl
}

type BackgroundLayer = {
  src: string
  className: string
}

function cardBackgroundImageClass(status: StationStatus, isFlowStep: boolean): string {
  const shared =
    'pointer-events-none absolute z-0 h-auto w-auto origin-bottom-right scale-[0.85] object-contain object-right-bottom'

  if (status === 'age_group') {
    return `${shared} -right-20 bottom-0 max-h-[min(95%,1040px)] max-w-[min(95%,900px)] sm:-right-16 sm:-bottom-4 lg:-bottom-8 lg:max-h-[min(98%,1120px)]`
  }

  if (isFlowStep) {
    return `${shared} -right-20 bottom-10 max-h-[min(95%,1040px)] max-w-[min(95%,900px)] sm:-right-16 sm:bottom-14 lg:bottom-16 lg:max-h-[min(98%,1120px)]`
  }

  return `${shared} -right-12 bottom-14 max-h-[min(72%,520px)] max-w-[55%] sm:-right-10 sm:bottom-20 lg:bottom-24 lg:max-h-[min(78%,560px)]`
}

const fadeTransitionClass =
  'transition-opacity duration-500 ease-in-out motion-reduce:transition-none'

type CardBackgroundImageProps = {
  layer: BackgroundLayer
}

function CardBackgroundImage({ layer }: CardBackgroundImageProps) {
  const [top, setTop] = useState(layer)
  const [bottom, setBottom] = useState<BackgroundLayer | null>(null)
  const [topVisible, setTopVisible] = useState(true)
  const topRef = useRef(layer)

  useEffect(() => {
    topRef.current = top
  }, [top])

  useEffect(() => {
    const previous = topRef.current
    if (layer.src === previous.src && layer.className === previous.className) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setBottom(null)
      setTop(layer)
      setTopVisible(true)
      topRef.current = layer
      return
    }

    setBottom(previous)
    setTop(layer)
    setTopVisible(false)

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTopVisible(true))
    })

    return () => cancelAnimationFrame(frame)
  }, [layer])

  function clearBottomAfterFade() {
    if (topVisible && bottom) {
      setBottom(null)
      topRef.current = top
    }
  }

  if (!top.src.trim()) return null

  return (
    <>
      {bottom ? (
        <img
          src={bottom.src}
          alt=""
          className={`${bottom.className} ${fadeTransitionClass} ${
            topVisible ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : null}
      <img
        src={top.src}
        alt=""
        onTransitionEnd={clearBottomAfterFade}
        className={`${top.className} ${fadeTransitionClass} ${
          topVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  )
}

export function AttendanceStationCard() {
  const [status, setStatus] = useState<StationStatus>(() =>
    readConsultationLockFromStorage() ? 'waiting_doctor' : 'idle',
  )
  const [session, setSession] = useState<AttendanceSession>(emptyAttendanceSession())
  const [registration, setRegistration] = useState<PatientRegistration>(
    emptyPatientRegistration(),
  )
  const [patient, setPatient] = useState<RegisteredPatient | null>(null)
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false)

  const statusInfo = statusLabels[status]
  const isFlowStep = flowSteps.includes(status)
  const backgroundLayer = useMemo<BackgroundLayer>(
    () => ({
      src: cardBackgroundImage(status),
      className: cardBackgroundImageClass(status, isFlowStep),
    }),
    [status, isFlowStep],
  )

  function resetToIdle() {
    setPhotoCaptureOpen(false)
    setStatus('idle')
    setSession(emptyAttendanceSession())
    setRegistration(emptyPatientRegistration())
    setPatient(null)
  }

  function goToWaitingRoom(registrationData: PatientRegistration) {
    setRegistration(registrationData)
    setPatient(registrationToPatient(registrationData, session.specialtyName))
    setStatus('waiting_room')
  }

  function handleAccessWaitingRoom() {
    window.open('about:blank', '_blank', 'noopener,noreferrer')
    setStatus('waiting_doctor')
  }

  return (
    <section
      className={`relative flex h-full min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-8 ${
        'overflow-hidden'
      }`}
    >
      <header className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <span>
          <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            {unitStation.unitName}
          </span>
          <span className="mt-1 block text-lg font-bold text-gray-900 sm:text-xl">
            {brand.dashboardStationTitle}
          </span>
        </span>
        {!flowSteps.includes(status) ? (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${statusInfo.className}`}
          >
            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
            {statusInfo.label}
          </span>
        ) : null}
      </header>

      {isFlowStepStatus(status) ? <AttendanceFlowStepper status={status} /> : null}

      {status === 'idle' && (
        <article className="relative z-10 mt-6 flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-6 py-8 text-center sm:mt-8 sm:px-10 sm:py-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100">
            <Monitor
              className="h-7 w-7 text-[var(--brand-primary)]"
              strokeWidth={1.75}
            />
          </span>
          <h3 className="mt-5 text-lg font-bold text-gray-900 sm:text-xl">
            Nenhum paciente neste posto
          </h3>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-gray-500 sm:text-[17px]">
            {brand.dashboardStationIdleHint}
          </p>
          <button
            type="button"
            onClick={() => setStatus('specialty')}
            className="mt-8 rounded-xl bg-[var(--brand-primary)] px-10 py-4 text-base font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] sm:px-12"
          >
            Iniciar atendimento do paciente
          </button>
        </article>
      )}

      {status === 'specialty' && (
        <SpecialtySelectionStep
          selectedId={session.specialtyId}
          onSelect={(id, name) =>
            setSession((prev) => ({ ...prev, specialtyId: id, specialtyName: name }))
          }
          onBack={resetToIdle}
          onContinue={() => {
            setRegistration(emptyPatientRegistration())
            setSession((prev) => ({ ...prev, ageGroup: null }))
            setStatus('cpf_lookup')
          }}
        />
      )}

      {status === 'cpf_lookup' && (
        <CpfLookupStep
          cpf={registration.cpf}
          onChangeCpf={(cpf) => setRegistration((prev) => ({ ...prev, cpf }))}
          onFound={(found) => {
            setRegistration(found)
            setSession((prev) => ({
              ...prev,
              ageGroup: inferAgeGroupFromBirthDate(found.birthDate),
            }))
            setStatus('confirm_registration')
          }}
          onNotFound={(cpf) => {
            setRegistration({
              ...emptyPatientRegistration(),
              cpf,
            })
            setSession((prev) => ({ ...prev, ageGroup: null }))
            setStatus('age_group')
          }}
          onBack={() => setStatus('specialty')}
        />
      )}

      {status === 'confirm_registration' && (
        <PatientRegistrationConfirmStep
          data={registration}
          onChange={setRegistration}
          onSubmit={() => goToWaitingRoom(registration)}
          onBack={() => setStatus('cpf_lookup')}
          onOpenPhotoCapture={() => setPhotoCaptureOpen(true)}
        />
      )}

      {status === 'age_group' && (
        <AgeGroupSelectionStep
          selected={session.ageGroup}
          onSelect={(group) =>
            setSession((prev) => ({ ...prev, ageGroup: group }))
          }
          onBack={() => setStatus('cpf_lookup')}
          onContinue={() => {
            if (!session.ageGroup) return
            setStatus('registration')
          }}
        />
      )}

      {status === 'registration' && (
        <PatientRegistrationForm
          data={registration}
          ageGroup={session.ageGroup ?? 'adult'}
          cpfLocked
          onChange={setRegistration}
          onSubmit={() => setStatus('contacts')}
          onBack={() => setStatus('age_group')}
        />
      )}

      {status === 'contacts' && (
        <PatientContactsStep
          data={registration}
          onChange={setRegistration}
          onSubmit={() => setStatus('address')}
          onBack={() => setStatus('registration')}
        />
      )}

      {status === 'address' && (
        <PatientAddressStep
          data={registration}
          onChange={setRegistration}
          onSubmit={() => setStatus('photo')}
          onBack={() => setStatus('contacts')}
        />
      )}

      {status === 'photo' && (
        <PatientPhotoStep
          photoDataUrl={registration.photoDataUrl}
          onOpenCapture={() => setPhotoCaptureOpen(true)}
          onContinue={() => goToWaitingRoom(registration)}
          onBack={() => setStatus('address')}
        />
      )}

      <FaceCaptureModal
        open={photoCaptureOpen}
        onClose={() => setPhotoCaptureOpen(false)}
        onCapture={(photoDataUrl) => {
          setRegistration((prev) => ({ ...prev, photoDataUrl }))
          setPhotoCaptureOpen(false)
        }}
      />

      {status === 'waiting_room' && (
        <WaitingRoomPanel
          onAccessWaitingRoom={handleAccessWaitingRoom}
          onCancel={resetToIdle}
        />
      )}

      <ConsultationLockOverlay active={status === 'waiting_doctor'} onComplete={resetToIdle} />

      {status === 'in_consultation' && patient && (
        <PatientPanel
          patient={patient}
          hint="Consulta em andamento. Este equipamento está em uso por um único paciente."
          primaryAction={{
            label: 'Voltar à videochamada',
            onClick: () => undefined,
          }}
          secondaryAction={{
            label: 'Finalizar e liberar posto',
            onClick: resetToIdle,
            variant: 'finish',
          }}
        />
      )}

      <CardBackgroundImage layer={backgroundLayer} />
    </section>
  )
}
