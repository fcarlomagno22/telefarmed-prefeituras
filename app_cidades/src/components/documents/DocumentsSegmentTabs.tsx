import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { MyDocumentsTab } from '../../types/myDocuments'

type DocumentsSegmentTabsProps = {
  activeTab: MyDocumentsTab
  consultationCount: number
  documentCount: number
  onChange: (tab: MyDocumentsTab) => void
}

const TABS: { id: MyDocumentsTab; label: string }[] = [
  { id: 'by-consultation', label: 'Por consulta' },
  { id: 'by-document', label: 'Por documento' },
]

export function DocumentsSegmentTabs({
  activeTab,
  consultationCount,
  documentCount,
  onChange,
}: DocumentsSegmentTabsProps) {
  function getCount(tab: MyDocumentsTab) {
    return tab === 'by-consultation' ? consultationCount : documentCount
  }

  function handlePress(tab: MyDocumentsTab) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(tab)
  }

  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id
        const count = getCount(tab.id)

        return (
          <Pressable
            key={tab.id}
            onPress={() => handlePress(tab.id)}
            style={({ pressed }) => [styles.tabPressable, pressed && styles.tabPressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
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
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
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
  tabCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
  },
  tabCountActive: {
    color: colors.textMuted,
    opacity: 1,
  },
})
