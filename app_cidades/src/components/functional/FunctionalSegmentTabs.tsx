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
              <Text style={[styles.tabCount, active && styles.tabCountActive]}>
                {favoritesCount}
              </Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
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
    color: '#fed7aa',
    fontWeight: '700',
  },
  tabCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  tabCountActive: {
    color: '#fdba74',
  },
})
