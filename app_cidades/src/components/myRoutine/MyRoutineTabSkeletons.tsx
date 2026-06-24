import { StyleSheet, View } from 'react-native'
import { SkeletonBone } from '../SkeletonBone'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import type { ThemeColors } from '../../theme/palettes'

export function MyRoutineTodayTabSkeleton() {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.todayRoot}>
      <SkeletonBone width="100%" height={148} borderRadius={16} />
      <SkeletonBone width="100%" height={72} borderRadius={16} />
      <SkeletonBone width="100%" height={132} borderRadius={16} />
      <SkeletonBone width="55%" height={14} borderRadius={6} />
      <SkeletonBone width="100%" height={64} borderRadius={14} />
      <SkeletonBone width="100%" height={64} borderRadius={14} />
      <SkeletonBone width="100%" height={64} borderRadius={14} />
    </View>
  )
}

export function MyRoutineWeekTabSkeleton() {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.weekRoot}>
      <SkeletonBone width="100%" height={56} borderRadius={16} />
      <View style={styles.summaryRow}>
        <SkeletonBone width="30%" height={56} borderRadius={14} />
        <SkeletonBone width="30%" height={56} borderRadius={14} />
        <SkeletonBone width="30%" height={56} borderRadius={14} />
      </View>
      <SkeletonBone width="100%" height={72} borderRadius={16} />
      <SkeletonBone width="48%" height={14} borderRadius={6} />
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonBone key={index} width="100%" height={72} borderRadius={14} />
      ))}
    </View>
  )
}

export function MyRoutineProfileTabSkeleton() {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.profileRoot}>
      <SkeletonBone width="42%" height={22} borderRadius={6} />
      <SkeletonBone width="88%" height={14} borderRadius={5} />
      <SkeletonBone width="100%" height={120} borderRadius={16} />
      <SkeletonBone width="100%" height={96} borderRadius={16} />
      <SkeletonBone width="100%" height={88} borderRadius={16} />
      <SkeletonBone width="100%" height={140} borderRadius={16} />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  todayRoot: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  weekRoot: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  profileRoot: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
}
}

