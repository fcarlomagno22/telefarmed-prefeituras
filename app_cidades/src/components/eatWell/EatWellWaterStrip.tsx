import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { formatLitersFromMl } from '../../utils/eatWellNutritionStats'
import { RunWalkHistoryAnimatedBar } from '../runWalk/history/RunWalkHistoryAnimatedBar'

type EatWellWaterStripProps = {
  consumedMl: number
  goalMl: number
  animate?: boolean
  onRegisterPress: () => void
  onUndoLast?: () => void
  canUndo?: boolean
}

export function EatWellWaterStrip({
  consumedMl,
  goalMl,
  animate = true,
  onRegisterPress,
  onUndoLast,
  canUndo = false,
}: EatWellWaterStripProps) {
  const progress = goalMl > 0 ? consumedMl / goalMl : 0

  function handleRegisterPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onRegisterPress()
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(6, 182, 212, 0.16)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons name="water" size={18} color="#67e8f9" />
            <Text style={styles.title}>Hidratação</Text>
          </View>
          <Text style={styles.value}>
            {formatLitersFromMl(consumedMl)} / {formatLitersFromMl(goalMl)}
          </Text>
        </View>

        <View style={styles.dropletsRow}>
          {Array.from({ length: 8 }, (_, index) => {
            const filled = progress >= (index + 1) / 8
            return (
              <Ionicons
                key={index}
                name={filled ? 'water' : 'water-outline'}
                size={16}
                color={filled ? '#67e8f9' : 'rgba(103, 232, 249, 0.25)'}
              />
            )
          })}
        </View>

        <RunWalkHistoryAnimatedBar
          progress={Math.min(progress, 1)}
          animate={animate}
          color="#22d3ee"
          trackStyle={styles.progressTrack}
        />

        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleRegisterPress}
            style={({ pressed }) => [styles.registerBtn, pressed && styles.registerBtnPressed]}
          >
            <Ionicons name="add-circle-outline" size={16} color="#0a0a0c" />
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
      </LinearGradient>
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
    borderColor: 'rgba(6, 182, 212, 0.2)',
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
    color: '#a5f3fc',
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
    backgroundColor: '#67e8f9',
  },
  registerBtnPressed: {
    opacity: 0.88,
  },
  registerBtnText: {
    color: '#0a0a0c',
    fontSize: 13,
    fontWeight: '900',
  },
  undoBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
})
