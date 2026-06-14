import type { SubmitProfissionalCadastroProgress } from '../../../lib/services/profissional/cadastro'

type MedicoCadastroSubmitProgressProps = {
  progress: SubmitProfissionalCadastroProgress
}

export function MedicoCadastroSubmitProgress({
  progress,
}: MedicoCadastroSubmitProgressProps) {
  const percent = Math.max(0, Math.min(100, Math.round(progress.percent)))

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 px-4 py-10 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="space-y-2">
        <p className="text-base font-semibold text-gray-900">Enviando sua candidatura</p>
        <p className="max-w-sm text-sm leading-relaxed text-gray-600">{progress.message}</p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Progresso do envio"
          />
        </div>
        <p className="text-xs font-medium tabular-nums text-gray-500">{percent}%</p>
      </div>

      <p className="max-w-xs text-[11px] leading-relaxed text-gray-400">
        Seus documentos são enviados de forma criptografada. Isso pode levar alguns instantes —
        não feche esta página.
      </p>
    </div>
  )
}
