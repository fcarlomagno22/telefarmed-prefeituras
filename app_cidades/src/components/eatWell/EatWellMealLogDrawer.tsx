import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import foodAnimation from '../../../assets/food.json'
import successAnimation from '../../../assets/success.json'
import type {
  EatWellFoodUnit,
  EatWellMealBeverage,
  EatWellMealFeeling,
  EatWellMealLogFood,
  EatWellPortionSize,
  FoodEntry,
  MealLog,
  MealSlot,
} from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { formatCalories, formatGrams, computeMealBalanceScore, getBalanceTier } from '../../utils/eatWellNutritionStats'
import { getMealSlotConfig } from '../../utils/eatWellMealSlots'
import { playSuccessSound } from '../../utils/appSounds'
import { prepareMealPhotoSource } from '../../utils/eatWellMealPhotoImage'
import {
  buildMealEntries,
  computeWizardTotals,
  createEmptyFoodEntry,
  createManualFoodEntry,
  DRINK_ML_PRESETS,
  MEAL_FEELING_OPTIONS,
  mockIdentifyFoodsFromPhoto,
  PORTION_SIZE_OPTIONS,
} from '../../utils/eatWellMealLogWizard'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { EatWellMealLogTimeline } from './EatWellMealLogTimeline'
import { EatWellMealLogCameraCapture } from './mealLog/EatWellMealLogCameraCapture'
import { EatWellMealPhotoCropModal } from './mealLog/EatWellMealPhotoCropModal'
import { EatWellMealLogFoodItemCard } from './mealLog/EatWellMealLogFoodItemCard'
import { EatWellMealLogUnitSelect } from './mealLog/EatWellMealLogUnitSelect'
import { RunWalkHistoryAnimatedBar } from '../runWalk/history/RunWalkHistoryAnimatedBar'
import { RunWalkProgressRing } from '../runWalk/RunWalkProgressRing'

const MEAL_SUMMARY_MACROS: {
  label: string
  key: 'proteinG' | 'carbsG' | 'fatG' | 'fiberG' | 'sugarsG' | 'saturatedFatG'
  color: string
  target: number
  inverse?: boolean
}[] = [
  { label: 'Proteínas', key: 'proteinG', color: '#38bdf8', target: 28 },
  { label: 'Carboidratos', key: 'carbsG', color: '#fbbf24', target: 55 },
  { label: 'Gorduras', key: 'fatG', color: '#fb7185', target: 18 },
  { label: 'Fibras', key: 'fiberG', color: '#a3e635', target: 8 },
  { label: 'Açúcares', key: 'sugarsG', color: '#fb923c', target: 18, inverse: true },
  { label: 'Gord. saturadas', key: 'saturatedFatG', color: '#f87171', target: 7, inverse: true },
]

const MEAL_ESTIMATE_DISCLAIMER =
  'Valores estimados automaticamente a partir dos alimentos informados e podem variar para mais ou para menos. Use apenas como referência — não substitui avaliação de nutricionista ou médico.'

type MealLogInputMethod = 'camera' | 'gallery' | 'manual'

type EatWellMealLogDrawerProps = {
  visible: boolean
  slot: MealSlot | null
  initialMeal: MealLog | null
  onClose: () => void
  onFinish?: () => void
  onSave: (payload: {
    slot: MealSlot
    entries: FoodEntry[]
    mealId?: string
    photoUri?: string | null
    portionSize?: EatWellPortionSize
    feeling?: EatWellMealFeeling | null
    beverage?: EatWellMealBeverage | null
  }) => void
}

type StepOneView = 'method' | 'camera' | 'manual'

const METHOD_OPTIONS: {
  id: MealLogInputMethod
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  accent: string
}[] = [
  {
    id: 'camera',
    title: 'Tirar foto',
    subtitle: 'Fotografe o prato de cima',
    icon: 'camera-outline',
    accent: '#84cc16',
  },
  {
    id: 'gallery',
    title: 'Escolher da galeria',
    subtitle: 'Selecione uma foto existente',
    icon: 'images-outline',
    accent: '#38bdf8',
  },
  {
    id: 'manual',
    title: 'Descrever refeição',
    subtitle: 'Digite alimento, quantidade e medida',
    icon: 'create-outline',
    accent: '#fbbf24',
  },
]

const METHOD_STEP_FOOTER_HINT = 'Revise alimentos e porções antes de salvar.'

function mealToWizardFoods(meal: MealLog | null): EatWellMealLogFood[] {
  if (!meal) return []
  return meal.entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    quantity: 1,
    unit: 'unidade' as EatWellFoodUnit,
    macros: { ...entry.macros },
  }))
}

export function EatWellMealLogDrawer({
  visible,
  slot,
  initialMeal,
  onClose,
  onFinish,
  onSave,
}: EatWellMealLogDrawerProps) {
  const [step, setStep] = useState(1)
  const [stepOneView, setStepOneView] = useState<StepOneView>('method')
  const [inputMethod, setInputMethod] = useState<MealLogInputMethod | null>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [foods, setFoods] = useState<EatWellMealLogFood[]>([])
  const [portionSize, setPortionSize] = useState<EatWellPortionSize>('medium')
  const [beverage, setBeverage] = useState<EatWellMealBeverage>({ name: '', ml: 300 })
  const [feeling, setFeeling] = useState<EatWellMealFeeling | null>(null)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [pendingReturnStep, setPendingReturnStep] = useState<number | null>(null)

  const [manualName, setManualName] = useState('')
  const [manualQuantity, setManualQuantity] = useState('1')
  const [manualUnit, setManualUnit] = useState<EatWellFoodUnit>('unidade')
  const [drinkMlDraft, setDrinkMlDraft] = useState('300')

  const [photoCropVisible, setPhotoCropVisible] = useState(false)
  const [photoCropUri, setPhotoCropUri] = useState<string | null>(null)
  const [photoCropSize, setPhotoCropSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [isPreparingPhotoCrop, setIsPreparingPhotoCrop] = useState(false)
  const [pendingFocusFoodId, setPendingFocusFoodId] = useState<string | null>(null)
  const drawerScrollRef = useRef<ScrollView>(null)
  const foodsSectionMetrics = useRef({ y: 0, height: 0 })
  const successSoundPlayedRef = useRef(false)

  useEffect(() => {
    if (!visible) return

    if (initialMeal) {
      setStep(2)
      setStepOneView('method')
      setInputMethod('manual')
      setPhotoUri(initialMeal.photoUri ?? null)
      setFoods(mealToWizardFoods(initialMeal))
      setPortionSize(initialMeal.portionSize ?? 'medium')
      setBeverage(initialMeal.beverage ?? { name: '', ml: 300 })
      setFeeling(initialMeal.feeling ?? null)
    } else {
      setStep(1)
      setStepOneView('method')
      setInputMethod(null)
      setPhotoUri(null)
      setFoods([])
      setPortionSize('medium')
      setBeverage({ name: '', ml: 300 })
      setFeeling(null)
    }

    setManualName('')
    setManualQuantity('1')
    setManualUnit('unidade')
    setDrinkMlDraft('300')
    setIsIdentifying(false)
    setPendingReturnStep(null)
    setPhotoCropVisible(false)
    setPhotoCropUri(null)
    setPhotoCropSize(null)
    setIsPreparingPhotoCrop(false)
    setPendingFocusFoodId(null)
    successSoundPlayedRef.current = false
  }, [visible, initialMeal])

  const slotConfig = slot ? getMealSlotConfig(slot) : null
  const totals = useMemo(
    () => computeWizardTotals(foods, portionSize, beverage.name.trim() ? beverage : null),
    [foods, portionSize, beverage],
  )

  const mealBalance = useMemo(() => computeMealBalanceScore(totals), [totals])
  const mealBalanceTier = useMemo(() => getBalanceTier(mealBalance.score), [mealBalance.score])

  const showTimeline = stepOneView !== 'camera'

  async function handlePhotoReady(uri: string) {
    setPhotoUri(uri)
    setIsIdentifying(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    const identified = mockIdentifyFoodsFromPhoto()
    setFoods(identified)
    setIsIdentifying(false)
    setStepOneView('method')
    setStep(2)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  async function openPhotoCrop(uri: string, width?: number, height?: number) {
    setPhotoCropVisible(true)
    setIsPreparingPhotoCrop(true)
    setPhotoCropUri(null)
    setPhotoCropSize(null)

    try {
      const prepared = await prepareMealPhotoSource(uri, width, height)
      setPhotoCropUri(prepared.uri)
      setPhotoCropSize({ width: prepared.width, height: prepared.height })
    } catch {
      setPhotoCropVisible(false)
      Alert.alert('Erro', 'Não foi possível preparar a imagem. Tente novamente.')
    } finally {
      setIsPreparingPhotoCrop(false)
    }
  }

  async function handlePickGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos acessar sua galeria para escolher uma foto da refeição.',
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    })

    if (result.canceled || !result.assets[0]?.uri) return

    const asset = result.assets[0]
    setInputMethod('gallery')
    await openPhotoCrop(asset.uri, asset.width, asset.height)
  }

  function handlePhotoCropClose() {
    setPhotoCropVisible(false)
    setPhotoCropUri(null)
    setPhotoCropSize(null)
  }

  async function handlePhotoCropConfirm(uri: string) {
    setPhotoCropVisible(false)
    setPhotoCropUri(null)
    setPhotoCropSize(null)
    await handlePhotoReady(uri)
  }

  function handleMethodSelect(method: MealLogInputMethod) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setInputMethod(method)

    if (method === 'camera') {
      setStepOneView('camera')
      return
    }

    if (method === 'gallery') {
      void handlePickGallery()
      return
    }

    setStepOneView('manual')
  }

  function handleAddFood() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const entry = createEmptyFoodEntry()
    setPendingFocusFoodId(entry.id)
    setFoods((current) => [...current, entry])

    requestAnimationFrame(() => {
      setTimeout(() => {
        const { y, height } = foodsSectionMetrics.current
        if (height > 0) {
          drawerScrollRef.current?.scrollTo({
            y: Math.max(0, y + height - 220),
            animated: true,
          })
          return
        }
        drawerScrollRef.current?.scrollToEnd({ animated: true })
      }, 180)
    })
  }

  function handleAddManualFood() {
    const quantity = Number.parseFloat(manualQuantity.replace(',', '.'))
    if (!manualName.trim() || !Number.isFinite(quantity) || quantity <= 0) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setFoods((current) => [...current, createManualFoodEntry(manualName, quantity, manualUnit)])
    setManualName('')
    setManualQuantity('1')
  }

  function handleContinueFromManual() {
    if (foods.length === 0) return
    if (pendingReturnStep != null) {
      setStep(pendingReturnStep)
      setPendingReturnStep(null)
      setStepOneView('method')
      return
    }
    setStep(2)
  }

  function handleUpdateFood(updated: EatWellMealLogFood) {
    setFoods((current) => current.map((food) => (food.id === updated.id ? updated : food)))
  }

  function handleRemoveFood(foodId: string) {
    setFoods((current) => current.filter((food) => food.id !== foodId))
  }

  function handleContinueFromFoods() {
    const validFoods = foods.filter((food) => food.name.trim())
    if (validFoods.length === 0) return
    if (validFoods.length !== foods.length) {
      setFoods(validFoods)
    }
    setPendingFocusFoodId(null)
    setStep(3)
  }

  const validFoodCount = useMemo(
    () => foods.filter((food) => food.name.trim()).length,
    [foods],
  )

  function handleSkipDrink() {
    setBeverage({ name: '', ml: 0 })
    setStep(4)
  }

  function handleContinueFromDrink() {
    const ml = Number.parseInt(drinkMlDraft, 10)
    setBeverage({
      name: beverage.name,
      ml: Number.isFinite(ml) && ml > 0 ? ml : beverage.ml,
    })
    setStep(4)
  }

  function handleContinueFromSummary() {
    setStep(5)
  }

  function handleSave() {
    if (!slot || foods.length === 0 || step !== 5) return

    const finalBeverage = beverage.name.trim() && beverage.ml > 0 ? beverage : null
    const entries = buildMealEntries(foods, portionSize, finalBeverage)

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    if (!successSoundPlayedRef.current) {
      successSoundPlayedRef.current = true
      void playSuccessSound()
    }
    onSave({
      slot,
      entries,
      mealId: initialMeal?.id,
      photoUri,
      portionSize,
      feeling,
      beverage: finalBeverage,
    })
    setStep(6)
  }

  function handleFinishSuccess() {
    onFinish?.()
    onClose()
  }

  function handleBack() {
    if (step >= 6) return

    if (stepOneView === 'camera') {
      setStepOneView('method')
      return
    }

    if (stepOneView === 'manual') {
      if (pendingReturnStep != null) {
        setStep(pendingReturnStep)
        setPendingReturnStep(null)
        setStepOneView('method')
        return
      }
      setStepOneView('method')
      return
    }

    if (step > 1) {
      setStep((current) => current - 1)
    }
  }

  function renderStepOneMethod() {
    return (
      <>
        <LottiePlayer source={foodAnimation} style={styles.lottieWrap} animationStyle={styles.lottie} />
        <Text style={styles.stepTitle}>Como quer registrar?</Text>
        <Text style={styles.stepSubtitle}>
          Escolha a forma mais prática para montar sua refeição de {slotConfig?.label?.toLowerCase()}.
        </Text>

        <View style={styles.methodGrid}>
          {METHOD_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => handleMethodSelect(option.id)}
              style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
            >
              <LinearGradient
                colors={[`${option.accent}33`, `${option.accent}10`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.methodCardGradient}
              >
                <View style={[styles.methodIcon, { backgroundColor: `${option.accent}22` }]}>
                  <Ionicons name={option.icon} size={21} color={option.accent} />
                </View>
                <View style={styles.methodTextCol}>
                  <Text style={styles.methodTitle}>{option.title}</Text>
                  <Text style={styles.methodSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {isIdentifying ? (
          <View style={styles.identifyingRow}>
            <ActivityIndicator color="#84cc16" />
            <Text style={styles.identifyingText}>Identificando alimentos...</Text>
          </View>
        ) : null}
      </>
    )
  }

  function renderStepOneManual() {
    return (
      <>
        <Pressable onPress={handleBack} style={styles.inlineBack}>
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          <Text style={styles.inlineBackText}>Voltar</Text>
        </Pressable>

        <Text style={styles.stepTitle}>Descreva os alimentos</Text>
        <Text style={styles.stepSubtitle}>Informe o alimento, a quantidade e a medida.</Text>

        <View style={styles.manualForm}>
          <Text style={styles.fieldLabel}>Alimento</Text>
          <TextInput
            value={manualName}
            onChangeText={setManualName}
            placeholder="Ex.: arroz branco"
            placeholderTextColor={colors.textSubtle}
            style={styles.textInput}
          />

          <View style={styles.manualRow}>
            <View style={styles.manualQuantityCol}>
              <Text style={styles.fieldLabel}>Quantidade</Text>
              <TextInput
                value={manualQuantity}
                onChangeText={setManualQuantity}
                keyboardType="decimal-pad"
                placeholder="1"
                placeholderTextColor={colors.textSubtle}
                style={styles.textInput}
              />
            </View>
          </View>

          <EatWellMealLogUnitSelect value={manualUnit} onChange={setManualUnit} />

          <Pressable
            onPress={handleAddManualFood}
            disabled={!manualName.trim()}
            style={({ pressed }) => [
              styles.addFoodBtn,
              !manualName.trim() && styles.addFoodBtnDisabled,
              pressed && manualName.trim() && styles.addFoodBtnPressed,
            ]}
          >
            <Ionicons name="add-circle-outline" size={18} color="#0a0a0c" />
            <Text style={styles.addFoodBtnText}>Adicionar alimento</Text>
          </Pressable>
        </View>

        {foods.length > 0 ? (
          <View style={styles.addedList}>
            <Text style={styles.sectionTitle}>Adicionados ({foods.length})</Text>
            {foods.map((food) => (
              <EatWellMealLogFoodItemCard
                key={food.id}
                food={food}
                onUpdate={handleUpdateFood}
                onRemove={() => handleRemoveFood(food.id)}
              />
            ))}
          </View>
        ) : null}
      </>
    )
  }

  function renderStepTwoFoods() {
    return (
      <>
        {photoUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
          </View>
        ) : null}

        <Text style={styles.stepTitle}>Confirme os alimentos</Text>
        <Text style={styles.stepSubtitle}>
          Ajuste quantidade e unidade. Toque no número para editar.
        </Text>

        <View
          style={styles.foodsSection}
          onLayout={(event) => {
            foodsSectionMetrics.current = {
              y: event.nativeEvent.layout.y,
              height: event.nativeEvent.layout.height,
            }
          }}
        >
          <View style={styles.foodsList}>
            {foods.map((food) => (
              <EatWellMealLogFoodItemCard
                key={food.id}
                food={food}
                onUpdate={handleUpdateFood}
                onRemove={() => handleRemoveFood(food.id)}
                autoFocusName={food.id === pendingFocusFoodId}
              />
            ))}
          </View>

          <Pressable
            onPress={handleAddFood}
            style={({ pressed }) => [styles.secondaryOutlineBtn, pressed && styles.secondaryOutlineBtnPressed]}
          >
            <Ionicons name="add" size={16} color="#a3e635" />
            <Text style={styles.secondaryOutlineBtnText}>Adicionar alimento</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Tamanho da porção que você comeu</Text>
        <View style={styles.portionRow}>
          {PORTION_SIZE_OPTIONS.map((option) => {
            const selected = portionSize === option.id
            return (
              <Pressable
                key={option.id}
                onPress={() => setPortionSize(option.id)}
                style={({ pressed }) => [
                  styles.portionCard,
                  selected && styles.portionCardSelected,
                  pressed && styles.portionCardPressed,
                ]}
              >
                <Text style={[styles.portionLabel, selected && styles.portionLabelSelected]}>
                  {option.label}
                </Text>
                <Text
                  style={styles.portionSubtitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  {option.subtitle}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </>
    )
  }

  function renderStepThreeDrink() {
    return (
      <>
        <Text style={styles.stepTitle}>Bebida (opcional)</Text>
        <Text style={styles.stepSubtitle}>Registre o que você bebeu junto com a refeição.</Text>

        <View style={styles.manualForm}>
          <Text style={styles.fieldLabel}>Bebida</Text>
          <TextInput
            value={beverage.name}
            onChangeText={(text) => setBeverage((current) => ({ ...current, name: text }))}
            placeholder="Ex.: suco de laranja, água, refrigerante"
            placeholderTextColor={colors.textSubtle}
            style={styles.textInput}
          />

          <Text style={styles.fieldLabel}>Quantidade (ml)</Text>
          <View style={styles.presetRow}>
            {DRINK_ML_PRESETS.map((preset) => {
              const selected = beverage.ml === preset
              return (
                <Pressable
                  key={preset}
                  onPress={() => {
                    setBeverage((current) => ({ ...current, ml: preset }))
                    setDrinkMlDraft(String(preset))
                  }}
                  style={({ pressed }) => [
                    styles.presetChip,
                    selected && styles.presetChipSelected,
                    pressed && styles.presetChipPressed,
                  ]}
                >
                  <Text style={[styles.presetChipText, selected && styles.presetChipTextSelected]}>
                    {preset} ml
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <TextInput
            value={drinkMlDraft}
            onChangeText={(text) => {
              setDrinkMlDraft(text)
              const parsed = Number.parseInt(text, 10)
              if (Number.isFinite(parsed) && parsed > 0) {
                setBeverage((current) => ({ ...current, ml: parsed }))
              }
            }}
            keyboardType="number-pad"
            placeholder="Ou digite a quantidade"
            placeholderTextColor={colors.textSubtle}
            style={styles.textInput}
          />
        </View>
      </>
    )
  }

  function renderStepFourSummary() {
    const balanceRing = (
      <RunWalkProgressRing
        progress={mealBalance.score / 100}
        value={String(mealBalance.score)}
        label={mealBalanceTier.label}
        size={photoUri ? 104 : 92}
        stroke={6}
        gradientId="eat-well-meal-balance-ring"
        gradientColors={mealBalanceTier.gradientColors}
        animate
        countTo={mealBalance.score}
      />
    )

    return (
      <>
        {photoUri ? (
          <View style={styles.summaryPhotoWrap}>
            <Image source={{ uri: photoUri }} style={styles.summaryPhoto} contentFit="cover" />
            <LinearGradient
              colors={['rgba(3,3,8,0.08)', 'rgba(3,3,8,0.55)', 'rgba(3,3,8,0.88)']}
              locations={[0, 0.45, 1]}
              style={styles.summaryPhotoGradient}
            />
            <View style={styles.summaryScoreCenter}>
              <Text style={styles.summaryScoreEyebrow}>Equilíbrio do prato</Text>
              {balanceRing}
            </View>
            <View style={styles.summaryPhotoFooter}>
              <Text style={styles.summaryCalories}>{formatCalories(totals.calories)}</Text>
              <Text style={styles.summaryCaloriesLabel}>Estimativa calórica</Text>
            </View>
          </View>
        ) : (
          <View style={styles.summaryHero}>
            <Text style={styles.summaryScoreEyebrowDark}>Equilíbrio do prato</Text>
            {balanceRing}
            <Text style={styles.summaryCaloriesDark}>{formatCalories(totals.calories)}</Text>
            <Text style={styles.summaryCaloriesLabelDark}>Estimativa calórica</Text>
          </View>
        )}

        <Text style={styles.stepTitle}>Estimativa da refeição</Text>
        <Text style={styles.stepSubtitle}>Macronutrientes identificados com base nos alimentos.</Text>

        <View style={styles.macroGrid}>
          {MEAL_SUMMARY_MACROS.map((macro) => {
            const value = totals[macro.key]
            const progress = macro.inverse
              ? Math.max(0, 1 - Math.min(value / macro.target, 1))
              : Math.min(value / macro.target, 1)

            return (
              <View key={macro.label} style={styles.macroCard}>
                <View style={styles.macroCardHeader}>
                  <Text style={styles.macroCardLabel}>{macro.label}</Text>
                  <Text style={styles.macroCardValue}>{formatGrams(value)}</Text>
                </View>
                <RunWalkHistoryAnimatedBar
                  progress={progress}
                  animate
                  color={macro.color}
                  trackStyle={styles.macroBarTrack}
                  fillStyle={styles.macroBarFill}
                />
              </View>
            )
          })}
        </View>

        <View style={styles.estimateDisclaimer}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textSubtle} />
          <Text style={styles.estimateDisclaimerText}>{MEAL_ESTIMATE_DISCLAIMER}</Text>
        </View>
      </>
    )
  }

  function renderStepFiveFeeling() {
    return (
      <>
        <Text style={styles.stepTitle}>Como você se sentiu?</Text>
        <Text style={styles.stepSubtitle}>Opcional — ajuda a entender seu padrão após comer.</Text>

        <View style={styles.feelingGrid}>
          {MEAL_FEELING_OPTIONS.map((option) => {
            const selected = feeling === option.id
            return (
              <Pressable
                key={option.id}
                onPress={() => setFeeling(option.id)}
                style={({ pressed }) => [
                  styles.feelingCard,
                  selected && styles.feelingCardSelected,
                  pressed && styles.feelingCardPressed,
                ]}
              >
                <Text style={styles.feelingEmoji}>{option.emoji}</Text>
                <Text style={[styles.feelingLabel, selected && styles.feelingLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </>
    )
  }

  function renderStepSixSuccess() {
    const mealLabel = slotConfig?.label?.toLowerCase() ?? 'refeição'

    return (
      <View style={styles.successWrap}>
        <LottiePlayer
          source={successAnimation}
          loop={false}
          style={styles.successLottieWrap}
          animationStyle={styles.successLottie}
        />
        <Text style={styles.successTitle}>Refeição registrada!</Text>
        <Text style={styles.successMessage}>
          Sua {mealLabel} foi salva com sucesso · {formatCalories(totals.calories)} estimadas.
        </Text>
        {feeling ? (
          <View style={styles.successBadge}>
            <Text style={styles.successBadgeText}>
              Sensação: {MEAL_FEELING_OPTIONS.find((option) => option.id === feeling)?.label}
            </Text>
          </View>
        ) : null}
      </View>
    )
  }

  function renderStepContent() {
    if (step === 1 && stepOneView === 'camera') {
      return (
        <EatWellMealLogCameraCapture
          onCapture={(uri, width, height) => {
            setInputMethod('camera')
            void openPhotoCrop(uri, width, height)
          }}
          onBack={() => setStepOneView('method')}
        />
      )
    }

    if (step === 1 && stepOneView === 'manual') return renderStepOneManual()
    if (step === 1) return renderStepOneMethod()
    if (step === 2) return renderStepTwoFoods()
    if (step === 3) return renderStepThreeDrink()
    if (step === 4) return renderStepFourSummary()
    if (step === 5) return renderStepFiveFeeling()
    return renderStepSixSuccess()
  }

  function renderMethodStepFooter() {
    const showSuggestedTime = slotConfig?.suggestedTime && slotConfig.suggestedTime !== '—'
    const hint = showSuggestedTime
      ? `Sugerido às ${slotConfig?.suggestedTime}. ${METHOD_STEP_FOOTER_HINT}`
      : METHOD_STEP_FOOTER_HINT

    return (
      <View style={styles.methodFooter}>
        <Text style={styles.methodFooterHint}>{hint}</Text>
      </View>
    )
  }

  function renderFooter() {
    if (step === 1 && stepOneView === 'camera') return null

    if (step === 1 && stepOneView === 'manual') {
      return (
        <PrimaryButton
          label="Continuar"
          onPress={handleContinueFromManual}
          disabled={foods.length === 0}
        />
      )
    }

    if (step === 1 && stepOneView === 'method') {
      return renderMethodStepFooter()
    }

    if (step === 1) return null

    if (step === 2) {
      return (
        <PrimaryButton
          label="Continuar"
          onPress={handleContinueFromFoods}
          disabled={validFoodCount === 0}
        />
      )
    }

    if (step === 3) {
      return (
        <View style={styles.footerStack}>
          <PrimaryButton
            label={beverage.name.trim() ? 'Continuar' : 'Pular bebida'}
            onPress={beverage.name.trim() ? handleContinueFromDrink : handleSkipDrink}
          />
        </View>
      )
    }

    if (step === 4) {
      return <PrimaryButton label="Continuar" onPress={handleContinueFromSummary} />
    }

    if (step === 5) {
      return (
        <Pressable
          onPress={handleSave}
          disabled={!slot || foods.length === 0}
          style={({ pressed }) => [
            styles.saveBtn,
            (!slot || foods.length === 0) && styles.saveBtnDisabled,
            pressed && foods.length > 0 && styles.saveBtnPressed,
          ]}
        >
          <Text style={styles.saveBtnText}>Salvar · {formatCalories(totals.calories)}</Text>
        </Pressable>
      )
    }

    if (step === 6) {
      return <PrimaryButton label="Concluir" onPress={handleFinishSuccess} />
    }

    return null
  }

  const isCameraFullscreen = step === 1 && stepOneView === 'camera'

  return (
    <>
      <RunWalkSheetDrawer
        visible={visible}
        title={initialMeal ? 'Editar refeição' : 'Registrar refeição'}
        subtitle={isCameraFullscreen ? undefined : slotConfig?.label}
        onClose={onClose}
        fullScreen
        keyboardAware
        scrollable={!isCameraFullscreen && step !== 6}
        hideCloseButton={isCameraFullscreen}
        footer={renderFooter()}
        scrollViewRef={drawerScrollRef}
      >
        {showTimeline && !isCameraFullscreen ? (
          <View style={styles.timelineBlock}>
            {step > 1 && step < 6 ? (
              <Pressable onPress={handleBack} style={styles.stepBackBtn}>
                <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                <Text style={styles.stepBackText}>Voltar</Text>
              </Pressable>
            ) : null}
            <EatWellMealLogTimeline currentStep={step} />
          </View>
        ) : null}

        {renderStepContent()}
      </RunWalkSheetDrawer>

      <EatWellMealPhotoCropModal
        visible={photoCropVisible}
        imageUri={photoCropUri}
        initialSize={photoCropSize}
        isPreparing={isPreparingPhotoCrop}
        onClose={handlePhotoCropClose}
        onConfirm={(uri) => void handlePhotoCropConfirm(uri)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  timelineBlock: {
    gap: 4,
  },
  stepBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  stepBackText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  lottieWrap: {
    marginBottom: 4,
  },
  lottie: {
    width: 160,
    height: 120,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 4,
  },
  methodGrid: {
    gap: 10,
    marginTop: 4,
  },
  methodCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  methodCardPressed: {
    opacity: 0.92,
  },
  methodCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    gap: 13,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextCol: {
    flex: 1,
    gap: 2,
  },
  methodTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  methodSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  methodFooter: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  methodFooterHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
  identifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  identifyingText: {
    color: '#a3e635',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  inlineBackText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  manualForm: {
    gap: 10,
    marginTop: 4,
  },
  fieldLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  textInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualQuantityCol: {
    flex: 1,
    gap: 6,
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#84cc16',
  },
  addFoodBtnDisabled: {
    opacity: 0.45,
  },
  addFoodBtnPressed: {
    opacity: 0.92,
  },
  addFoodBtnText: {
    color: '#0a0a0c',
    fontSize: 14,
    fontWeight: '900',
  },
  addedList: {
    gap: 10,
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  photoPreviewWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.2)',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  foodsSection: {
    gap: 10,
  },
  foodsList: {
    gap: 10,
  },
  secondaryOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.28)',
    backgroundColor: 'rgba(132, 204, 22, 0.08)',
  },
  secondaryOutlineBtnPressed: {
    opacity: 0.88,
  },
  secondaryOutlineBtnText: {
    color: '#a3e635',
    fontSize: 13,
    fontWeight: '800',
  },
  portionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  portionCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  portionCardSelected: {
    backgroundColor: 'rgba(132, 204, 22, 0.14)',
    borderColor: 'rgba(163, 230, 53, 0.45)',
  },
  portionCardPressed: {
    opacity: 0.9,
  },
  portionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  portionLabelSelected: {
    color: '#d9f99d',
  },
  portionSubtitle: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 11,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  presetChipSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
  },
  presetChipPressed: {
    opacity: 0.88,
  },
  presetChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  presetChipTextSelected: {
    color: '#7dd3fc',
  },
  summaryPhotoWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.22)',
  },
  summaryPhoto: {
    width: '100%',
    height: '100%',
  },
  summaryPhotoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryScoreCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  summaryScoreEyebrow: {
    color: '#ecfccb',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  summaryPhotoFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 2,
  },
  summaryHero: {
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.22)',
  },
  summaryScoreEyebrowDark: {
    color: '#a3e635',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryCalories: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  summaryCaloriesDark: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  summaryCaloriesLabel: {
    color: '#d9f99d',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  summaryCaloriesLabelDark: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  macroGrid: {
    gap: 10,
  },
  macroCard: {
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroCardLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  macroCardValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  macroBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  macroBarFill: {
    borderRadius: 999,
  },
  estimateDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  estimateDisclaimerText: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  feelingCard: {
    width: '47%',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  feelingCardSelected: {
    backgroundColor: 'rgba(132, 204, 22, 0.14)',
    borderColor: 'rgba(163, 230, 53, 0.45)',
  },
  feelingCardPressed: {
    opacity: 0.9,
  },
  feelingEmoji: {
    fontSize: 28,
  },
  feelingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  feelingLabelSelected: {
    color: '#d9f99d',
  },
  footerStack: {
    gap: 8,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#84cc16',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnPressed: {
    opacity: 0.92,
  },
  saveBtnText: {
    color: '#0a0a0c',
    fontSize: 14,
    fontWeight: '900',
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
    minHeight: 340,
    gap: 10,
  },
  successLottieWrap: {
    marginBottom: 4,
  },
  successLottie: {
    width: 160,
    height: 160,
  },
  successTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  successBadge: {
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.25)',
  },
  successBadgeText: {
    color: '#a3e635',
    fontSize: 12,
    fontWeight: '700',
  },
})
