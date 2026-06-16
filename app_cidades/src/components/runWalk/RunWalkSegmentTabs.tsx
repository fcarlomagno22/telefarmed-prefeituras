import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RunWalkTab } from '../../types/runWalk'

type RunWalkSegmentTabsProps = {
  activeTab: RunWalkTab
  onChange: (tab: RunWalkTab) => void
}

const TABS: { id: RunWalkTab; label: string; available: boolean }[] = [
  { id: 'today', label: 'Hoje', available: true },
  { id: 'progress', label: 'Progresso', available: false },
]

export function RunWalkSegmentTabs({ activeTab, onChange }: RunWalkSegmentTabsProps) {
  function handlePress(tab: RunWalkTab, available: boolean) {
    if (!available) return
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
            onPress={() => handlePress(tab.id, tab.available)}
            style={({ pressed }) => [
              styles.tabPressable,
              pressed && tab.available && styles.tabPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: !tab.available }}
          >
            <View
              style={[
                styles.tab,
                active && styles.tabActive,
                !tab.available && styles.tabDisabled,
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  active && styles.tabLabelActive,
                  !tab.available && styles.tabLabelDisabled,
                ]}
              >
                {tab.label}
              </Text>
              {!tab.available ? <Text style={styles.soonBadge}>Em breve</Text> : null}
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
    padding: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabPressable: {
    flex: 1,
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
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
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
