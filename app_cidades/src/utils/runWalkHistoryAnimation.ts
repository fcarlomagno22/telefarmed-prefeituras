export type RunWalkHistoryAnimationState = {
  animate: boolean
  preserveFinal: boolean
}

export function resolveRunWalkHistoryAnimation(
  isActive: boolean,
  revealed: boolean,
): RunWalkHistoryAnimationState {
  return {
    animate: isActive && revealed,
    preserveFinal: false,
  }
}
