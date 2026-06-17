import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { MealLog } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import {
  formatCalories,
  formatGrams,
  sumMealMacros,
} from '../../utils/eatWellNutritionStats'
import { formatMealTime, getMealSlotConfig } from '../../utils/eatWellMealSlots'
import {
  getMealFeelingEmoji,
  getMealFeelingLabel,
  getMealFoodEntries,
  getPortionSizeLabel,
} from '../../utils/eatWellMealLogWizard'
import { RunWalkHistoryAnimatedBar } from '../runWalk/history/RunWalkHistoryAnimatedBar'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type EatWellMealDetailDrawerProps = {
  visible: boolean
  meal: MealLog | null
  onClose: () => void
  onEdit: (meal: MealLog) => void
  onDelete: (mealId: string) => void
}

function InfoChip({
  icon,
  label,
  accent = '#a3e635',
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  accent?: string
}) {
  return (
    <View style={[styles.chip, { borderColor: `${accent}44`, backgroundColor: `${accent}14` }]}>
      <Ionicons name={icon} size={13} color={accent} />
      <Text style={[styles.chipText, { color: accent }]}>{label}</Text>
    </View>
  )
}

export function EatWellMealDetailDrawer({
  visible,
  meal,
  onClose,
  onEdit,
  onDelete,
}: EatWellMealDetailDrawerProps) {
  if (!meal) return null

  const currentMeal = meal
  const slotConfig = getMealSlotConfig(currentMeal.slot)
  const totals = sumMealMacros(currentMeal)
  const foodEntries = getMealFoodEntries(currentMeal)
  const timeLabel = formatMealTime(currentMeal.loggedAt, slotConfig.suggestedTime)

  function handleEdit() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onEdit(currentMeal)
  }

  function handleDelete() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onDelete(currentMeal.id)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={slotConfig.label}
      subtitle={timeLabel}
      onClose={onClose}
      scrollable
      footer={
        <View style={styles.footer}>
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [styles.footerBtn, pressed && styles.footerBtnPressed]}
          >
            <Ionicons name="create-outline" size={16} color={colors.text} />
            <Text style={styles.footerBtnText}>Editar</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.footerBtn,
              styles.footerBtnDanger,
              pressed && styles.footerBtnPressed,
            ]}
          >
            <Ionicons name="trash-outline" size={16} color="#fca5a5" />
            <Text style={styles.footerBtnTextDanger}>Excluir</Text>
          </Pressable>
        </View>
      }
    >
      {currentMeal.photoUri ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: currentMeal.photoUri }} style={styles.photo} contentFit="cover" />
          <LinearGradient
            colors={['rgba(3,3,8,0.08)', 'rgba(3,3,8,0.82)']}
            style={styles.photoGradient}
          />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoCalories}>{formatCalories(totals.calories)}</Text>
            <Text style={styles.photoMeta}>Estimativa total da refeição</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <View style={[styles.slotIcon, { backgroundColor: `${slotConfig.color}22` }]}>
          <MaterialCommunityIcons name={slotConfig.icon} size={18} color={slotConfig.color} />
        </View>
        <View style={styles.metaTextCol}>
          <Text style={styles.metaTitle}>{slotConfig.label}</Text>
          <Text style={styles.metaSubtitle}>Registrado às {timeLabel}</Text>
        </View>
      </View>

      <View style={styles.chipsRow}>
        {currentMeal.portionSize ? (
          <InfoChip
            icon="resize-outline"
            label={`Porção ${getPortionSizeLabel(currentMeal.portionSize).toLowerCase()}`}
          />
        ) : null}
        {currentMeal.feeling ? (
          <InfoChip
            icon="happy-outline"
            label={`${getMealFeelingEmoji(currentMeal.feeling)} ${getMealFeelingLabel(currentMeal.feeling)}`}
            accent="#fbbf24"
          />
        ) : null}
      </View>

      {currentMeal.beverage?.name.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bebida</Text>
          <View style={styles.beverageCard}>
            <Ionicons name="water-outline" size={18} color="#7dd3fc" />
            <View style={styles.beverageTextCol}>
              <Text style={styles.beverageName}>{currentMeal.beverage.name}</Text>
              <Text style={styles.beverageMeta}>{currentMeal.beverage.ml} ml</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alimentos ({foodEntries.length})</Text>
        <View style={styles.entriesList}>
          {foodEntries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryTextCol}>
                <Text style={styles.entryName}>{entry.name}</Text>
                <Text style={styles.entryPortion}>{entry.portionLabel}</Text>
              </View>
              <Text style={styles.entryCalories}>{formatCalories(entry.macros.calories)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Macronutrientes</Text>
        <View style={styles.macroGrid}>
          {[
            { label: 'Proteínas', value: totals.proteinG, color: '#38bdf8', target: 30 },
            { label: 'Carboidratos', value: totals.carbsG, color: '#fbbf24', target: 60 },
            { label: 'Gorduras', value: totals.fatG, color: '#fb7185', target: 20 },
            { label: 'Fibras', value: totals.fiberG, color: '#a3e635', target: 10 },
          ].map((macro) => (
            <View key={macro.label} style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>{macro.label}</Text>
                <Text style={styles.macroValue}>{formatGrams(macro.value)}</Text>
              </View>
              <RunWalkHistoryAnimatedBar
                progress={Math.min(macro.value / macro.target, 1)}
                animate={visible}
                color={macro.color}
                trackStyle={styles.macroTrack}
              />
            </View>
          ))}
        </View>

        <View style={styles.extraMacros}>
          <Text style={styles.extraMacroItem}>Açúcares {formatGrams(totals.sugarsG)}</Text>
          <Text style={styles.extraMacroItem}>Gord. sat. {formatGrams(totals.saturatedFatG)}</Text>
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  photoWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.2)',
    marginBottom: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  photoOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    gap: 2,
  },
  photoCalories: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  photoMeta: {
    color: '#d9f99d',
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTextCol: {
    flex: 1,
    gap: 2,
  },
  metaTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metaSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  beverageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
  beverageTextCol: {
    flex: 1,
    gap: 2,
  },
  beverageName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  beverageMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  entriesList: {
    gap: 8,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  entryTextCol: {
    flex: 1,
    gap: 2,
  },
  entryName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  entryPortion: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  entryCalories: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '800',
  },
  macroGrid: {
    gap: 8,
  },
  macroCard: {
    borderRadius: 12,
    padding: 10,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  macroValue: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  macroTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  extraMacros: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  extraMacroItem: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  footerBtnDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.18)',
  },
  footerBtnPressed: {
    opacity: 0.88,
  },
  footerBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  footerBtnTextDanger: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '800',
  },
})
