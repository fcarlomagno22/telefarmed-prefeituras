import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { MyRoutineDayPlan, MyRoutineTask } from '../../types/myRoutine'
import { formatPriorityLabel, getTaskMapHour } from '../../utils/myRoutineTodayHelpers'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const MAP_START = 6
const MAP_END = 23
const HOUR_WIDTH = 52
const ACCENT = '#d946ef'

type MyRoutineDayMapDrawerProps = {
  visible: boolean
  dayPlan: MyRoutineDayPlan | null
  onClose: () => void
  onTaskPress: (task: MyRoutineTask) => void
}

function priorityColor(priority: MyRoutineTask['priority']) {
  if (priority === 'essential') return ACCENT
  if (priority === 'desirable') return '#a78bfa'
  return 'rgba(255,255,255,0.35)'
}

export function MyRoutineDayMapDrawer({
  visible,
  dayPlan,
  onClose,
  onTaskPress,
}: MyRoutineDayMapDrawerProps) {
  const styles = useThemedStyles(createStyles)
  const hours = Array.from({ length: MAP_END - MAP_START + 1 }, (_, i) => MAP_START + i)
  const tasks = dayPlan?.tasks ?? []

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Mapa do dia"
      subtitle="6h às 23h · toque em uma tarefa"
      onClose={onClose}
      scrollable={false}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.map}>
          <View style={styles.hourRow}>
            {hours.map((hour) => (
              <View key={hour} style={[styles.hourCell, { width: HOUR_WIDTH }]}>
                <Text style={styles.hourLabel}>{hour}h</Text>
              </View>
            ))}
          </View>

          <View style={styles.lane}>
            {hours.map((hour) => (
              <View key={`grid-${hour}`} style={[styles.gridCell, { width: HOUR_WIDTH }]} />
            ))}

            {tasks.map((task) => {
              const hour = getTaskMapHour(task)
              const clamped = Math.min(Math.max(hour, MAP_START), MAP_END - 0.5)
              const left = (clamped - MAP_START) * HOUR_WIDTH
              const width = Math.max(HOUR_WIDTH * 0.9, 72)

              return (
                <Pressable
                  key={task.id}
                  onPress={() => onTaskPress(task)}
                  style={({ pressed }) => [
                    styles.taskBlock,
                    {
                      left,
                      width,
                      backgroundColor: `${priorityColor(task.priority)}33`,
                      borderColor: priorityColor(task.priority),
                      opacity: task.status === 'done' ? 0.55 : pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={styles.taskTitle} numberOfLines={2}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskMeta}>{formatPriorityLabel(task.priority)}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  scroll: { flexGrow: 0 },
  map: { paddingBottom: 8 },
  hourRow: { flexDirection: 'row', marginBottom: 8 },
  hourCell: { alignItems: 'center' },
  hourLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  lane: {
    position: 'relative',
    flexDirection: 'row',
    minHeight: 120,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gridCell: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  taskBlock: {
    position: 'absolute',
    top: 10,
    minHeight: 56,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  taskTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  taskMeta: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
}
}

