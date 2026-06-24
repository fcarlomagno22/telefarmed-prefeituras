import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { colors } from '../theme/colors'
import { ACTION_ICON_PALETTES } from '../theme/actionIconColors'
import { SkeletonBone } from './SkeletonBone'

export type VidaSaudavelActionId =
  | 'my-metrics'
  | 'run-walk'
  | 'functional-training'
  | 'eat-well'
  | 'sleep-time'
  | 'mental-health'
  | 'my-emotional'
  | 'active-mind'
  | 'my-routine'

type VidaSaudavelActionsProps = {
  onActionPress?: (actionId: VidaSaudavelActionId) => void
  skeleton?: boolean
}

type ActionConfig = {
  id: VidaSaudavelActionId
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
const ROW_GAP = 20
const COLUMNS = 4

const ACTIONS: ActionConfig[] = [
  {
    id: 'my-metrics',
    title: 'Minhas Métricas',
    icon: 'ruler',
    ...ACTION_ICON_PALETTES.myMetrics,
  },
  {
    id: 'run-walk',
    title: 'Corrida e Caminhada',
    icon: 'run-fast',
    ...ACTION_ICON_PALETTES.runWalk,
  },
  {
    id: 'functional-training',
    title: 'Treino Funcional',
    icon: 'kettlebell',
    ...ACTION_ICON_PALETTES.functionalTraining,
  },
  {
    id: 'eat-well',
    title: 'Comer Bem',
    icon: 'food-apple-outline',
    ...ACTION_ICON_PALETTES.eatWell,
  },
  {
    id: 'sleep-time',
    title: 'Hora de dormir',
    icon: 'sleep',
    ...ACTION_ICON_PALETTES.sleepTime,
  },
  {
    id: 'mental-health',
    title: 'Saúde Mental',
    icon: 'brain',
    ...ACTION_ICON_PALETTES.mentalHealth,
  },
  {
    id: 'my-emotional',
    title: 'Meu emocional',
    icon: 'head-heart-outline',
    ...ACTION_ICON_PALETTES.myEmotional,
  },
  {
    id: 'active-mind',
    title: 'Ativa Mente',
    icon: 'puzzle',
    ...ACTION_ICON_PALETTES.activeMind,
  },
  {
    id: 'my-routine',
    title: 'Minha Rotina',
    icon: 'calendar-sync-outline',
    ...ACTION_ICON_PALETTES.myRoutine,
  },
]

function ActionAppIcon({
  action,
  pressed,
}: {
  action: ActionConfig
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

function ActionButton({
  action,
  width,
  onPress,
}: {
  action: ActionConfig
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
          <ActionAppIcon action={action} pressed={pressed} />
          <Text style={styles.appLabel} numberOfLines={2}>
            {action.title}
          </Text>
        </>
      )}
    </Pressable>
  )
}

export function VidaSaudavelActions({ onActionPress, skeleton = false }: VidaSaudavelActionsProps) {
  const { width: screenWidth } = useWindowDimensions()
  const itemWidth =
    (screenWidth - HORIZONTAL_PADDING * 2 - ITEM_GAP * (COLUMNS - 1)) / COLUMNS

  const rows = Array.from({ length: Math.ceil(ACTIONS.length / COLUMNS) }, (_, rowIndex) =>
    ACTIONS.slice(rowIndex * COLUMNS, rowIndex * COLUMNS + COLUMNS),
  )

  function handlePress(actionId: VidaSaudavelActionId) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onActionPress?.(actionId)
  }

  if (skeleton) {
    return (
      <View style={styles.wrapper}>
        {rows.map((row, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            style={[styles.row, rowIndex > 0 && { marginTop: ROW_GAP }]}
          >
            {row.map((action) => (
              <View key={action.id} style={[styles.appButton, { width: itemWidth }]}>
                <SkeletonBone width={ICON_SIZE} height={ICON_SIZE} borderRadius={ICON_RADIUS} />
                <SkeletonBone width="82%" height={10} borderRadius={4} />
              </View>
            ))}
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[styles.row, rowIndex > 0 && { marginTop: ROW_GAP }]}
        >
          {row.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              width={itemWidth}
              onPress={() => handlePress(action.id)}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: ITEM_GAP,
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
