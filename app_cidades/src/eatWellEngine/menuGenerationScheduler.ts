import { InteractionManager } from 'react-native'

export function yieldToUi() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}

/** Agenda trabalho pesado após animações/gestos da UI terminarem. */
export function scheduleAfterInteractions<T>(task: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const handle = InteractionManager.runAfterInteractions(() => {
      void Promise.resolve()
        .then(task)
        .then(resolve)
        .catch(reject)
    })

    return () => handle.cancel()
  })
}

export async function runInBackgroundChunks<T>(
  totalSteps: number,
  worker: (stepIndex: number) => T | Promise<T | void>,
  onStep?: (progress: number) => void,
): Promise<void> {
  for (let stepIndex = 0; stepIndex < totalSteps; stepIndex += 1) {
    await worker(stepIndex)
    onStep?.(Math.round(((stepIndex + 1) / totalSteps) * 100))
    await yieldToUi()
  }
}
