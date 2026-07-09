import { Ionicons } from '@expo/vector-icons'
import { useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import type { ActiveMindSession } from '../../../types/activeMindSession'
import {
  formatActiveMindSessionDate,
  formatActiveMindSessionDuration,
  getActiveMindSessionDifficultyLabel,
  getActiveMindSessionGameTitle,
} from '../../../utils/activeMindSessionFormat'
import { colors } from '../../../theme/colors'

type ActiveMindHistorySessionRowProps = {
  session: ActiveMindSession
  onDeletePress: (session: ActiveMindSession) => void
}

export function ActiveMindHistorySessionRow({
  session,
  onDeletePress,
}: ActiveMindHistorySessionRowProps) {
  const swipeableRef = useRef<Swipeable | null>(null)
  const gameTitle = getActiveMindSessionGameTitle(session)
  const difficultyLabel = getActiveMindSessionDifficultyLabel(session)

  function renderRightActions(
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    })

    return (
      <Pressable
        onPress={() => {
          swipeableRef.current?.close()
          onDeletePress(session)
        }}
        style={styles.deleteAction}
        accessibilityRole="button"
        accessibilityLabel={`Excluir sessão de ${gameTitle}`}
      >
        <Animated.View style={[styles.deleteActionInner, { transform: [{ scale }] }]}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteActionText}>Excluir</Text>
        </Animated.View>
      </Pressable>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={renderRightActions}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={styles.gameTitle} numberOfLines={1}>
              {gameTitle}
            </Text>
            <Text style={styles.meta}>
              {difficultyLabel} · {formatActiveMindSessionDate(session.completedAt)}
            </Text>
          </View>

          <Pressable
            onPress={() => onDeletePress(session)}
            hitSlop={8}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel={`Excluir sessão de ${gameTitle}`}
          >
            <Ionicons name="trash-outline" size={16} color="#f87171" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#6ee7b7" />
            <Text style={styles.statText}>{session.stats.correct} acertos</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="close-circle-outline" size={14} color="#fca5a5" />
            <Text style={styles.statText}>{session.stats.errors} erros</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="time-outline" size={14} color="#f9a8d4" />
            <Text style={styles.statText}>
              {formatActiveMindSessionDuration(session.durationSec)}
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleCol: {
    flex: 1,
    gap: 3,
  },
  gameTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 114, 182, 0.08)',
  },
  statText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteAction: {
    width: 84,
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionInner: {
    alignItems: 'center',
    gap: 4,
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
})
