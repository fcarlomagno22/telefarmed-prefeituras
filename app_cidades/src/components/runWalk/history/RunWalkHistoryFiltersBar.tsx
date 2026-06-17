import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

type RunWalkHistoryFiltersBarProps = {
  activeFiltersCount: number
  exportingReport?: boolean
  onFiltersPress: () => void
  onReportPress: () => void
}

export function RunWalkHistoryFiltersBar({
  activeFiltersCount,
  exportingReport = false,
  onFiltersPress,
  onReportPress,
}: RunWalkHistoryFiltersBarProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          if (exportingReport) return
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onReportPress()
        }}
        style={({ pressed }) => [
          styles.reportButton,
          pressed && !exportingReport && styles.pressed,
          exportingReport && styles.reportButtonDisabled,
        ]}
      >
        {exportingReport ? (
          <ActivityIndicator size="small" color="#6ee7b7" />
        ) : (
          <Ionicons name="document-text-outline" size={14} color="#6ee7b7" />
        )}
        <Text style={styles.reportText}>
          {exportingReport ? 'Gerando…' : 'Criar relatório'}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onFiltersPress()
        }}
        style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
      >
        <Ionicons name="options-outline" size={14} color={colors.textMuted} />
        <Text style={styles.linkText}>Filtros avançados</Text>
        {activeFiltersCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFiltersCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  reportButtonDisabled: {
    opacity: 0.75,
  },
  reportText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.32)',
  },
  badgeText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.86,
  },
})
