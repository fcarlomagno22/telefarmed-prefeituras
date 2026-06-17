import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { EatWellFoodUnit, EatWellMealLogFood } from '../../../types/eatWell'
import { formatCalories } from '../../../utils/eatWellNutritionStats'
import { refreshFoodEntryFromName } from '../../../utils/eatWellMealLogWizard'
import { EatWellMealLogUnitSelect } from './EatWellMealLogUnitSelect'
import { colors } from '../../../theme/colors'

type EatWellMealLogFoodItemCardProps = {
  food: EatWellMealLogFood
  onUpdate: (food: EatWellMealLogFood) => void
  onRemove: () => void
  autoFocusName?: boolean
}

function parseQuantity(value: string) {
  const normalized = value.replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function EatWellMealLogFoodItemCard({
  food,
  onUpdate,
  onRemove,
  autoFocusName = false,
}: EatWellMealLogFoodItemCardProps) {
  const isDraft = !food.name.trim()
  const [isEditingName, setIsEditingName] = useState(isDraft)
  const [nameDraft, setNameDraft] = useState(food.name)
  const [quantityDraft, setQuantityDraft] = useState(String(food.quantity))
  const nameInputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!autoFocusName) return
    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 220)
    return () => clearTimeout(timer)
  }, [autoFocusName, food.id])

  useEffect(() => {
    setNameDraft(food.name)
    setQuantityDraft(String(food.quantity))
    if (!food.name.trim()) {
      setIsEditingName(true)
    }
  }, [food.id, food.name, food.quantity])

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed) {
      onUpdate(refreshFoodEntryFromName(food, trimmed))
      setNameDraft(trimmed)
    } else {
      setNameDraft(food.name)
    }
    setIsEditingName(!trimmed)
  }

  function commitQuantity() {
    const parsed = parseQuantity(quantityDraft)
    if (parsed != null) {
      const factor = parsed / food.quantity
      onUpdate({
        ...food,
        quantity: parsed,
        macros: {
          calories: Math.round(food.macros.calories * factor),
          proteinG: Math.round(food.macros.proteinG * factor * 10) / 10,
          carbsG: Math.round(food.macros.carbsG * factor * 10) / 10,
          fatG: Math.round(food.macros.fatG * factor * 10) / 10,
          fiberG: Math.round(food.macros.fiberG * factor * 10) / 10,
          sugarsG: Math.round(food.macros.sugarsG * factor * 10) / 10,
          saturatedFatG: Math.round(food.macros.saturatedFatG * factor * 10) / 10,
        },
      })
      setQuantityDraft(String(parsed))
      return
    }
    setQuantityDraft(String(food.quantity))
  }

  function handleUnitChange(unit: EatWellFoodUnit) {
    onUpdate({ ...food, unit })
  }

  const showNameInput = isDraft || isEditingName

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {showNameInput ? (
          <TextInput
            ref={nameInputRef}
            value={nameDraft}
            onChangeText={setNameDraft}
            onBlur={commitName}
            onSubmitEditing={commitName}
            placeholder="Nome do alimento"
            placeholderTextColor={colors.textSubtle}
            style={styles.nameInput}
          />
        ) : (
          <Text style={styles.name} numberOfLines={2}>
            {food.name}
          </Text>
        )}

        <View style={styles.actions}>
          {!isDraft ? (
            <Pressable
              onPress={() => {
                setNameDraft(food.name)
                setIsEditingName(true)
              }}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            >
              <Ionicons name="create-outline" size={16} color="#a3e635" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onRemove}
            style={({ pressed }) => [styles.iconBtn, styles.iconBtnDanger, pressed && styles.iconBtnPressed]}
          >
            <Ionicons name="trash-outline" size={16} color="#fca5a5" />
          </Pressable>
        </View>
      </View>

      <View style={styles.quantityRow}>
        <Text style={styles.quantityLabel}>Quantidade</Text>
        <TextInput
          value={quantityDraft}
          onChangeText={setQuantityDraft}
          onBlur={commitQuantity}
          onSubmitEditing={commitQuantity}
          keyboardType="decimal-pad"
          style={styles.quantityInput}
        />
      </View>

      <EatWellMealLogUnitSelect value={food.unit} onChange={handleUnitChange} compact />

      <Text style={styles.calories}>
        {food.name.trim() ? formatCalories(food.macros.calories) : '—'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.14)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  nameInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 230, 53, 0.35)',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
  },
  iconBtnDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  iconBtnPressed: {
    opacity: 0.85,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
  },
  quantityInput: {
    minWidth: 72,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    textAlign: 'center',
  },
  calories: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '800',
    alignSelf: 'flex-end',
  },
})
