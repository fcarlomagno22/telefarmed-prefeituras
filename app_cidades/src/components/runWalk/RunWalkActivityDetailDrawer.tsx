import type { TodayActivity } from '../../types/runWalk'
import { RunWalkActivityDetailContent } from './RunWalkActivityDetailContent'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type RunWalkActivityDetailDrawerProps = {
  visible: boolean
  activity: TodayActivity | null
  onClose: () => void
}

export function RunWalkActivityDetailDrawer({
  visible,
  activity,
  onClose,
}: RunWalkActivityDetailDrawerProps) {
  if (!activity) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Detalhes da atividade"
      subtitle={activity.title}
      onClose={onClose}
      fullScreen
    >
      <RunWalkActivityDetailContent activity={activity} />
    </RunWalkSheetDrawer>
  )
}
