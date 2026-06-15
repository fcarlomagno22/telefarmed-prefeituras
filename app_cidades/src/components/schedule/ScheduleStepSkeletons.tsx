import { StyleSheet, View } from 'react-native'
import { SkeletonBone } from '../SkeletonBone'

export function ScheduleUbtListSkeleton() {
  return (
    <View style={styles.list}>
      <SkeletonBone width="100%" height={220} borderRadius={16} />
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={styles.ubtCard}>
          <SkeletonBone width={42} height={42} borderRadius={12} />
          <View style={styles.ubtBody}>
            <SkeletonBone width="70%" height={14} borderRadius={5} />
            <SkeletonBone width="88%" height={10} borderRadius={4} />
            <SkeletonBone width="42%" height={10} borderRadius={4} />
          </View>
          <SkeletonBone width={22} height={22} borderRadius={11} />
        </View>
      ))}
    </View>
  )
}

export function ScheduleSpecialtyListSkeleton() {
  return (
    <View style={styles.list}>
      {Array.from({ length: 5 }, (_, index) => (
        <View key={index} style={styles.specialtyCard}>
          <SkeletonBone width={42} height={42} borderRadius={12} />
          <View style={styles.specialtyBody}>
            <SkeletonBone width="72%" height={14} borderRadius={5} />
            <SkeletonBone width="48%" height={10} borderRadius={4} />
          </View>
          <SkeletonBone width={22} height={22} borderRadius={11} />
        </View>
      ))}
    </View>
  )
}

export function ScheduleCalendarSkeleton() {
  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <SkeletonBone width={34} height={34} borderRadius={17} />
        <SkeletonBone width={120} height={16} borderRadius={6} />
        <SkeletonBone width={34} height={34} borderRadius={17} />
      </View>
      <View style={styles.weekdayRow}>
        {Array.from({ length: 7 }, (_, index) => (
          <SkeletonBone key={index} width={18} height={10} borderRadius={4} style={styles.weekdayBone} />
        ))}
      </View>
      <View style={styles.daysGrid}>
        {Array.from({ length: 35 }, (_, index) => (
          <View key={index} style={styles.dayCell}>
            <SkeletonBone width="100%" height={36} borderRadius={10} />
          </View>
        ))}
      </View>
      <SkeletonBone width="85%" height={10} borderRadius={4} style={styles.legendBone} />
    </View>
  )
}

export function ScheduleDoctorListSkeleton({ withSearch = false }: { withSearch?: boolean }) {
  return (
    <View style={styles.list}>
      {withSearch ? <SkeletonBone width="100%" height={44} borderRadius={12} /> : null}
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={styles.doctorCard}>
          <SkeletonBone width={48} height={48} borderRadius={24} />
          <View style={styles.doctorBody}>
            <SkeletonBone width="68%" height={14} borderRadius={5} />
            <SkeletonBone width="42%" height={10} borderRadius={4} />
            {withSearch ? <SkeletonBone width="36%" height={10} borderRadius={4} /> : null}
          </View>
          <SkeletonBone width={52} height={22} borderRadius={8} />
        </View>
      ))}
    </View>
  )
}

export function ScheduleTimeGridSkeleton() {
  return (
    <View style={styles.timeWrap}>
      <SkeletonBone width="100%" height={40} borderRadius={12} />
      <View style={styles.timeGrid}>
        {Array.from({ length: 12 }, (_, index) => (
          <SkeletonBone key={index} width="30%" height={44} borderRadius={12} style={styles.timeSlot} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(14, 14, 20, 0.5)',
  },
  specialtyBody: {
    flex: 1,
    gap: 6,
  },
  ubtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(14, 14, 20, 0.5)',
  },
  ubtBody: {
    flex: 1,
    gap: 6,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayBone: {
    flex: 1,
    alignSelf: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    padding: 2,
  },
  legendBone: {
    alignSelf: 'center',
    marginTop: 10,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(14, 14, 20, 0.5)',
  },
  doctorBody: {
    flex: 1,
    gap: 6,
  },
  timeWrap: {
    gap: 10,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    minWidth: 72,
    flexGrow: 1,
  },
})
