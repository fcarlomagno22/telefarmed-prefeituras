import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { brand } from '../config/brand'
import { ubtRoutes } from '../config/ubtRoutes'
import { useBrandTheme } from '../hooks/useBrandTheme'
import {
  clearWaitingRoomSession,
  readWaitingRoomSession,
  type WaitingRoomSession,
} from '../data/waitingRoomSession'
import { VirtualWaitingRoomVideoPlayer } from '../components/waiting-room/VirtualWaitingRoomVideoPlayer'
import { WaitingRoomExitConfirmModal } from '../components/waiting-room/WaitingRoomExitConfirmModal'
import {
  ConsultationCountdown,
  WaitingRoomConsultationTransition,
} from '../components/waiting-room/WaitingRoomConsultationTransition'
import {
  buildAttendanceSessionFromWaitingRoom,
  writeAttendanceSession,
} from '../data/attendanceSession'
import { writeConsultationLockToStorage } from '../hooks/useConsultationSessionGuard'
import { generateAttendanceId } from '../utils/generateAttendanceId'
import {
  Calendar,
  Clock,
  FileText,
  Headphones,
  Heart,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react'

const posterUrl = `${import.meta.env.BASE_URL}sala-espera.png`

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const MESSAGES = [
  {
    icon: Heart,
    title: 'Seja bem-vindo!',
    body: 'Você está em boas mãos. Em breve, o profissional fará o seu atendimento.',
  },
  {
    icon: FileText,
    title: 'Documentos em mãos',
    body: 'Tenha seus documentos e informações importantes por perto para agilizar o atendimento.',
  },
  {
    icon: Stethoscope,
    title: 'Fique tranquilo(a)',
    body: 'Você será atendido(a) em breve. Obrigado pela sua paciência!',
  },
] as const

export function SalaDeEsperaPage() {
  useBrandTheme()
  const navigate = useNavigate()

  const [session, setSession] = useState<WaitingRoomSession | null>(() => readWaitingRoomSession())
  const [now, setNow] = useState(() => new Date())
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setSession(readWaitingRoomSession()), 2500)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const unitName = session?.unitName?.trim() || 'UBT Centro — Sala de Teleatendimento'
  const patientName = session?.patientName?.trim() || 'Paciente'
  const specialty = session?.specialty?.trim() || 'Atendimento'
  const professional = session?.professional?.trim() || 'A definir'
  const scheduledAt = session?.scheduledAt?.trim() || 'Hoje'

  function handleExit() {
    clearWaitingRoomSession()
    writeConsultationLockToStorage(false)
    try {
      window.close()
    } catch {
      // ignore
    }
    window.location.assign(ubtRoutes.triagem)
  }

  function handleEnterConsultation() {
    writeConsultationLockToStorage(true)
    const attendanceId = generateAttendanceId()
    const attendance = buildAttendanceSessionFromWaitingRoom(session, attendanceId)
    writeAttendanceSession(attendance)
    navigate(`/atendimento/${attendanceId}`)
  }

  const details = [
    { label: 'Paciente', value: patientName, icon: User },
    { label: 'Especialidade', value: specialty, icon: Stethoscope },
    { label: 'Unidade', value: unitName, icon: ShieldCheck },
    { label: 'Horário agendado', value: scheduledAt, icon: Clock },
    { label: 'Profissional', value: professional, icon: User },
  ] as const

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white">
      <header className="shrink-0 bg-white px-5 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src={brand.logoUrl}
              alt={brand.appName}
              className="h-10 w-auto max-w-[200px] shrink-0 object-contain"
            />
            <div className="min-w-0 pl-1">
              <h1 className="text-lg font-bold tracking-tight text-gray-900">
                Sala de espera virtual
              </h1>
              <p className="truncate text-sm text-gray-500">{unitName}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm">
              {formatDate(now)}
            </div>
            <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm tabular-nums">
              {formatTime(now)}
            </div>
            <button
              type="button"
              onClick={() => setExitConfirmOpen(true)}
              className="btn-danger-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Sair da sala de espera
            </button>
          </div>
        </div>
      </header>

      <WaitingRoomConsultationTransition onEnterConsultation={handleEnterConsultation}>
        {({ revealPhase, countdownAnchorRef, secondsLeft, contentFaded }) => (
          <div
            className={[
              'mx-auto grid min-h-0 w-full max-w-[1320px] flex-1 grid-cols-1 gap-3 p-3 transition-opacity duration-500 ease-out sm:p-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-1',
              contentFaded ? 'pointer-events-none opacity-0' : 'opacity-100',
            ].join(' ')}
          >
            <Surface className="min-h-[220px] overflow-hidden p-0 lg:min-h-0 lg:h-full">
              <VirtualWaitingRoomVideoPlayer posterUrl={posterUrl} fill />
            </Surface>

            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 lg:h-full">
              <Surface className="shrink-0 p-4">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Clock className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-gray-900">
                      Você está na sala de espera
                    </p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                      Aguardando chamada do profissional
                    </p>
                  </div>
                </div>

                <div ref={countdownAnchorRef}>
                  <ConsultationCountdown
                    secondsLeft={secondsLeft}
                    hidden={revealPhase !== 'idle'}
                  />
                </div>

                <p className="mt-3 flex items-start gap-2 rounded-lg bg-orange-50/80 px-3 py-2 text-xs leading-snug text-gray-700">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-orange-600"
                    strokeWidth={2}
                  />
                  <span>
                    <strong className="font-semibold text-gray-900">
                      Assim que for a sua vez, você será avisado(a).
                    </strong>{' '}
                    Mantenha esta página aberta e o som ligado.
                  </span>
                </p>
              </Surface>

              <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
                <h2 className="flex shrink-0 items-center gap-2 text-sm font-bold text-gray-900">
                  <MessageCircle className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                  Mensagens para você
                </h2>
                <ul className="mt-2 flex min-h-0 flex-1 flex-col divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {MESSAGES.map((msg) => {
                    const Icon = msg.icon
                    return (
                      <li
                        key={msg.title}
                        className="flex min-h-0 flex-1 items-center gap-3 px-3 py-2"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center self-center">
                          <Icon
                            className="h-4 w-4 text-[var(--brand-primary)]"
                            strokeWidth={2}
                          />
                        </span>
                        <span className="min-w-0 self-center text-sm leading-snug">
                          <span className="font-bold text-gray-900">{msg.title}</span>{' '}
                          <span className="text-gray-600">{msg.body}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </Surface>

              <Surface className="shrink-0 p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-600" strokeWidth={2} />
                  Detalhes da consulta
                </h2>
                <dl className="mt-2 overflow-hidden rounded-xl border border-gray-200">
                  {details.map((row, index) => {
                    const Icon = row.icon
                    return (
                      <div
                        key={row.label}
                        className={[
                          'flex items-center justify-between gap-3 bg-white px-3 py-2.5',
                          index > 0 ? 'border-t border-gray-100' : '',
                        ].join(' ')}
                      >
                        <dt className="flex min-w-0 items-center gap-2 text-sm text-gray-500">
                          <Icon className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                          {row.label}
                        </dt>
                        <dd className="min-w-0 truncate text-right text-sm font-bold text-gray-900">
                          {row.value}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </Surface>
            </div>
          </div>
        )}
      </WaitingRoomConsultationTransition>

      <footer className="shrink-0 bg-white px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50">
              <ShieldCheck className="h-5 w-5 text-gray-700" strokeWidth={2} />
            </span>
            <p className="text-sm leading-snug text-gray-600">
              <span className="font-bold text-gray-900">Importante:</span> Em caso de instabilidade
              de conexão, não atualize a página.
              <br />
              Você será reconectado automaticamente.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
            <span className="text-sm font-semibold text-gray-900">Precisa de ajuda?</span>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--brand-primary)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--brand-primary)] transition hover:bg-orange-50"
            >
              <Headphones className="h-4 w-4" strokeWidth={2} />
              Falar com o suporte
            </button>
          </div>
        </div>
      </footer>

      <WaitingRoomExitConfirmModal
        open={exitConfirmOpen}
        onCancel={() => setExitConfirmOpen(false)}
        onConfirm={handleExit}
      />
    </div>
  )
}

function Surface({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <article
      className={[
        'rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </article>
  )
}
