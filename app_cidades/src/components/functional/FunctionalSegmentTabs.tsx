import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { FunctionalTrainingTab } from '../../types/functionalTraining'

type FunctionalSegmentTabsProps = {
  activeTab: FunctionalTrainingTab
  favoritesCount: number
  onChange: (tab: FunctionalTrainingTab) => void
}

const TABS: { id: FunctionalTrainingTab; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'favorites', label: 'Favoritos' },
]

export function FunctionalSegmentTabs({
  activeTab,
  favoritesCount,
  onChange,
}: FunctionalSegmentTabsProps) {
  function handlePress(tab: FunctionalTrainingTab) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(tab)
  }

  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id

        return (
          <Pressable
            key={tab.id}
            onPress={() => handlePress(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
          >
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.id === 'favorites' ? (
              <View style={[styles.countPill, active && styles.countPillActive]}>
                <Text style={[styles.tabCount, active && styles.tabCountActive]}>
                  {favoritesCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.backgroundElevated,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPressed: {
    opacity: 0.88,
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: '800',
  },
  countPill: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  countPillActive: {
    backgroundColor: '#ffedd5',
  },
  tabCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
  },
  tabCountActive: {
    color: '#c2410c',
  },
})
