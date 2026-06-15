const STEPS = [
  { id: 'sintomas', label: 'Como está' },
  { id: 'medicacao', label: 'Medicamentos' },
  { id: 'medicoes', label: 'Medições' },
  { id: 'alertas', label: 'Sinais de alerta' },
] as const

type EvolucaoCheckinStepperProps = {
  stepIndex: number
}

export function EvolucaoCheckinStepper({ stepIndex }: EvolucaoCheckinStepperProps) {
  return (
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
                'text-center text-[10px] font-semibold leading-tight sm:text-[11px]',
                isActive ? 'text-[var(--brand-primary)]' : 'text-gray-400',
              ].join(' ')}
            >
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
