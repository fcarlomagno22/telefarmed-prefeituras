import { profissionalFinalizarCadastroSteps, type ProfissionalFinalizarCadastroStepId } from '../../../config/profissionalFinalizarCadastro'

type ProfissionalFinalizarCadastroStepperProps = {
  currentStep: ProfissionalFinalizarCadastroStepId
}

export function ProfissionalFinalizarCadastroStepper({
  currentStep,
}: ProfissionalFinalizarCadastroStepperProps) {
  const activeIndex = profissionalFinalizarCadastroSteps.findIndex(
    (step) => step.id === currentStep,
  )
  const progress = ((activeIndex + 1) / profissionalFinalizarCadastroSteps.length) * 100

  return (
    <nav
      aria-label="Etapas da finalização de cadastro"
      className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6"
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-gray-500">
          Etapa{' '}
          <span className="font-bold tabular-nums text-gray-800">{activeIndex + 1}</span>
          <span className="text-gray-400"> / </span>
          <span className="tabular-nums text-gray-800">
            {profissionalFinalizarCadastroSteps.length}
          </span>
        </span>
        <span className="font-semibold text-[var(--brand-primary)]">
          {profissionalFinalizarCadastroSteps[activeIndex]?.label}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[#ff9333] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={activeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={profissionalFinalizarCadastroSteps.length}
        />
      </div>
    </nav>
  )
}
