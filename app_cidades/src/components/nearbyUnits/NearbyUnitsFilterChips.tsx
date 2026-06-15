import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import type { NearbyUnitsFilter } from '../../types/nearbyUnits'
import type { NearbySheetSnap } from './NearbyUnitsBottomSheet'
import { colors } from '../../theme/colors'

const FILTERS: { id: NearbyUnitsFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'open-now', label: 'Abertas agora' },
  { id: 'nearest', label: 'Mais próximas' },
  { id: 'teleconsulta', label: 'Teleconsulta' },
]

type NearbyUnitsFilterChipsProps = {
  filter: NearbyUnitsFilter
  sheetSnap: NearbySheetSnap
  onFilterChange: (filter: NearbyUnitsFilter) => void
  onExpandList: () => void
  onShowMap: () => void
}

export function NearbyUnitsFilterChips({
  filter,
  sheetSnap,
  onFilterChange,
  onExpandList,
  onShowMap,
}: NearbyUnitsFilterChipsProps) {
  const listIsOpen = sheetSnap !== 'collapsed'

  function handleFilter(next: NearbyUnitsFilter) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onFilterChange(next)
  }

  function handleListToggle() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (listIsOpen) {
      onShowMap()
      return
    }
    onExpandList()
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map((item) => {
        const active = filter === item.id
        return (
          <Pressable
            key={item.id}
            onPress={() => handleFilter(item.id)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        )
      })}

      <Pressable
        onPress={handleListToggle}
        style={({ pressed }) => [
          styles.chip,
          listIsOpen && styles.chipActive,
          pressed && styles.chipPressed,
        ]}
      >
        <Text style={[styles.chipText, listIsOpen && styles.chipTextActive]}>
          {listIsOpen ? 'Ver mapa' : 'Ver lista'}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fbbf24',
  },
})
