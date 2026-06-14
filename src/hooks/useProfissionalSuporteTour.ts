import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  profissionalSuporteTourSteps,
  type ProfissionalSuporteTourStep,
} from '../config/profissionalSuporteTour'
import { useProfissionalTourInviteGate } from './useProfissionalTourInviteGate'
import {
  isProfissionalSuporteTourInvitePending,
  markProfissionalSuporteTourCompleted,
  markProfissionalSuporteTourInviteHandled,
} from '../utils/profissional/profissionalSuporteTourStorage'

type TourAdvanceSource = 'next' | 'target-click'

type UseProfissionalSuporteTourOptions = {
  forceStart?: boolean
  disabled?: boolean
  onBeforeAdvance?: (step: ProfissionalSuporteTourStep, source: TourAdvanceSource) => void
  onStepActive?: (step: ProfissionalSuporteTourStep, stepIndex: number) => void
}

function findTourTarget(selector: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${selector}"]`)
}

function resolveStepIndex(startIndex: number, direction: 1 | -1): number {
  let index = startIndex
  const total = profissionalSuporteTourSteps.length

  while (index >= 0 && index < total) {
    const step = profissionalSuporteTourSteps[index]
    if (!step.target || !step.skipIfMissing || findTourTarget(step.target)) {
      return index
    }
    index += direction
  }

  return direction === 1 ? total - 1 : 0
}

const TARGET_POLL_INTERVAL_MS = 120
const TARGET_POLL_MAX_ATTEMPTS = 45

const SLOW_TARGET_STEP_IDS = new Set([
  'new-ticket-btn',
  'new-ticket-drawer',
  'view-ticket',
  'ticket-drawer',
  'ticket-drawer-chat',
])

export function useProfissionalSuporteTour({
  forceStart = false,
  disabled = false,
  onBeforeAdvance,
  onStepActive,
}: UseProfissionalSuporteTourOptions = {}) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const completedRef = useRef(false)
  const onBeforeAdvanceRef = useRef(onBeforeAdvance)
  const onStepActiveRef = useRef(onStepActive)

  useEffect(() => {
    onBeforeAdvanceRef.current = onBeforeAdvance
  }, [onBeforeAdvance])

  useEffect(() => {
    onStepActiveRef.current = onStepActive
  }, [onStepActive])

  const step: ProfissionalSuporteTourStep = profissionalSuporteTourSteps[stepIndex]
  const isLastStep = stepIndex >= profissionalSuporteTourSteps.length - 1
  const totalSteps = profissionalSuporteTourSteps.length

  const startTour = useCallback((options?: { replay?: boolean }) => {
    completedRef.current = false
    markProfissionalSuporteTourInviteHandled()
    setStepIndex(0)
    setActive(true)
  }, [])

  const isInvitePending = useCallback(() => isProfissionalSuporteTourInvitePending(), [])

  const { inviteOpen, acceptInvite, dismissInvite } = useProfissionalTourInviteGate({
    disabled,
    isInvitePending,
    markInviteHandled: markProfissionalSuporteTourInviteHandled,
    onStartTour: startTour,
  })

  const finishTour = useCallback(() => {
    setActive(false)
    if (!completedRef.current) {
      completedRef.current = true
      markProfissionalSuporteTourCompleted()
    }
  }, [])

  const advanceToNextStep = useCallback(() => {
    setStepIndex((current) => {
      if (current >= profissionalSuporteTourSteps.length - 1) {
        finishTour()
        return current
      }
      return resolveStepIndex(current + 1, 1)
    })
  }, [finishTour])

  const goNext = useCallback(() => {
    onBeforeAdvanceRef.current?.(step, 'next')

    const delay = SLOW_TARGET_STEP_IDS.has(step.id) ? 360 : 100
    window.setTimeout(() => {
      advanceToNextStep()
    }, delay)
  }, [advanceToNextStep, step])

  const goBack = useCallback(() => {
    setStepIndex((current) => resolveStepIndex(current - 1, -1))
  }, [])

  useEffect(() => {
    if (disabled) return
    if (forceStart) {
      startTour({ replay: true })
    }
  }, [disabled, forceStart, startTour])

  useEffect(() => {
    if (!active) return
    onStepActiveRef.current?.(step, stepIndex)
  }, [active, step, stepIndex])

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

    const initialDelay = SLOW_TARGET_STEP_IDS.has(step.id) ? 420 : 80
    timerId = window.setTimeout(pollTarget, initialDelay)

    return () => window.clearTimeout(timerId)
  }, [active, step.skipIfMissing, step.target, step.id, stepIndex])

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
  }, [active, step.target, stepIndex])

  useEffect(() => {
    if (!active) return
    if (step.advanceOn !== 'target-click' && step.advanceOn !== 'next-or-target-click') return
    if (!step.target) return

    function handleTargetClick(event: MouseEvent) {
      const target = findTourTarget(step.target!)
      if (!target?.contains(event.target as Node)) return

      onBeforeAdvanceRef.current?.(step, 'target-click')
      window.setTimeout(advanceToNextStep, 360)
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
    inviteOpen,
    acceptInvite,
    dismissInvite,
    startTour,
    finishTour,
    goNext,
    goBack,
  }
}
