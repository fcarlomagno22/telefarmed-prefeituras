import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { FunctionalExercise } from '../../types/functionalTraining'
import { getCategoryLabel, getEquipmentLabel } from '../../utils/functionalTraining'
import { FunctionalDifficultyBadge } from './FunctionalDifficultyBadge'
import { FunctionalLottie } from './FunctionalLottie'

type FunctionalExerciseListRowProps = {
  exercise: FunctionalExercise
  isFavorite: boolean
  onPress: () => void
  onToggleFavorite: () => void
}

export function FunctionalExerciseListRow({
  exercise,
  isFavorite,
  onPress,
  onToggleFavorite,
}: FunctionalExerciseListRowProps) {
  function handleFavoritePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onToggleFavorite()
  }

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Abrir exercício ${exercise.name}`}
      >
        <View style={styles.previewWrap}>
          <FunctionalLottie
            source={exercise.lottie}
            exerciseId={exercise.id}
            style={styles.preview}
            variant="thumb"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {exercise.name}
          </Text>

          <View style={styles.metaRow}>
            <FunctionalDifficultyBadge difficulty={exercise.difficulty} compact />
            <Text style={styles.metaText}>
              {exercise.categories.slice(0, 2).map(getCategoryLabel).join(' · ')}
            </Text>
          </View>

          <Text style={styles.equipment}>{getEquipmentLabel(exercise.equipment)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
      </Pressable>

      <Pressable
        onPress={handleFavoritePress}
        hitSlop={8}
        style={({ pressed }) => [styles.favBtn, pressed && styles.favBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={
          isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
        }
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={18}
          color={isFavorite ? '#fb7185' : colors.textMuted}
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  rowPressed: {
    opacity: 0.9,
  },
  previewWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    width: 72,
    height: 72,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  equipment: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  favBtnPressed: {
    opacity: 0.82,
  },
})
