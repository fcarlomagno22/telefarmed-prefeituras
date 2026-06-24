import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { AppScreen } from '../types/auth'
import { getMyRoutineRouteParams } from '../types/auth'
import type { MyRoutineLinkedModule, MyRoutineTask } from '../types/myRoutine'
import {
  buildMyRoutineModuleLinkParams,
  LINKED_MODULE_ROUTES,
} from '../utils/myRoutineTodayHelpers'

export type MyRoutineModuleCompletionPrompt = {
  taskId: string
  taskTitle: string
  linkedModule?: MyRoutineLinkedModule | null
}

type PendingReturn = MyRoutineModuleCompletionPrompt

let pendingModuleReturn: PendingReturn | null = null

export function setMyRoutinePendingModuleReturn(pending: PendingReturn) {
  pendingModuleReturn = pending
}

export function peekMyRoutinePendingModuleReturn(): PendingReturn | null {
  return pendingModuleReturn
}

export function consumeMyRoutinePendingModuleReturn(): PendingReturn | null {
  const next = pendingModuleReturn
  pendingModuleReturn = null
  return next
}

type UseMyRoutineModuleReturnOptions = {
  onMarkDone: (taskId: string) => void | Promise<void>
}

export function useMyRoutineModuleReturn({ onMarkDone }: UseMyRoutineModuleReturnOptions) {
  const { screen, routeParams, navigateTo } = useAuth()
  const [completionPrompt, setCompletionPrompt] = useState<MyRoutineModuleCompletionPrompt | null>(
    null,
  )
  const handledReturnRef = useRef<string | null>(null)

  const resolveReturnPrompt = useCallback((prompt: MyRoutineModuleCompletionPrompt) => {
    if (handledReturnRef.current === prompt.taskId) return
    handledReturnRef.current = prompt.taskId
    setCompletionPrompt(prompt)
  }, [])

  useEffect(() => {
    if (screen !== 'my-routine') return

    const routeCompletion = getMyRoutineRouteParams(routeParams)
    if (routeCompletion.completeTaskId) {
      resolveReturnPrompt({
        taskId: routeCompletion.completeTaskId,
        taskTitle: routeCompletion.completeTaskTitle ?? 'Tarefa da rotina',
      })
      navigateTo('my-routine')
      return
    }

    const pending = consumeMyRoutinePendingModuleReturn()
    if (pending) {
      resolveReturnPrompt(pending)
    }
  }, [navigateTo, resolveReturnPrompt, routeParams, screen])

  const openLinkedModule = useCallback(
    (task: MyRoutineTask) => {
      if (!task.linkedModule) return

      const route = LINKED_MODULE_ROUTES[task.linkedModule] as AppScreen
      setMyRoutinePendingModuleReturn({
        taskId: task.id,
        taskTitle: task.title,
        linkedModule: task.linkedModule,
      })
      handledReturnRef.current = null
      navigateTo(route, buildMyRoutineModuleLinkParams(task.id))
    },
    [navigateTo],
  )

  const openShortcutModule = useCallback(
    (route: AppScreen) => {
      handledReturnRef.current = null
      navigateTo(route)
    },
    [navigateTo],
  )

  const dismissCompletionPrompt = useCallback(() => {
    setCompletionPrompt(null)
  }, [])

  const confirmCompletionPrompt = useCallback(async () => {
    if (!completionPrompt) return
    await onMarkDone(completionPrompt.taskId)
    setCompletionPrompt(null)
  }, [completionPrompt, onMarkDone])

  return {
    completionPrompt,
    openLinkedModule,
    openShortcutModule,
    dismissCompletionPrompt,
    confirmCompletionPrompt,
  }
}
