import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import type { EatWellMenuMeal, FoodEntry } from '../../../types/eatWell'
import type { MealSlot } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { getMenuDetailSuggestedTime } from '../../../utils/eatWellMenuDetail'
import {
  delaySubstitutionLoading,
  findSimilarFoodAlternatives,
} from '../../../utils/eatWellMenuSubstitution'
import { getMealSlotConfig } from '../../../utils/eatWellMealSlots'
import { RunWalkSheetDrawer } from '../../runWalk/RunWalkSheetDrawer'
import { EatWellFoodMacroSummary } from './EatWellFoodMacroSummary'

type SubstitutePhase = 'pick' | 'loading' | 'options'

type EatWellMenuSubstituteDrawerProps = {
  visible: boolean
  slot: MealSlot | null
  meal: EatWellMenuMeal | null
  onClose: () => void
  onConfirmSubstitute: (slot: MealSlot, originalEntryId: string, replacement: FoodEntry) => void
}

export function EatWellMenuSubstituteDrawer({
  visible,
  slot,
  meal,
  onClose,
  onConfirmSubstitute,
}: EatWellMenuSubstituteDrawerProps) {
  const [phase, setPhase] = useState<SubstitutePhase>('pick')
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null)
  const [options, setOptions] = useState<FoodEntry[]>([])
  const loadingOpacity = useRef(new Animated.Value(0)).current
  const loadingScale = useRef(new Animated.Value(0.96)).current

  useEffect(() => {
    if (!visible) {
      setPhase('pick')
      setSelectedEntry(null)
      setOptions([])
      loadingOpacity.setValue(0)
      loadingScale.setValue(0.96)
    }
  }, [loadingOpacity, loadingScale, visible])

  useEffect(() => {
    if (phase !== 'loading') return

    loadingOpacity.setValue(0)
    loadingScale.setValue(0.96)

    Animated.parallel([
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(loadingScale, {
        toValue: 1,
        damping: 16,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start()
  }, [loadingOpacity, loadingScale, phase])

  if (!slot) return null

  const config = getMealSlotConfig(slot)
  const suggestedTime = getMenuDetailSuggestedTime(slot)
  const entries = meal?.entries ?? []

  async function handlePickEntry(entry: FoodEntry) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedEntry(entry)
    setPhase('loading')

    await delaySubstitutionLoading()
    setOptions(findSimilarFoodAlternatives(entry, 5))
    setPhase('options')
  }

  function handleClose() {
    if (phase === 'options') {
      setPhase('pick')
      setSelectedEntry(null)
      setOptions([])
      return
    }

    onClose()
  }

  function handleSelectOption(option: FoodEntry) {
    if (!selectedEntry || !slot) return
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onConfirmSubstitute(slot, selectedEntry.id, {
      ...option,
      id: selectedEntry.id,
    })
    onClose()
  }

  const title =
    phase === 'pick'
      ? 'Substituir alimento'
      : phase === 'loading'
        ? 'Buscando opções'
        : 'Escolha a substituição'

  const subtitle =
    phase === 'pick'
      ? `${config.label} · ${suggestedTime}`
      : phase === 'loading'
        ? selectedEntry?.name ?? 'Analisando perfil nutricional…'
        : `Alternativas para ${selectedEntry?.name ?? 'o alimento'}`

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={title}
      subtitle={subtitle}
      onClose={handleClose}
      fullScreen
      scrollable={phase !== 'loading'}
      hideCloseButton={false}
    >
      {phase === 'pick' ? (
        <View style={styles.list}>
          {entries.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nenhum alimento para substituir</Text>
              <Text style={styles.emptyText}>
                Adicione sugestões nesta refeição antes de trocar itens.
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() => void handlePickEntry(entry)}
                style={({ pressed }) => [styles.pickCard, pressed && styles.cardPressed]}
              >
                <View style={styles.pickHeader}>
                  <View style={styles.pickTextCol}>
                    <Text style={styles.foodName}>{entry.name}</Text>
                    <Text style={styles.foodPortion}>{entry.portionLabel}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                </View>
                <EatWellFoodMacroSummary macros={entry.macros} />
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {phase === 'loading' ? (
        <Animated.View
          style={[
            styles.loadingWrap,
            {
              opacity: loadingOpacity,
              transform: [{ scale: loadingScale }],
            },
          ]}
        >
          <ActivityIndicator color="#a3e635" size="large" />
          <Text style={styles.loadingTitle}>Montando alternativas</Text>
          <Text style={styles.loadingText}>
            Encontrando opções com perfil nutricional parecido…
          </Text>
          {selectedEntry ? (
            <View style={styles.loadingPreview}>
              <Text style={styles.loadingPreviewName}>{selectedEntry.name}</Text>
              <EatWellFoodMacroSummary macros={selectedEntry.macros} compact />
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      {phase === 'options' ? (
        <View style={styles.list}>
          {options.map((option, index) => (
            <Pressable
              key={`${option.id}-${index}`}
              onPress={() => handleSelectOption(option)}
              style={({ pressed }) => [styles.optionCard, pressed && styles.cardPressed]}
            >
              <View style={styles.optionBadge}>
                <Text style={styles.optionBadgeText}>Opção {index + 1}</Text>
              </View>
              <Text style={styles.foodName}>{option.name}</Text>
              <Text style={styles.foodPortion}>{option.portionLabel}</Text>
              <EatWellFoodMacroSummary macros={option.macros} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  pickCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  optionCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    backgroundColor: 'rgba(132, 204, 22, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.18)',
  },
  cardPressed: {
    opacity: 0.9,
  },
  pickHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pickTextCol: {
    flex: 1,
    gap: 3,
  },
  foodName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  foodPortion: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  optionBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(132, 204, 22, 0.14)',
  },
  optionBadgeText: {
    color: '#d9f99d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
    gap: 10,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  loadingPreview: {
    marginTop: 12,
    width: '100%',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  loadingPreviewName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
})
