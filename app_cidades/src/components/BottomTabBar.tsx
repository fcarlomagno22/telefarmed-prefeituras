import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { useBottomTabInset } from '../hooks/useBottomTabInset'
import { useThemedStyles } from '../hooks/useThemedStyles'
import type { ThemeColors } from '../theme/palettes'

const IS_WEB = Platform.OS === 'web'

/** Base opaca → topo levemente transparente (espelho do header). */
const TAB_BAR_FADE_COLORS = [
  'rgba(255, 255, 255, 0.72)',
  'rgba(255, 255, 255, 0.94)',
  '#ffffff',
] as const

const TAB_BAR_FADE_LOCATIONS = [0, 0.45, 1] as const

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
    labelLines: ['Pós-', 'consulta'],
    icon: 'clipboard-outline',
    iconActive: 'clipboard',
    materialIcon: 'clipboard-pulse-outline',
  },
]

type BottomTabBarProps = {
  activeTab: BottomTabId | null
  onTabPress: (tab: BottomTabId) => void
}

type TabStyles = ReturnType<typeof createStyles>

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

function ActiveTabContent({
  tab,
  styles,
  colors,
}: {
  tab: TabConfig
  styles: TabStyles
  colors: ThemeColors
}) {
  return (
    <View style={[styles.activeCapsule, IS_WEB && styles.activeCapsuleWeb]}>
      <View style={styles.activeGlow} />

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
            />
            <TabIcon tab={tab} active size={21} color="#fff" />
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  )
}

function TabLabel({ tab, styles }: { tab: TabConfig; styles: TabStyles }) {
  if (tab.labelLines) {
    return (
      <View style={[styles.labelStackRaised, IS_WEB && styles.labelStackWeb]}>
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
  styles,
  colors,
}: {
  tab: TabConfig
  isActive: boolean
  onPress: () => void
  styles: TabStyles
  colors: ThemeColors
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        IS_WEB && styles.tabWeb,
        pressed && styles.tabPressed,
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      {isActive ? (
        <ActiveTabContent tab={tab} styles={styles} colors={colors} />
      ) : (
        <View style={[styles.inactiveWrap, IS_WEB && styles.inactiveWrapWeb]}>
          <View style={styles.iconSlot}>
            <TabIcon tab={tab} active={false} size={22} color={colors.textMuted} />
          </View>
          <TabLabel tab={tab} styles={styles} />
        </View>
      )}
    </Pressable>
  )
}

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const bottomInset = useBottomTabInset()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)

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
      <View style={styles.dock}>
        <LinearGradient
          colors={[...TAB_BAR_FADE_COLORS]}
          locations={[...TAB_BAR_FADE_LOCATIONS]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <View style={[styles.tabRow, IS_WEB && styles.tabRowWeb, { paddingBottom: bottomInset }]}>
          {TABS.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTab}
              onPress={() => handlePress(tab.id)}
              styles={styles}
              colors={colors}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

const TOP_RADIUS = 28

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 40,
      ...Platform.select({
        web: {
          boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.06)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
      }),
    },
    dock: {
      width: '100%',
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
    tabRowWeb: {
      alignItems: 'center',
      paddingTop: 8,
      minHeight: 70,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 1,
    },
    tabWeb: {
      justifyContent: 'center',
      minHeight: 64,
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
    inactiveWrapWeb: {
      justifyContent: 'center',
      paddingTop: 0,
      minHeight: 64,
    },
    activeCapsule: {
      alignItems: 'center',
      paddingTop: 4,
      minHeight: 58,
    },
    activeCapsuleWeb: {
      justifyContent: 'center',
      paddingTop: 0,
      minHeight: 64,
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
      pointerEvents: 'none',
    },
    activeCapsuleBg: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.primaryLight,
    },
    activeIconOuter: {
      padding: 2,
      borderRadius: 18,
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
      pointerEvents: 'none',
    },
    iconSlot: {
      width: 42,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: colors.textMuted,
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
    labelStackWeb: {
      marginTop: 0,
    },
    labelLine: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.1,
      textAlign: 'center',
      lineHeight: 12,
      maxWidth: '100%',
    },
  })
}
