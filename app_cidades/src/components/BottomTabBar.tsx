import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

export type BottomTabId =
  | 'menu'
  | 'my-metrics'
  | 'home'
  | 'agendar'
  | 'pos-consulta'

type TabConfig = {
  id: BottomTabId
  label: string
  labelLines?: readonly [string, string]
  icon: keyof typeof Ionicons.glyphMap
  iconActive: keyof typeof Ionicons.glyphMap
  materialIcon?: keyof typeof MaterialCommunityIcons.glyphMap
}

const TABS: TabConfig[] = [
  {
    id: 'menu',
    label: 'Menu',
    icon: 'menu-outline',
    iconActive: 'menu',
  },
  {
    id: 'my-metrics',
    label: 'Minhas métricas',
    labelLines: ['Minhas', 'métricas'],
    icon: 'pulse-outline',
    iconActive: 'pulse',
    materialIcon: 'ruler',
  },
  {
    id: 'home',
    label: 'Home',
    icon: 'home-outline',
    iconActive: 'home',
  },
  {
    id: 'agendar',
    label: 'Agendar consulta',
    labelLines: ['Agendar', 'consulta'],
    icon: 'calendar-outline',
    iconActive: 'calendar',
    materialIcon: 'calendar-clock',
  },
  {
    id: 'pos-consulta',
    label: 'Pós-consulta',
    icon: 'clipboard-outline',
    iconActive: 'clipboard',
    materialIcon: 'clipboard-pulse-outline',
  },
]

type BottomTabBarProps = {
  activeTab: BottomTabId | null
  onTabPress: (tab: BottomTabId) => void
}

function TabIcon({
  tab,
  active,
  color,
  size,
}: {
  tab: TabConfig
  active: boolean
  color: string
  size: number
}) {
  if (tab.materialIcon) {
    return <MaterialCommunityIcons name={tab.materialIcon} size={size} color={color} />
  }

  return <Ionicons name={active ? tab.iconActive : tab.icon} size={size} color={color} />
}

function ActiveTabContent({ tab }: { tab: TabConfig }) {
  return (
    <View style={styles.activeCapsule}>
      <View style={styles.activeGlow} pointerEvents="none" />

      <LinearGradient
        colors={[
          'rgba(255, 133, 51, 0.24)',
          'rgba(255, 107, 0, 0.12)',
          'rgba(255, 107, 0, 0.05)',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.activeCapsuleBg}
      >
        <View style={styles.activeIconOuter}>
          <LinearGradient
            colors={['#ffb366', colors.primaryLight, colors.primary, colors.primaryDark]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.activeIconGradient}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.activeIconShine}
              pointerEvents="none"
            />
            <TabIcon tab={tab} active size={21} color="#fff" />
          </LinearGradient>
        </View>

        <LinearGradient
          colors={['transparent', colors.primaryLight, colors.primary, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.activeIndicator}
          pointerEvents="none"
        />
      </LinearGradient>
    </View>
  )
}

function TabLabel({ tab }: { tab: TabConfig }) {
  if (tab.labelLines) {
    return (
      <View style={styles.labelStackRaised}>
        <Text style={styles.labelLine} numberOfLines={1}>
          {tab.labelLines[0]}
        </Text>
        <Text style={styles.labelLine} numberOfLines={1}>
          {tab.labelLines[1]}
        </Text>
      </View>
    )
  }

  return (
    <Text style={styles.label} numberOfLines={1}>
      {tab.label}
    </Text>
  )
}

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: TabConfig
  isActive: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      {isActive ? (
        <ActiveTabContent tab={tab} />
      ) : (
        <View style={styles.inactiveWrap}>
          <View style={styles.iconSlot}>
            <TabIcon tab={tab} active={false} size={22} color={colors.textMuted} />
          </View>
          <TabLabel tab={tab} />
        </View>
      )}
    </Pressable>
  )
}

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, 8)

  function handlePress(tab: BottomTabId) {
    if (activeTab !== null && tab !== activeTab) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } else if (activeTab === null) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onTabPress(tab)
  }

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[
          'rgba(36, 36, 46, 0.92)',
          'rgba(16, 16, 22, 0.99)',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.dock}
      >
        <View style={[styles.tabRow, { paddingBottom: bottomInset }]}>
          {TABS.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTab}
              onPress={() => handlePress(tab.id)}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  )
}

const TOP_RADIUS = 28

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 14,
  },
  dock: {
    borderTopLeftRadius: TOP_RADIUS,
    borderTopRightRadius: TOP_RADIUS,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
    minHeight: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 1,
  },
  tabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  inactiveWrap: {
    alignItems: 'center',
    gap: 5,
    paddingTop: 4,
    minHeight: 58,
  },
  activeCapsule: {
    alignItems: 'center',
    paddingTop: 4,
    minHeight: 58,
  },
  activeGlow: {
    position: 'absolute',
    top: 6,
    left: '12%',
    right: '12%',
    bottom: 14,
    borderRadius: 20,
    backgroundColor: colors.primaryGlow,
    opacity: 0.55,
  },
  activeCapsuleBg: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.35)',
    overflow: 'hidden',
  },
  activeIconOuter: {
    padding: 2,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  activeIconShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '18%',
    right: '18%',
    height: 2,
    borderRadius: 1,
  },
  iconSlot: {
    width: 42,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
    textAlign: 'center',
    maxWidth: '100%',
    lineHeight: 12,
  },
  labelStackRaised: {
    alignItems: 'center',
    marginTop: -12,
  },
  labelLine: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
    textAlign: 'center',
    lineHeight: 12,
    maxWidth: '100%',
  },
})
