import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useMemo, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { colors } from '../theme/colors'
import { ACTION_ICON_PALETTES } from '../theme/actionIconColors'
import { ScrollMoreHint } from './ScrollMoreHint'
import { SkeletonBone } from './SkeletonBone'

export type HomeQuickActionId =
  | 'schedule'
  | 'nearby-units'
  | 'post-consultation'
  | 'prescriptions'
  | 'my-appointments'

type HomeQuickActionsProps = {
  onActionPress?: (actionId: HomeQuickActionId) => void
  skeleton?: boolean
}

type QuickActionConfig = {
  id: HomeQuickActionId
  title: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconGradient: readonly [string, string, string]
  shadowColor: string
}

const ICON_SIZE = 52
const ICON_RADIUS = 13
const ICON_GLYPH_SIZE = 35
const HORIZONTAL_PADDING = 16
const ITEM_GAP = 10
const VISIBLE_ITEMS = 4
const PEEK_FRACTION = 0.48
const SCROLL_END_THRESHOLD = 12

const QUICK_ACTIONS: QuickActionConfig[] = [
  {
    id: 'schedule',
    title: 'Agendar Consulta',
    icon: 'calendar-clock',
    ...ACTION_ICON_PALETTES.schedule,
  },
  {
    id: 'my-appointments',
    title: 'Minhas Consultas',
    icon: 'stethoscope',
    ...ACTION_ICON_PALETTES.myAppointments,
  },
  {
    id: 'post-consultation',
    title: 'Pós-consulta',
    icon: 'clipboard-pulse-outline',
    ...ACTION_ICON_PALETTES.postConsultation,
  },
  {
    id: 'prescriptions',
    title: 'Atestados e +',
    icon: 'pill',
    ...ACTION_ICON_PALETTES.prescriptions,
  },
  {
    id: 'nearby-units',
    title: 'Unidades Próximas',
    icon: 'map-marker-radius',
    ...ACTION_ICON_PALETTES.nearbyUnits,
  },
]

function QuickActionAppIcon({
  action,
  pressed,
}: {
  action: QuickActionConfig
  pressed: boolean
}) {
  return (
    <View
      style={[
        styles.iconShadow,
        { shadowColor: action.shadowColor },
        pressed && styles.iconShadowPressed,
      ]}
    >
      <LinearGradient
        colors={[...action.iconGradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.iconSquircle}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={styles.iconGloss}
          pointerEvents="none"
        />

        <MaterialCommunityIcons name={action.icon} size={ICON_GLYPH_SIZE} color="#fff" />
      </LinearGradient>
    </View>
  )
}

function QuickActionButton({
  action,
  width,
  onPress,
}: {
  action: QuickActionConfig
  width: number
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.appButton,
        { width },
        pressed && styles.appButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={action.title}
    >
      {({ pressed }) => (
        <>
          <QuickActionAppIcon action={action} pressed={pressed} />
          <Text style={styles.appLabel} numberOfLines={2}>
            {action.title}
          </Text>
        </>
      )}
    </Pressable>
  )
}

export function HomeQuickActions({ onActionPress, skeleton = false }: HomeQuickActionsProps) {
  const { width: screenWidth } = useWindowDimensions()
  const itemWidth =
    (screenWidth - HORIZONTAL_PADDING - ITEM_GAP * (VISIBLE_ITEMS - 1)) /
    (VISIBLE_ITEMS + PEEK_FRACTION)

  const [contentWidth, setContentWidth] = useState(0)
  const [layoutWidth, setLayoutWidth] = useState(0)
  const [offsetX, setOffsetX] = useState(0)

  const canScrollMore = contentWidth > layoutWidth + 1

  const isAtEnd = useMemo(
    () => offsetX + layoutWidth >= contentWidth - SCROLL_END_THRESHOLD,
    [contentWidth, layoutWidth, offsetX],
  )

  const updateScrollMetrics = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    setOffsetX(contentOffset.x)
    setContentWidth(contentSize.width)
    setLayoutWidth(layoutMeasurement.width)
  }, [])

  function handlePress(actionId: HomeQuickActionId) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onActionPress?.(actionId)
  }

  if (skeleton) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Atendimento e Gestão</Text>
        </View>
        <View
          style={[
            styles.buttonsWrap,
            styles.scrollContent,
            styles.skeletonRow,
            { paddingHorizontal: HORIZONTAL_PADDING, gap: ITEM_GAP },
          ]}
        >
          {QUICK_ACTIONS.map((action) => (
            <View key={action.id} style={[styles.appButton, { width: itemWidth }]}>
              <SkeletonBone width={ICON_SIZE} height={ICON_SIZE} borderRadius={ICON_RADIUS} />
              <SkeletonBone width="78%" height={10} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Atendimento e Gestão</Text>
        {canScrollMore ? <ScrollMoreHint active={!isAtEnd} compact /> : null}
      </View>

      <View style={styles.buttonsWrap}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={updateScrollMetrics}
          onContentSizeChange={(width) => setContentWidth(width)}
          onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: HORIZONTAL_PADDING, gap: ITEM_GAP },
          ]}
        >
          {QUICK_ACTIONS.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              width={itemWidth}
              onPress={() => handlePress(action.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  buttonsWrap: {
    paddingTop: 12,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  appButton: {
    alignItems: 'center',
    gap: 7,
  },
  appButtonPressed: {
    opacity: 0.82,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  iconShadowPressed: {
    transform: [{ scale: 0.94 }],
  },
  iconSquircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  appLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 12,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
})
