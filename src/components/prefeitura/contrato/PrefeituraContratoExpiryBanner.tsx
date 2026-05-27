import { AlertTriangle, CalendarClock, ShieldCheck } from 'lucide-react'
import type { PrefeituraContratoExpiryView } from '../../../utils/prefeituraContrato'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from '../prefeituraChartAnimation'
import { prefeituraContratoExpiryBannerClass } from './prefeituraContratoUi'

type PrefeituraContratoExpiryBannerProps = {
  expiry: PrefeituraContratoExpiryView
}

function CountdownDigits({ daysRemaining }: { daysRemaining: number }) {
  const digits = String(Math.max(0, daysRemaining)).padStart(3, '0').split('')

  return (
    <div
      className="flex items-center gap-1"
      role="timer"
      aria-live="polite"
      aria-label={`${daysRemaining} dias restantes de vigência`}
    >
      {digits.map((digit, index) => (
        <span
          key={`${index}-${digit}`}
          className="flex h-11 w-9 items-center justify-center rounded-lg border border-white/60 bg-white/90 text-xl font-black tabular-nums text-gray-900 shadow-sm backdrop-blur-sm"
        >
          {digit}
        </span>
      ))}
      <span className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-600">dias</span>
    </div>
  )
}

export function PrefeituraContratoExpiryBanner({ expiry }: PrefeituraContratoExpiryBannerProps) {
  const animateBar = usePrefeituraChartAnimation(
    140,
    `${expiry.progressPercent}-${expiry.alertLevel}`,
  )

  if (expiry.alertLevel === 'none') return null

  const barWidth = animateBar ? expiry.progressPercent : 0
  const surface = prefeituraContratoExpiryBannerClass[expiry.alertLevel]
  const Icon =
    expiry.alertLevel === 'danger'
      ? AlertTriangle
      : expiry.showCountdown
        ? CalendarClock
        : ShieldCheck

  return (
    <section
      className={[
        'relative overflow-hidden rounded-2xl border p-5 sm:p-6',
        surface,
      ].join(' ')}
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--brand-primary)]/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              expiry.alertLevel === 'danger'
                ? 'bg-red-100 text-red-600'
                : expiry.alertLevel === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-sky-100 text-sky-700',
            ].join(' ')}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Vigência do contrato
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-gray-900 sm:text-xl">{expiry.headline}</h2>
            <p className="mt-1 text-sm text-gray-600">{expiry.detail}</p>
            <p className="mt-2 text-xs text-gray-500">
              Início da vigência:{' '}
              <span className="font-semibold text-gray-800">{expiry.startsAtLabel}</span>
              <span className="text-gray-400"> · </span>
              Encerramento previsto:{' '}
              <span className="font-semibold text-gray-800">{expiry.endsAtLabel}</span>
              {expiry.showCountdown ? (
                <span className="text-gray-400"> · contagem a partir de 60 dias</span>
              ) : null}
            </p>
          </div>
        </div>

        {expiry.showCountdown ? (
          <div className="shrink-0 rounded-xl border border-white/70 bg-white/50 px-4 py-3 backdrop-blur-sm">
            <p className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Contagem regressiva
            </p>
            <div className="mt-2 flex justify-center">
              <CountdownDigits daysRemaining={expiry.daysRemaining} />
            </div>
          </div>
        ) : (
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Dias restantes
            </p>
            <p className="mt-0.5 text-3xl font-black tabular-nums text-gray-900">
              {expiry.daysRemaining}
            </p>
          </div>
        )}
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/70">
        <div
          className={[
            'h-full rounded-full',
            expiry.alertLevel === 'danger'
              ? 'bg-red-500'
              : expiry.alertLevel === 'warning'
                ? 'bg-amber-500'
                : 'bg-sky-500',
          ].join(' ')}
          style={{
            width: `${barWidth}%`,
            transition: `width 0.85s ${PREF_CHART_EASE}`,
          }}
        />
      </div>
    </section>
  )
}
