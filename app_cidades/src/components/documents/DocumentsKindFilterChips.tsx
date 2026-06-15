import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { DocumentKindFilter } from '../../types/myDocuments'
import { getDocumentKindLabel } from '../../utils/myDocuments'

type DocumentsKindFilterChipsProps = {
  activeFilter: DocumentKindFilter
  counts: {
    all: number
    prescription: number
    exam: number
    certificate: number
  }
  onChange: (filter: DocumentKindFilter) => void
}

const FILTERS: DocumentKindFilter[] = ['all', 'prescription', 'exam', 'certificate']

export function DocumentsKindFilterChips({
  activeFilter,
  counts,
  onChange,
}: DocumentsKindFilterChipsProps) {
  function getLabel(filter: DocumentKindFilter) {
    if (filter === 'all') return 'Todos'
    return getDocumentKindLabel(filter, true)
  }

  function getCount(filter: DocumentKindFilter) {
    return counts[filter]
  }

  function handlePress(filter: DocumentKindFilter) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(filter)
  }

  return (
    <View style={styles.wrap}>
      {FILTERS.map((filter) => {
        const active = activeFilter === filter
        const count = getCount(filter)

        return (
          <Pressable
            key={filter}
            onPress={() => handlePress(filter)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
              {getLabel(filter)}
            </Text>
            <Text style={[styles.chipCount, active && styles.chipCountActive]}>{count}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    borderColor: 'rgba(196, 181, 253, 0.35)',
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#e9d5ff',
    fontWeight: '700',
  },
  chipCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  chipCountActive: {
    color: '#ddd6fe',
  },
})
