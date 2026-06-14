import { Loader2, Monitor } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WaitingQueueEntry } from '../../types/waitingQueue'
import { useUbtAuth } from '../../contexts/UbtAuthContext'
import { updateUbtFilaStatus, isUbtTriagemApiError } from '../../lib/services/ubt/triagem'
import {
  entrarUbtSalaEspera,
  iniciarUbtConsulta,
  isUbtConsultasApiError,
  sairUbtSalaEspera,
} from '../../lib/services/ubt/consultas'
import { generateAttendanceId } from '../../utils/generateAttendanceId'
import { buildAttendanceStartFromQueueEntry } from '../../utils/triage/buildAttendanceStartFromQueueEntry'
import { brand } from '../../config/brand'
import { ubtRoutes } from '../../config/ubtRoutes'
import {
  emptyAttendanceSession,
  emptyPatientRegistration,
  getPatientPreferredName,
  inferAgeGroupFromBirthDate,
  registrationToPatient,
  type AttendanceSession,
  type PatientRegistration,
  type RegisteredPatient,
  type StationStatus,
} from '../../types/attendance'
import { useUbtUnitStation } from '../../hooks/useUbtUnitStation'
import { AttendanceFlowStepper, isFlowStepStatus } from './AttendanceFlowStepper'
import { AgeGroupSelectionStep } from './AgeGroupSelectionStep'
import { useUbtPatientRegistration } from '../../hooks/useUbtPatientRegistration'
import { useUbtWalkInSpecialtyAvailability } from '../../hooks/useUbtWalkInSpecialtyAvailability'
import { readConsultationLockFromStorage, writeConsultationLockToStorage } from '../../hooks/useConsultationSessionGuard'
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
import {
  clearWaitingRoomSession,
  formatWaitingRoomScheduledAt,
  readWaitingRoomSession,
  writeWaitingRoomSession,
} from '../../data/waitingRoomSession'

const statusLabels: Record<StationStatus, { label: string; className: string }> = {
  idle: {
    label: 'Terminal disponível',
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

type AttendanceStationCardProps = {
  unitName?: string
  queueCallTarget?: WaitingQueueEntry | null
  onQueueCallHandled?: () => void
  onAttendanceActiveChange?: (active: boolean) => void
}

export function AttendanceStationCard({
  unitName,
  queueCallTarget = null,
  onQueueCallHandled,
  onAttendanceActiveChange,
}: AttendanceStationCardProps) {
  const { unitName: resolvedUnitName } = useUbtUnitStation({ unitName })
  const navigate = useNavigate()
  const { getAccessToken } = useUbtAuth()
  const { lookupByCpf, registerCompletedPatient: persistPatient } = useUbtPatientRegistration()
  const [status, setStatus] = useState<StationStatus>(() =>
    readConsultationLockFromStorage() ? 'waiting_doctor' : 'idle',
  )
  const triagemCatalogEnabled = status === 'specialty' || status === 'idle'
  const triagemDate = useMemo(() => new Date(), [])
  const {
    specialties: contratoSpecialties,
    isLoading: isCatalogLoading,
    loadError: catalogLoadError,
    reload: reloadCatalog,
  } = useUbtWalkInSpecialtyAvailability(triagemCatalogEnabled, triagemDate)
  const [session, setSession] = useState<AttendanceSession>(emptyAttendanceSession())
  const [registration, setRegistration] = useState<PatientRegistration>(
    emptyPatientRegistration(),
  )
  const [patient, setPatient] = useState<RegisteredPatient | null>(null)
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false)
  const [pendingFirstVisit, setPendingFirstVisit] = useState(false)
  const [isLoadingFromQueue, setIsLoadingFromQueue] = useState(false)
  const [calledFromQueueName, setCalledFromQueueName] = useState<string | null>(null)
  const [activeFilaEntryId, setActiveFilaEntryId] = useState<string | null>(null)
  const [registeredPatientId, setRegisteredPatientId] = useState<string | null>(null)
  const [enteringWaitingRoom, setEnteringWaitingRoom] = useState(false)
  const [isSavingForWaitingRoom, setIsSavingForWaitingRoom] = useState(false)
  const [flowError, setFlowError] = useState<string | null>(null)
  const [pendingAutoWaitingRoom, setPendingAutoWaitingRoom] = useState(false)

  const patchFilaStatus = useCallback(
    (filaId: string, nextStatus: 'em_atendimento' | 'finalizado' | 'desistiu') => {
      const token = getAccessToken()
      if (!token) return
      void updateUbtFilaStatus(token, filaId, nextStatus).catch((error) => {
        const message = isUbtTriagemApiError(error)
          ? error.message
          : 'Não foi possível atualizar a fila de espera.'
        setFlowError(message)
      })
    },
    [getAccessToken],
  )

  const queueCallTargetRef = useRef(queueCallTarget)
  queueCallTargetRef.current = queueCallTarget

  const onQueueCallHandledRef = useRef(onQueueCallHandled)
  onQueueCallHandledRef.current = onQueueCallHandled

  const loadByPacienteId = useCallback(
    async (pacienteId: string) => {
      const token = getAccessToken()
      if (!token) return null
      try {
        const { fetchUbtPacienteDetailApi, mapUbtDetailToPatientRegistration } =
          await import('../../lib/services/ubt/pacientes')
        const detail = await fetchUbtPacienteDetailApi(token, pacienteId)
        return mapUbtDetailToPatientRegistration(detail)
      } catch {
        return null
      }
    },
    [getAccessToken],
  )

  const queueCallTargetId = queueCallTarget?.id ?? null

  useEffect(() => {
    const target = queueCallTargetRef.current
    if (!target || !queueCallTargetId) return

    let cancelled = false
    setIsLoadingFromQueue(true)
    setCalledFromQueueName(target.patientName)
    setActiveFilaEntryId(target.id)
    setRegisteredPatientId(target.pacienteId ?? null)
    setFlowError(null)

    void buildAttendanceStartFromQueueEntry(target, {
      lookupByCpf,
      loadByPacienteId,
    })
      .then((start) => {
        if (cancelled) return
        setPhotoCaptureOpen(false)
        setRegistration(start.registration)
        setSession(start.session)
        setPendingFirstVisit(start.pendingFirstVisit)
        if (start.patientId) setRegisteredPatientId(start.patientId)
        setPatient(null)

        const canAutoStart =
          Boolean(start.patientId) &&
          !start.pendingFirstVisit &&
          start.initialStatus === 'confirm_registration'

        if (canAutoStart) {
          setPatient(registrationToPatient(start.registration, start.session.specialtyName))
          setStatus('waiting_room')
          patchFilaStatus(target.id, 'em_atendimento')
          setPendingAutoWaitingRoom(true)
        } else {
          setStatus(start.initialStatus)
        }
      })
      .catch((error) => {
        if (cancelled) return
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os dados do paciente.'
        setFlowError(message)
        setStatus('idle')
      })
      .finally(() => {
        if (cancelled) return
        setIsLoadingFromQueue(false)
        onQueueCallHandledRef.current?.()
      })

    return () => {
      cancelled = true
    }
  }, [loadByPacienteId, lookupByCpf, patchFilaStatus, queueCallTargetId])

  useEffect(() => {
    if (!pendingAutoWaitingRoom || status !== 'waiting_room') return
    setPendingAutoWaitingRoom(false)
    void handleAccessWaitingRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara uma vez após auto-carregar da fila
  }, [pendingAutoWaitingRoom, status])

  const isAttendanceActive = status !== 'idle' || isLoadingFromQueue

  useEffect(() => {
    onAttendanceActiveChange?.(isAttendanceActive)
  }, [isAttendanceActive, onAttendanceActiveChange])

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
    const accessToken = getAccessToken()
    const codigo = readWaitingRoomSession()?.token
    if (accessToken && codigo) {
      void sairUbtSalaEspera(accessToken, codigo)
    }

    if (activeFilaEntryId) {
      const nextStatus =
        status === 'waiting_doctor' || status === 'in_consultation' ? 'finalizado' : 'desistiu'
      patchFilaStatus(activeFilaEntryId, nextStatus)
      setActiveFilaEntryId(null)
    }
    clearWaitingRoomSession()
    writeConsultationLockToStorage(false)
    setPhotoCaptureOpen(false)
    setPendingFirstVisit(false)
    setCalledFromQueueName(null)
    setFlowError(null)
    setIsSavingForWaitingRoom(false)
    setStatus('idle')
    setSession(emptyAttendanceSession())
    setRegistration(emptyPatientRegistration())
    setPatient(null)
    setRegisteredPatientId(null)
  }

  async function goToWaitingRoom(registrationData: PatientRegistration) {
    if (isSavingForWaitingRoom) return

    setIsSavingForWaitingRoom(true)
    setFlowError(null)
    try {
      const saved = await persistPatient(registrationData, registeredPatientId ?? undefined)
      setRegisteredPatientId(saved.id)
      if (pendingFirstVisit) {
        setPendingFirstVisit(false)
      }
      setRegistration(registrationData)
      setPatient(registrationToPatient(registrationData, session.specialtyName))
      setStatus('waiting_room')
      if (activeFilaEntryId) {
        patchFilaStatus(activeFilaEntryId, 'em_atendimento')
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar os dados do paciente.'
      setFlowError(message)
      setIsSavingForWaitingRoom(false)
    }
  }

  async function handleAccessWaitingRoom() {
    const accessToken = getAccessToken()
    if (!accessToken || !registeredPatientId) {
      setFlowError('Sessão ou paciente inválido. Tente chamar o paciente novamente.')
      return
    }
    if (!session.specialtyId) {
      setFlowError('Especialidade não definida para esta consulta.')
      return
    }

    setEnteringWaitingRoom(true)
    setFlowError(null)
    const codigoAtendimento = generateAttendanceId()

    try {
      const sessao = await iniciarUbtConsulta(accessToken, {
        codigoAtendimento,
        pacienteId: registeredPatientId,
        especialidadeId: session.specialtyId,
        filaEsperaId: activeFilaEntryId ?? undefined,
      })

      const fila = await entrarUbtSalaEspera(accessToken, codigoAtendimento)

      writeWaitingRoomSession({
        token: codigoAtendimento,
        patientName: getPatientPreferredName(registration),
        specialty: session.specialtyName,
        unitName: resolvedUnitName,
        scheduledAt: formatWaitingRoomScheduledAt(),
        professional: (sessao as { doctorName?: string }).doctorName ?? 'A definir',
        estimatedMinutes: fila.estimatedMinutes,
        queuePosition: fila.position,
        queueTotal: fila.total,
      })
      writeConsultationLockToStorage(true)
      setStatus('waiting_doctor')
      navigate(ubtRoutes.salaDeEspera)
    } catch (error) {
      const message = isUbtConsultasApiError(error)
        ? error.message
        : isUbtTriagemApiError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível abrir a sala de espera. Tente novamente.'
      setFlowError(message)
    } finally {
      setEnteringWaitingRoom(false)
    }
  }

  return (
    <section
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)] sm:p-8"
    >
      <header className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <span>
          <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            {resolvedUnitName}
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

      {calledFromQueueName && isFlowStep && !isLoadingFromQueue ? (
        <p className="relative z-10 mt-3 rounded-xl border border-orange-200/90 bg-orange-50/90 px-4 py-2.5 text-sm text-orange-900/90">
          <strong className="font-semibold">{calledFromQueueName}</strong> chamado(a) da
          fila — especialidade{' '}
          <strong className="font-semibold">{session.specialtyName}</strong>. Dados
          carregados automaticamente.
        </p>
      ) : null}

      {flowError ? (
        <p
          role="alert"
          className="relative z-10 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {flowError}
        </p>
      ) : null}

      {isLoadingFromQueue ? (
        <div className="relative z-10 mt-6 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 px-6 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
          <p className="text-sm font-medium text-gray-700">Carregando dados do paciente…</p>
        </div>
      ) : null}

      {!isLoadingFromQueue && status === 'idle' && (
        <article className="relative z-10 mt-6 flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-6 py-8 text-center sm:mt-8 sm:px-10 sm:py-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100">
            <Monitor
              className="h-7 w-7 text-[var(--brand-primary)]"
              strokeWidth={1.75}
            />
          </span>
          <h3 className="mt-5 text-lg font-bold text-gray-900 sm:text-xl">
            Nenhum paciente neste Terminal
          </h3>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-gray-500 sm:text-[17px]">
            {brand.dashboardStationIdleHint}
          </p>
          <button
            type="button"
            onClick={() => {
              setFlowError(null)
              setStatus('specialty')
            }}
            className="mt-8 rounded-xl bg-[var(--brand-primary)] px-10 py-4 text-base font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] sm:px-12"
          >
            Iniciar atendimento do paciente
          </button>
        </article>
      )}

      {!isLoadingFromQueue && status === 'specialty' && (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <SpecialtySelectionStep
          selectedId={session.specialtyId}
          selectedDate={triagemDate}
          showAvailability
          availabilityFilter="with-slots-only"
          specialties={contratoSpecialties}
          isLoading={isCatalogLoading}
          loadError={catalogLoadError}
          onRetryLoad={() => void reloadCatalog()}
          description="Escolha uma especialidade do contrato com plantão publicado e vaga livre hoje."
          emptyMessage="Nenhuma especialidade com vaga de plantão hoje. Oriente o paciente a agendar ou retorne quando houver escala publicada."
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
        </div>
      )}

      {!isLoadingFromQueue && status === 'cpf_lookup' && (
        <CpfLookupStep
          cpf={registration.cpf}
          lookupByCpf={lookupByCpf}
          lookupContext={{
            specialtyId: session.specialtyId,
            specialtyName: session.specialtyName,
          }}
          onChangeCpf={(cpf) => setRegistration((prev) => ({ ...prev, cpf }))}
          onFound={(found, meta) => {
            setPendingFirstVisit(false)
            if (meta?.patientId) setRegisteredPatientId(meta.patientId)
            setRegistration(found)
            setSession((prev) => ({
              ...prev,
              ageGroup: inferAgeGroupFromBirthDate(found.birthDate),
            }))
            setStatus('confirm_registration')
          }}
          onFoundPendingFirstVisit={({ patient, specialtyId, specialtyName, patientId }) => {
            setPendingFirstVisit(true)
            if (patientId) setRegisteredPatientId(patientId)
            setRegistration({ ...patient, photoDataUrl: '' })
            setSession((prev) => ({
              ...prev,
              ageGroup: inferAgeGroupFromBirthDate(patient.birthDate),
              specialtyId,
              specialtyName,
            }))
            setStatus('registration')
          }}
          onNotFound={(cpf) => {
            setPendingFirstVisit(false)
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

      {!isLoadingFromQueue && status === 'confirm_registration' && (
        <PatientRegistrationConfirmStep
          data={registration}
          onChange={setRegistration}
          onSubmit={() => void goToWaitingRoom(registration)}
          onBack={() => setStatus('cpf_lookup')}
          onOpenPhotoCapture={() => setPhotoCaptureOpen(true)}
          continueLoading={isSavingForWaitingRoom}
          continueLabel={isSavingForWaitingRoom ? 'Salvando…' : 'Continuar'}
        />
      )}

      {!isLoadingFromQueue && status === 'age_group' && (
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

      {!isLoadingFromQueue && status === 'registration' && (
        <PatientRegistrationForm
          data={registration}
          ageGroup={session.ageGroup ?? 'adult'}
          cpfLocked
          description={
            pendingFirstVisit
              ? `Consulta agendada em ${session.specialtyName}. Revise e complete os dados do paciente antes de seguir.`
              : undefined
          }
          onChange={setRegistration}
          onSubmit={() => setStatus('contacts')}
          onBack={() =>
            pendingFirstVisit ? setStatus('cpf_lookup') : setStatus('age_group')
          }
        />
      )}

      {!isLoadingFromQueue && status === 'contacts' && (
        <PatientContactsStep
          data={registration}
          onChange={setRegistration}
          onSubmit={() => setStatus('address')}
          onBack={() => setStatus('registration')}
        />
      )}

      {!isLoadingFromQueue && status === 'address' && (
        <PatientAddressStep
          data={registration}
          onChange={setRegistration}
          onSubmit={() => setStatus('photo')}
          onBack={() => setStatus('contacts')}
        />
      )}

      {!isLoadingFromQueue && status === 'photo' && (
        <PatientPhotoStep
          photoDataUrl={registration.photoDataUrl}
          description={
            pendingFirstVisit
              ? 'Primeira visita após agendamento: a foto é obrigatória para liberar o atendimento na sala de espera.'
              : undefined
          }
          onOpenCapture={() => setPhotoCaptureOpen(true)}
          onContinue={() => void goToWaitingRoom(registration)}
          onBack={() => setStatus('address')}
          isSubmitting={isSavingForWaitingRoom}
          submittingLabel="Salvando…"
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

      {!isLoadingFromQueue && status === 'waiting_room' && (
        <WaitingRoomPanel
          loading={enteringWaitingRoom}
          error={flowError}
          onAccessWaitingRoom={() => void handleAccessWaitingRoom()}
          onCancel={resetToIdle}
        />
      )}

      <ConsultationLockOverlay active={status === 'waiting_doctor'} onComplete={resetToIdle} />

      {!isLoadingFromQueue && status === 'in_consultation' && patient && (
        <PatientPanel
          patient={patient}
          hint="Consulta em andamento. Este equipamento está em uso por um único paciente."
          primaryAction={{
            label: 'Voltar à videochamada',
            onClick: () => navigate(ubtRoutes.salaDeEspera),
          }}
          secondaryAction={{
            label: 'Finalizar e liberar Terminal',
            onClick: resetToIdle,
            variant: 'finish',
          }}
        />
      )}

      <CardBackgroundImage layer={backgroundLayer} />
    </section>
  )
}
