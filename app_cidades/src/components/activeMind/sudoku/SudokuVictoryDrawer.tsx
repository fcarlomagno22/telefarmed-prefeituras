import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getActiveMindDifficultyLabel } from '../../../config/activeMindDifficulty'
import { pickRandomSudokuCelebrationLottie } from '../../../config/sudokuCelebrationLotties'
import { colors } from '../../../theme/colors'
import type { ActiveMindPlayDifficulty } from '../../../types/activeMind'
import type { SudokuSessionStats } from '../../../types/sudoku'
import { playSudokuCelebrationSound } from '../../../utils/appSounds'
import { AppModal } from '../../AppModal'
import { LottiePlayer } from '../../LottiePlayer'
import { PrimaryButton } from '../../PrimaryButton'
import { SudokuVictoryPieChart } from './SudokuVictoryPieChart'

type SudokuVictoryDrawerProps = {
  visible: boolean
  difficulty: ActiveMindPlayDifficulty
  stats: SudokuSessionStats
  celebrationSeed: number
  onPlayAgain: () => void
  onClose: () => void
}

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  accent: string
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export function SudokuVictoryDrawer({
  visible,
  difficulty,
  stats,
  celebrationSeed,
  onPlayAgain,
  onClose,
}: SudokuVictoryDrawerProps) {
  const insets = useSafeAreaInsets()

  const lottieSource = useMemo(
    () => pickRandomSudokuCelebrationLottie(),
    [celebrationSeed],
  )

  const neutralAttempts = Math.max(0, stats.attempts - stats.correct - stats.errors)
  const difficultyLabel = getActiveMindDifficultyLabel(difficulty)

  const pieSlices = useMemo(
    () => [
      {
        id: 'correct',
        label: 'Acertos',
        value: stats.correct,
        gradient: ['#86efac', '#4ade80', '#16a34a'] as const,
      },
      {
        id: 'errors',
        label: 'Erros',
        value: stats.errors,
        gradient: ['#fca5a5', '#f87171', '#dc2626'] as const,
      },
      {
        id: 'neutral',
        label: 'Outras',
        value: neutralAttempts,
        gradient: ['#fde68a', '#fbbf24', '#d97706'] as const,
      },
    ],
    [neutralAttempts, stats.correct, stats.errors],
  )

  useEffect(() => {
    if (!visible) return

    playSudokuCelebrationSound()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [visible, celebrationSeed])

  return (
    <AppModal visible={visible} animationType="fade" onRequestClose={onClose}>
      <LinearGradient
        colors={['#12121a', '#0a0a0c', '#0a0a0c']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.glowOrb, styles.glowOrbLeft]} pointerEvents="none" />
      <View style={[styles.glowOrb, styles.glowOrbRight]} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>Sudoku completo</Text>
          <Text style={styles.title}>Parabéns!</Text>
          <Text style={styles.subtitle}>
            Você finalizou o nível {difficultyLabel}. Veja como foi sua partida.
          </Text>
        </View>

        <View style={styles.lottieFrame}>
          <LinearGradient
            colors={['rgba(255, 133, 51, 0.18)', 'rgba(255, 107, 0, 0.06)', 'transparent']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LottiePlayer
            source={lottieSource}
            loop={false}
            style={styles.lottieWrap}
            animationStyle={styles.lottie}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="grid-outline"
            label="Tentativas"
            value={String(stats.attempts)}
            accent="#93c5fd"
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Acertos"
            value={String(stats.correct)}
            accent="#4ade80"
          />
          <StatCard
            icon="close-circle-outline"
            label="Erros"
            value={String(stats.errors)}
            accent="#f87171"
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Distribuição das jogadas</Text>
          <SudokuVictoryPieChart slices={pieSlices} />
          <View style={styles.legend}>
            {pieSlices.map((slice) => (
              <View key={slice.id} style={styles.legendItem}>
                <LinearGradient
                  colors={[...slice.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.legendSwatch}
                />
                <Text style={styles.legendLabel}>
                  {slice.label}: {slice.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {stats.reveals > 0 ? (
          <Text style={styles.revealHint}>
            Você usou {stats.reveals} {stats.reveals === 1 ? 'revelação' : 'revelações'} nesta partida.
          </Text>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label="Jogar outro" onPress={onPlayAgain} />
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Text style={styles.secondaryButtonLabel}>Voltar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  glowOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.35,
  },
  glowOrbLeft: {
    top: 80,
    left: -80,
    backgroundColor: 'rgba(255, 107, 0, 0.22)',
  },
  glowOrbRight: {
    top: 260,
    right: -90,
    backgroundColor: 'rgba(103, 232, 249, 0.16)',
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  kicker: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  lottieFrame: {
    minHeight: 240,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieWrap: {
    marginBottom: 0,
    minHeight: 220,
    width: '100%',
  },
  lottie: {
    width: 240,
    height: 220,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartCard: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  legend: {
    width: '100%',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  revealHint: {
    color: colors.textSubtle,
    fontSize: 12,
    textAlign: 'center',
  },
  actions: {
    gap: 10,
    paddingTop: 4,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
})
