import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { formatLitersFromMl } from '../../utils/eatWellNutritionStats'
import { RunWalkHistoryAnimatedBar } from '../runWalk/history/RunWalkHistoryAnimatedBar'

type EatWellWaterStripProps = {
  consumedMl: number
  goalMl: number
  animate?: boolean
  idleProgress?: boolean
  onRegisterPress: () => void
  onUndoLast?: () => void
  canUndo?: boolean
}

export function EatWellWaterStrip({
  consumedMl,
  goalMl,
  animate = true,
  idleProgress = true,
  onRegisterPress,
  onUndoLast,
  canUndo = false,
}: EatWellWaterStripProps) {
  const progress = goalMl > 0 ? consumedMl / goalMl : 0
  const showProgress = animate || idleProgress

  function handleRegisterPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onRegisterPress()
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons name="water" size={18} color="#0891b2" />
            <Text style={styles.title}>Hidratação</Text>
          </View>
          <Text style={styles.value}>
            {formatLitersFromMl(consumedMl)} / {formatLitersFromMl(goalMl)}
          </Text>
        </View>

        <View style={styles.dropletsRow}>
          {Array.from({ length: 8 }, (_, index) => {
            const filled = showProgress && progress >= (index + 1) / 8
            return (
              <Ionicons
                key={index}
                name={filled ? 'water' : 'water-outline'}
                size={16}
                color={filled ? '#0891b2' : 'rgba(8, 145, 178, 0.28)'}
              />
            )
          })}
        </View>

        <RunWalkHistoryAnimatedBar
          progress={Math.min(progress, 1)}
          animate={animate}
          preserveFinal={showProgress}
          color="#22d3ee"
          trackStyle={styles.progressTrack}
        />

        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleRegisterPress}
            style={({ pressed }) => [styles.registerBtn, pressed && styles.registerBtnPressed]}
          >
            <Ionicons name="add-circle-outline" size={16} color="#0891b2" />
            <Text style={styles.registerBtnText}>Registrar</Text>
          </Pressable>

          {canUndo && onUndoLast ? (
            <Pressable
              onPress={onUndoLast}
              style={({ pressed }) => [styles.undoBtn, pressed && styles.registerBtnPressed]}
            >
              <Ionicons name="arrow-undo" size={14} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  value: {
    color: '#0891b2',
    fontSize: 12,
    fontWeight: '800',
  },
  dropletsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  progressTrack: {
    height: 7,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  registerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.35)',
  },
  registerBtnPressed: {
    opacity: 0.88,
  },
  registerBtnText: {
    color: '#0891b2',
    fontSize: 13,
    fontWeight: '900',
  },
  undoBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
})
