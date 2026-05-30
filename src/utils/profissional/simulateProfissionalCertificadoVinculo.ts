export type ProfissionalCertificadoVinculoPhase = 'redirect' | 'validate' | 'bind'

export async function simulateProfissionalCertificadoVinculo(
  onPhase?: (phase: ProfissionalCertificadoVinculoPhase, progress: number) => void,
): Promise<void> {
  const phases: { phase: ProfissionalCertificadoVinculoPhase; progress: number; delay: number }[] =
    [
      { phase: 'redirect', progress: 22, delay: 520 },
      { phase: 'redirect', progress: 48, delay: 480 },
      { phase: 'validate', progress: 68, delay: 560 },
      { phase: 'validate', progress: 86, delay: 500 },
      { phase: 'bind', progress: 100, delay: 420 },
    ]

  for (const step of phases) {
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        onPhase?.(step.phase, step.progress)
        resolve()
      }, step.delay)
    })
  }
}
