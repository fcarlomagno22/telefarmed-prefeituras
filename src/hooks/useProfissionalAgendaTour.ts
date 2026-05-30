import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  profissionalAgendaTourSteps,
  type ProfissionalAgendaTourStep,
} from '../config/profissionalAgendaTour'
import type { ProfissionalAgendaTab } from './useProfissionalAgendaState'
import {
  isProfissionalAgendaTourCompleted,
  markProfissionalAgendaTourCompleted,
} from '../utils/profissional/profissionalAgendaTourStorage'

type TourAdvanceSource = 'next' | 'target-click'

type UseProfissionalAgendaTourOptions = {
  agendaTab: ProfissionalAgendaTab
  setAgendaTab: (tab: ProfissionalAgendaTab) => void
  forceStart?: boolean
  /** Executado antes de avançar (ex.: abrir fila no passo "entrar no plantão"). */
  onBeforeAdvance?: (step: ProfissionalAgendaTourStep, source: TourAdvanceSource) => void
}

function findTourTarget(selector: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${selector}"]`)
}

function resolveStepIndex(startIndex: number, direction: 1 | -1): number {
  let index = startIndex
  const total = profissionalAgendaTourSteps.length

  while (index >= 0 && index < total) {
    const step = profissionalAgendaTourSteps[index]
    if (!step.target || !step.skipIfMissing || findTourTarget(step.target)) {
      return index
    }
    index += direction
  }

  return direction === 1 ? total - 1 : 0
}

const TARGET_POLL_INTERVAL_MS = 120
const TARGET_POLL_MAX_ATTEMPTS = 20

export function useProfissionalAgendaTour({
  agendaTab,
  setAgendaTab,
  forceStart = false,
  onBeforeAdvance,
}: UseProfissionalAgendaTourOptions) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isMandatorySession, setIsMandatorySession] = useState(false)
  const completedRef = useRef(false)
  const onBeforeAdvanceRef = useRef(onBeforeAdvance)

  useEffect(() => {
    onBeforeAdvanceRef.current = onBeforeAdvance
  }, [onBeforeAdvance])

  const step: ProfissionalAgendaTourStep = profissionalAgendaTourSteps[stepIndex]
  const isLastStep = stepIndex >= profissionalAgendaTourSteps.length - 1
  const totalSteps = profissionalAgendaTourSteps.length

  const startTour = useCallback((options?: { replay?: boolean }) => {
    completedRef.current = false
    setIsMandatorySession(!options?.replay)
    setAgendaTab('dia')
    setStepIndex(0)
    setActive(true)
  }, [setAgendaTab])

  const finishTour = useCallback(() => {
    setActive(false)
    if (!completedRef.current) {
      completedRef.current = true
      markProfissionalAgendaTourCompleted()
    }
  }, [])

  const advanceToNextStep = useCallback(() => {
    setStepIndex((current) => {
      if (current >= profissionalAgendaTourSteps.length - 1) {
        finishTour()
        return current
      }
      return resolveStepIndex(current + 1, 1)
    })
  }, [finishTour])

  const goNext = useCallback(() => {
    onBeforeAdvanceRef.current?.(step, 'next')

    window.setTimeout(() => {
      advanceToNextStep()
    }, step.tab === 'fila' || step.id === 'enter-shift' ? 320 : 80)
  }, [advanceToNextStep, step])

  const goBack = useCallback(() => {
    setStepIndex((current) => resolveStepIndex(current - 1, -1))
  }, [])

  useEffect(() => {
    if (forceStart) {
      startTour({ replay: true })
      return
    }
    if (!isProfissionalAgendaTourCompleted()) {
      const timer = window.setTimeout(() => startTour(), 600)
      return () => window.clearTimeout(timer)
    }
  }, [forceStart, startTour])

  useEffect(() => {
    if (!active || !step.tab || step.tab === agendaTab) return
    setAgendaTab(step.tab)
  }, [active, agendaTab, setAgendaTab, step.tab])

  useEffect(() => {
    if (!active) return

    if (!step.target) {
      setTargetRect(null)
      return
    }

    let attempts = 0
    let timerId = 0

    function pollTarget() {
      const target = findTourTarget(step.target!)
      if (target) {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
        setTargetRect(target.getBoundingClientRect())
        return
      }

      attempts += 1
      if (step.skipIfMissing && attempts >= TARGET_POLL_MAX_ATTEMPTS) {
        setStepIndex((current) => resolveStepIndex(current + 1, 1))
        return
      }

      if (attempts < TARGET_POLL_MAX_ATTEMPTS) {
        timerId = window.setTimeout(pollTarget, TARGET_POLL_INTERVAL_MS)
      }
    }

    const initialDelay = step.tab && step.tab !== agendaTab ? 280 : 60
    timerId = window.setTimeout(pollTarget, initialDelay)

    return () => window.clearTimeout(timerId)
  }, [active, agendaTab, step.skipIfMissing, step.tab, step.target, stepIndex])

  useEffect(() => {
    if (!active || !step.target) return

    function syncTargetRect() {
      const target = findTourTarget(step.target!)
      if (target) {
        setTargetRect(target.getBoundingClientRect())
      }
    }

    window.addEventListener('resize', syncTargetRect)
    window.addEventListener('scroll', syncTargetRect, true)

    const scrollContainers = document.querySelectorAll(
      '[class*="overflow-y-auto"], [class*="overflow-auto"]',
    )
    scrollContainers.forEach((node) => {
      node.addEventListener('scroll', syncTargetRect, { passive: true })
    })

    return () => {
      window.removeEventListener('resize', syncTargetRect)
      window.removeEventListener('scroll', syncTargetRect, true)
      scrollContainers.forEach((node) => {
        node.removeEventListener('scroll', syncTargetRect)
      })
    }
  }, [active, step.target, stepIndex, agendaTab])

  useEffect(() => {
    if (!active) return
    if (step.advanceOn !== 'target-click' && step.advanceOn !== 'next-or-target-click') return
    if (!step.target) return

    function handleTargetClick(event: MouseEvent) {
      const target = findTourTarget(step.target!)
      if (!target?.contains(event.target as Node)) return

      onBeforeAdvanceRef.current?.(step, 'target-click')
      window.setTimeout(advanceToNextStep, 320)
    }

    document.addEventListener('click', handleTargetClick, true)
    return () => document.removeEventListener('click', handleTargetClick, true)
  }, [active, advanceToNextStep, step])

  useEffect(() => {
    if (!active || !step.target) return

    const target = findTourTarget(step.target)
    if (!target) return

    target.dataset.tourActive = 'true'

    return () => {
      delete target.dataset.tourActive
    }
  }, [active, step.target, stepIndex, targetRect])

  const highlightedTarget = useMemo(
    () => (step.target ? findTourTarget(step.target) : null),
    [step.target, stepIndex, targetRect],
  )

  return {
    active,
    step,
    stepIndex,
    totalSteps,
    targetRect,
    highlightedTarget,
    isLastStep,
    isMandatorySession,
    startTour,
    finishTour,
    goNext,
    goBack,
  }
}
