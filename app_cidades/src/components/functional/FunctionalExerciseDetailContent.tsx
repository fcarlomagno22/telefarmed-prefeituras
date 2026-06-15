import { Ionicons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { FunctionalExercise } from '../../types/functionalTraining'
import { getCategoryLabel, getEquipmentLabel } from '../../utils/functionalTraining'
import { FunctionalDifficultyBadge } from './FunctionalDifficultyBadge'
import { FunctionalLottie } from './FunctionalLottie'

type FunctionalExerciseDetailContentProps = {
  exercise: FunctionalExercise
}

export function FunctionalExerciseDetailContent({
  exercise,
}: FunctionalExerciseDetailContentProps) {
  return (
    <>
      <View style={styles.hero}>
        <View style={styles.lottieWrap}>
          <FunctionalLottie
            source={exercise.lottie}
            exerciseId={exercise.id}
            style={styles.lottie}
            variant="hero"
          />
        </View>

        <View style={styles.heroMeta}>
          <FunctionalDifficultyBadge difficulty={exercise.difficulty} />
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaChipText}>{exercise.durationDefaultSec}s sugeridos</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="barbell-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaChipText}>{getEquipmentLabel(exercise.equipment)}</Text>
          </View>
        </View>
      </View>

      <Section title="O que é">
        <Text style={styles.bodyText}>{exercise.description}</Text>
      </Section>

      <Section title="Para que serve">
        {exercise.benefits.map((benefit) => (
          <Bullet key={benefit} icon="checkmark-circle" text={benefit} />
        ))}
      </Section>

      <Section title="Como fazer">
        {exercise.steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </Section>

      <Section title="Músculos trabalhados">
        <View style={styles.chipsRow}>
          {exercise.muscles.map((muscle) => (
            <View key={muscle} style={styles.muscleChip}>
              <Text style={styles.muscleChipText}>{muscle}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Categorias">
        <View style={styles.chipsRow}>
          {exercise.categories.map((category) => (
            <View key={category} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{getCategoryLabel(category)}</Text>
            </View>
          ))}
        </View>
      </Section>

      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb-outline" size={16} color="#fbbf24" />
          <Text style={styles.tipsTitle}>Dicas importantes</Text>
        </View>
        {exercise.tips.map((tip) => (
          <Bullet key={tip} icon="alert-circle-outline" text={tip} tone="tip" />
        ))}
      </View>
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Bullet({
  icon,
  text,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap
  text: string
  tone?: 'default' | 'tip'
}) {
  return (
    <View style={styles.bulletRow}>
      <Ionicons
        name={icon}
        size={15}
        color={tone === 'tip' ? '#fbbf24' : '#6ee7b7'}
        style={styles.bulletIcon}
      />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)',
  },
  lottieWrap: {
    margin: 10,
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    alignSelf: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaChipText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    gap: 10,
  },
  sectionTitle: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bodyText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
  },
  stepNumberText: {
    color: '#fdba74',
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.22)',
  },
  muscleChipText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.22)',
  },
  categoryChipText: {
    color: '#fdba74',
    fontSize: 11,
    fontWeight: '700',
  },
  tipsCard: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.18)',
    gap: 10,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipsTitle: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '800',
  },
})
