import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { colors } from '../../theme/colors'
import { SkeletonBone } from '../SkeletonBone'

export function RunWalkWeeklyGoalCardSkeleton() {
  const { width: screenWidth } = useWindowDimensions()
  const chartWidth = screenWidth - 32 - 28

  return (
    <View style={styles.goalCardWrap}>
      <View style={styles.goalCard}>
        <View style={styles.headerRow}>
          <SkeletonBone width={36} height={36} borderRadius={12} />
          <View style={styles.headerText}>
            <SkeletonBone width="72%" height={15} borderRadius={6} />
            <SkeletonBone width="92%" height={11} borderRadius={5} />
          </View>
          <SkeletonBone width={72} height={14} borderRadius={5} />
        </View>

        <View style={styles.ringsRow}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={styles.ringBlock}>
              <SkeletonBone width={72} height={72} borderRadius={36} />
              <SkeletonBone width={52} height={9} borderRadius={4} />
            </View>
          ))}
        </View>

        <View style={styles.chartBlock}>
          <View style={styles.chartHeader}>
            <SkeletonBone width={128} height={11} borderRadius={4} />
            <SkeletonBone width={88} height={11} borderRadius={4} />
          </View>
          <SkeletonBone width={chartWidth} height={148} borderRadius={12} />
        </View>

        <SkeletonBone width="78%" height={13} borderRadius={5} />
        <SkeletonBone width="100%" height={46} borderRadius={14} />
      </View>
    </View>
  )
}

export function RunWalkDispositionCardSkeleton() {
  return (
    <View style={styles.dispositionCard}>
      <View style={styles.headerRow}>
        <SkeletonBone width={36} height={36} borderRadius={12} />
        <View style={styles.headerText}>
          <SkeletonBone width="42%" height={10} borderRadius={4} />
          <SkeletonBone width="88%" height={16} borderRadius={6} />
        </View>
      </View>

      <SkeletonBone width="100%" height={12} borderRadius={4} />
      <SkeletonBone width="94%" height={12} borderRadius={4} />

      <View style={styles.actionsRow}>
        <SkeletonBone width="48%" height={46} borderRadius={14} />
        <SkeletonBone width="48%" height={46} borderRadius={14} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  goalCardWrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
  },
  goalCard: {
    borderRadius: 17,
    padding: 14,
    gap: 14,
  },
  dispositionCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ringBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartBlock: {
    gap: 10,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
})
