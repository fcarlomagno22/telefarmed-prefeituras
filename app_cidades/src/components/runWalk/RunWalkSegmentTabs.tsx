import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RunWalkTab } from '../../types/runWalk'

export type RunWalkSegmentTabItem<T extends string = string> = {
  id: T
  label: string
  available?: boolean
}

type RunWalkSegmentTabsProps<T extends string = RunWalkTab> = {
  activeTab: T
  onChange: (tab: T) => void
  tabs?: RunWalkSegmentTabItem<T>[]
}

const DEFAULT_TABS: RunWalkSegmentTabItem<RunWalkTab>[] = [
  { id: 'today', label: 'Hoje', available: true },
  { id: 'progress', label: 'Histórico', available: true },
]

export function RunWalkSegmentTabs<T extends string = RunWalkTab>({
  activeTab,
  onChange,
  tabs = DEFAULT_TABS as RunWalkSegmentTabItem<T>[],
}: RunWalkSegmentTabsProps<T>) {
  function handlePress(tab: T, available: boolean) {
    if (!available) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(tab)
  }

  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id
        const available = tab.available ?? true

        return (
          <Pressable
            key={tab.id}
            onPress={() => handlePress(tab.id, available)}
            style={({ pressed }) => [
              styles.tabPressable,
              active && styles.tabPressableActive,
              pressed && available && styles.tabPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: !available }}
          >
            <View style={[styles.tab, !available && styles.tabDisabled]}>
              <Text
                style={[
                  styles.tabLabel,
                  active && styles.tabLabelActive,
                  !available && styles.tabLabelDisabled,
                ]}
              >
                {tab.label}
              </Text>
              {!available ? <Text style={styles.soonBadge}>Em breve</Text> : null}
            </View>
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
    marginBottom: 12,
    padding: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  tabPressable: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabPressableActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  tabPressed: {
    opacity: 0.88,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
  },
  tabDisabled: {
    opacity: 0.55,
  },
  tabLabel: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  tabLabelDisabled: {
    color: colors.textSubtle,
  },
  soonBadge: {
    color: colors.textSubtle,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
})
