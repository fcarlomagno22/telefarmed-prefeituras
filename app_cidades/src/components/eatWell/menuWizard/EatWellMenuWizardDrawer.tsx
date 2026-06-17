import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import type { AnimationObject } from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import babyAnimation from '../../../../assets/baby.json'
import beerAnimation from '../../../../assets/beer.json'
import capsuleAnimation from '../../../../assets/Capsule.json'
import dietAnimation from '../../../../assets/diet.json'
import loadAnimation from '../../../../assets/load.json'
import peanutAllergyAnimation from '../../../../assets/peanut_allergy.json'
import plateAnimation from '../../../../assets/plate.json'
import pizzaAnimation from '../../../../assets/pizza.json'
import pooAnimation from '../../../../assets/poo.json'
import stethoscopeAnimation from '../../../../assets/stethoscope.json'
import stressAnimation from '../../../../assets/stress.json'
import successAnimation from '../../../../assets/success.json'
import { colors } from '../../../theme/colors'
import { playSuccessSound } from '../../../utils/appSounds'
import {
  createEmptyMenuWizardForm,
  getMenuWizardTimelineStep,
  isMenuWizardStepValid,
  maskHeightMetersInput,
  maskWeightKgInput,
  MENU_ACTIVITY_OPTIONS,
  MENU_BOWEL_OPTIONS,
  MENU_DISEASE_OPTIONS,
  MENU_DIETARY_PREFERENCE_OPTIONS,
  MENU_FREQUENCY_OPTIONS,
  MENU_INTOLERANCE_OPTIONS,
  MENU_PREVIOUS_DIET_OPTIONS,
  MENU_WIZARD_LOADING_MS,
  MENU_WIZARD_STEP_META,
  toggleStringList,
  type EatWellMenuWizardForm,
  type EatWellFrequency,
} from '../../../utils/eatWellMenuWizard'
import { stripLottieBackground } from '../../../utils/eatWellMenuLottie'
import { LottiePlayer } from '../../LottiePlayer'
import { RunWalkSheetDrawer } from '../../runWalk/RunWalkSheetDrawer'
import { EatWellMenuWizardTimeline } from './EatWellMenuWizardTimeline'
import { EatWellObjectiveChipRow } from './EatWellObjectiveChipRow'
import { EatWellLevelSlider } from './EatWellLevelSlider'
import { EatWellWizardSelectChips } from './EatWellWizardSelectChips'

const WIZARD_LOTTIES = {
  stethoscope: stripLottieBackground(stethoscopeAnimation),
  capsule: stripLottieBackground(capsuleAnimation),
  plate: stripLottieBackground(plateAnimation),
  pizza: stripLottieBackground(pizzaAnimation),
  beer: stripLottieBackground(beerAnimation),
  baby: stripLottieBackground(babyAnimation),
  stress: stripLottieBackground(stressAnimation),
  poo: stripLottieBackground(pooAnimation),
  diet: stripLottieBackground(dietAnimation),
  peanut: stripLottieBackground(peanutAllergyAnimation),
}

type WizardPhase = 'steps' | 'loading' | 'success'

type EatWellMenuWizardDrawerProps = {
  visible: boolean
  onClose: () => void
  onComplete?: (form: EatWellMenuWizardForm) => void
}

const ACCURACY_DECLARATION_LINES = [
  {
    text: 'Declaro que todas as informações fornecidas neste questionário são verdadeiras, completas e atualizadas, conforme meu conhecimento.',
    emphasis: true,
  },
  {
    text: 'Estou ciente de que dados incorretos, omitidos ou desatualizados podem comprometer a qualidade e a segurança das orientações geradas.',
  },
  {
    text: 'O cardápio é produzido automaticamente com base exclusivamente nas informações declaradas por mim e tem caráter orientativo.',
  },
  {
    text: 'Este serviço não substitui consulta, diagnóstico, prescrição ou acompanhamento por profissionais de saúde habilitados.',
    emphasis: true,
  },
  {
    text: 'A plataforma não se responsabiliza por decisões, condutas ou resultados decorrentes do uso das sugestões sem validação profissional adequada.',
  },
]

const MEDICAL_DISCLAIMER_LINES = [
  {
    text: 'Este cardápio NÃO substitui acompanhamento médico ou nutricional profissional.',
    emphasis: true,
  },
  {
    text: 'As informações fornecidas são apenas orientações gerais e não devem ser consideradas como diagnóstico, tratamento ou prescrição médica.',
  },
  {
    text: '🚫 Limitação para doenças graves',
    emphasis: true,
  },
  {
    text: 'Este sistema não é recomendado para pacientes com doenças graves, condições médicas complexas ou que necessitam de acompanhamento especializado.',
  },
  {
    text: 'Recomendação: Consulte sempre um profissional de saúde qualificado antes de iniciar qualquer mudança significativa na sua alimentação.',
  },
]

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (next: boolean) => void
}) {
  return (
    <View style={styles.yesNoRow}>
      {(['Sim', 'Não'] as const).map((label, index) => {
        const boolValue = index === 0
        const selected = value === boolValue

        return (
          <Pressable
            key={label}
            onPress={() => {
              void Haptics.selectionAsync()
              onChange(boolValue)
            }}
            style={({ pressed }) => [
              styles.yesNoBtn,
              selected && styles.yesNoBtnSelected,
              pressed && styles.yesNoBtnPressed,
            ]}
          >
            <Text style={[styles.yesNoText, selected && styles.yesNoTextSelected]}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync()
        onToggle()
      }}
      style={({ pressed }) => [styles.checkRow, pressed && styles.checkRowPressed]}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxChecked]}>
        {checked ? <Ionicons name="checkmark" size={14} color="#0a0a0c" /> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  )
}

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {optional ? <Text style={styles.optionalTag}>Opcional</Text> : null}
    </View>
  )
}

function StepLottie({
  source,
  size = 'default',
}: {
  source: AnimationObject
  size?: 'default' | 'large'
}) {
  return (
    <LottiePlayer
      source={source}
      style={styles.stepLottieWrap}
      animationStyle={size === 'large' ? styles.stepLottieLarge : styles.stepLottie}
    />
  )
}

export function EatWellMenuWizardDrawer({
  visible,
  onClose,
  onComplete,
}: EatWellMenuWizardDrawerProps) {
  const [phase, setPhase] = useState<WizardPhase>('steps')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<EatWellMenuWizardForm>(() => createEmptyMenuWizardForm())
  const [loadingProgress, setLoadingProgress] = useState(0)
  const successSoundPlayedRef = useRef(false)
  const formSnapshotRef = useRef(form)
  formSnapshotRef.current = form

  function patchForm(patch: Partial<EatWellMenuWizardForm>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function resetWizard() {
    setPhase('steps')
    setStep(1)
    setForm(createEmptyMenuWizardForm())
    setLoadingProgress(0)
    successSoundPlayedRef.current = false
  }

  useEffect(() => {
    if (!visible) {
      resetWizard()
    }
  }, [visible])

  useEffect(() => {
    if (phase !== 'loading') return

    const startedAt = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt
      const progress = Math.min(100, (elapsed / MENU_WIZARD_LOADING_MS) * 100)
      setLoadingProgress(progress)

      if (elapsed >= MENU_WIZARD_LOADING_MS) {
        clearInterval(timer)
        setPhase('success')
      }
    }, 80)

    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'success' || successSoundPlayedRef.current) return
    successSoundPlayedRef.current = true
    void playSuccessSound()
  }, [phase])

  function handleClose() {
    resetWizard()
    onClose()
  }

  function handleBack() {
    if (step <= 1) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setStep((current) => current - 1)
  }

  function handleContinue() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setStep((current) => current + 1)
  }

  function handleGenerate() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setPhase('loading')
    setLoadingProgress(0)
  }

  function handleFinishSuccess() {
    onComplete?.(formSnapshotRef.current)
    handleClose()
  }

  function renderDisclaimer() {
    return (
      <View style={styles.disclaimerWrap}>
        {MEDICAL_DISCLAIMER_LINES.map((line, index) => (
          <View key={`${index}-${line.text.slice(0, 12)}`} style={styles.disclaimerLine}>
            {line.emphasis ? <View style={styles.disclaimerAccent} /> : null}
            <Text style={[styles.disclaimerText, line.emphasis && styles.disclaimerTextEmphasis]}>
              {line.text}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  function renderBasicData() {
    return (
      <View style={styles.formStack}>
        <View style={styles.fieldBlock}>
          <FieldLabel label="Nome do cardápio" />
          <TextInput
            value={form.menuName}
            onChangeText={(menuName) => patchForm({ menuName })}
            placeholder="Ex: Almoço da semana"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldBlock, styles.fieldHalf]}>
            <FieldLabel label="Altura (m)" />
            <TextInput
              value={form.heightMeters}
              onChangeText={(raw) => patchForm({ heightMeters: maskHeightMetersInput(raw) })}
              placeholder="1,72"
              placeholderTextColor={colors.textSubtle}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={[styles.fieldBlock, styles.fieldHalf]}>
            <FieldLabel label="Peso (kg)" />
            <TextInput
              value={form.weightKg}
              onChangeText={(raw) => patchForm({ weightKg: maskWeightKgInput(raw) })}
              placeholder="78,5"
              placeholderTextColor={colors.textSubtle}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <FieldLabel label="Objetivo" />
          <EatWellObjectiveChipRow
            selected={form.objective}
            onSelect={(objective) =>
              patchForm({
                objective: form.objective === objective ? null : objective,
              })
            }
          />
        </View>

        <View style={styles.fieldBlock}>
          <FieldLabel label="Nível de atividade física" />
          <View style={styles.activityList}>
            {MENU_ACTIVITY_OPTIONS.map((option) => {
              const selected = form.activityLevel === option.id
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    void Haptics.selectionAsync()
                    patchForm({ activityLevel: option.id })
                  }}
                  style={({ pressed }) => [
                    styles.activityRow,
                    selected && styles.activityRowSelected,
                    pressed && styles.activityRowPressed,
                  ]}
                >
                  <View style={[styles.activityDot, selected && styles.activityDotSelected]} />
                  <View style={styles.activityCopy}>
                    <Text style={[styles.activityLabel, selected && styles.activityLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.activityHint}>{option.hint}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>
    )
  }

  function renderDiseases() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.stethoscope} />
        <EatWellWizardSelectChips
          options={MENU_DISEASE_OPTIONS}
          selected={form.diseases}
          onToggle={(value) =>
            patchForm({
              diseases: toggleStringList(form.diseases, value),
              noKnownDiseases: false,
            })
          }
        />
        <TextInput
          value={form.otherDiseases}
          onChangeText={(otherDiseases) =>
            patchForm({ otherDiseases, noKnownDiseases: false })
          }
          placeholder="Outras doenças ou condições"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
        />
        <CheckRow
          label="Não possuo doenças ou condições de saúde conhecidas"
          checked={form.noKnownDiseases}
          onToggle={() =>
            patchForm({
              noKnownDiseases: !form.noKnownDiseases,
              diseases: !form.noKnownDiseases ? [] : form.diseases,
              otherDiseases: !form.noKnownDiseases ? '' : form.otherDiseases,
            })
          }
        />
      </View>
    )
  }

  function renderMedications() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.capsule} size="large" />
        <TextInput
          value={form.medications}
          onChangeText={(medications) => patchForm({ medications, noRegularMedications: false })}
          placeholder="Ex: losartana, metformina"
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, styles.textArea]}
          multiline
        />
        <CheckRow
          label="Não faço uso de medicamentos regularmente"
          checked={form.noRegularMedications}
          onToggle={() =>
            patchForm({
              noRegularMedications: !form.noRegularMedications,
              medications: !form.noRegularMedications ? '' : form.medications,
            })
          }
        />
      </View>
    )
  }

  function renderIntolerances() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.peanut} />
        <EatWellWizardSelectChips
          options={MENU_INTOLERANCE_OPTIONS}
          selected={form.intolerances}
          onToggle={(value) =>
            patchForm({
              intolerances: toggleStringList(form.intolerances, value),
              noKnownIntolerances: false,
            })
          }
        />
        <TextInput
          value={form.otherIntolerances}
          onChangeText={(otherIntolerances) =>
            patchForm({ otherIntolerances, noKnownIntolerances: false })
          }
          placeholder="Outras intolerâncias ou alergias"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
        />
        <CheckRow
          label="Desconheço qualquer intolerância alimentar"
          checked={form.noKnownIntolerances}
          onToggle={() =>
            patchForm({
              noKnownIntolerances: !form.noKnownIntolerances,
              intolerances: !form.noKnownIntolerances ? [] : form.intolerances,
              otherIntolerances: !form.noKnownIntolerances ? '' : form.otherIntolerances,
            })
          }
        />
      </View>
    )
  }

  function renderPreferences() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.plate} />
        <EatWellWizardSelectChips
          options={MENU_DIETARY_PREFERENCE_OPTIONS}
          selected={form.dietaryPreferences}
          onToggle={(value) =>
            patchForm({ dietaryPreferences: toggleStringList(form.dietaryPreferences, value) })
          }
        />
        <TextInput
          value={form.likedFoods}
          onChangeText={(likedFoods) => patchForm({ likedFoods })}
          placeholder="Alimentos que você gosta muito"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
        />
        <TextInput
          value={form.avoidedFoods}
          onChangeText={(avoidedFoods) => patchForm({ avoidedFoods })}
          placeholder="Alimentos que você evita"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
        />
      </View>
    )
  }

  function renderHunger() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.pizza} />
        <FieldLabel label="Nível de fome" optional />
        <EatWellLevelSlider
          value={form.hungerLevel}
          minLabel="Pouca fome"
          maxLabel="Muita fome"
          onChange={(hungerLevel) => patchForm({ hungerLevel })}
        />
        <FieldLabel label="Episódios de compulsão alimentar" />
        <YesNoToggle
          value={form.hasCompulsion}
          onChange={(hasCompulsion) =>
            patchForm({
              hasCompulsion,
              compulsionFrequency: hasCompulsion ? form.compulsionFrequency : null,
            })
          }
        />
        {form.hasCompulsion ? (
          <EatWellWizardSelectChips
            options={MENU_FREQUENCY_OPTIONS}
            selected={form.compulsionFrequency ? [form.compulsionFrequency] : []}
            onToggle={(id) =>
              patchForm({
                compulsionFrequency:
                  form.compulsionFrequency === id ? null : (id as EatWellFrequency),
              })
            }
          />
        ) : null}
      </View>
    )
  }

  function renderAlcohol() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.beer} />
        <FieldLabel label="Você consome álcool?" />
        <YesNoToggle
          value={form.consumesAlcohol}
          onChange={(consumesAlcohol) =>
            patchForm({
              consumesAlcohol,
              alcoholFrequency: consumesAlcohol ? form.alcoholFrequency : null,
              alcoholQuantity: consumesAlcohol ? form.alcoholQuantity : '',
            })
          }
        />
        {form.consumesAlcohol ? (
          <>
            <EatWellWizardSelectChips
              options={MENU_FREQUENCY_OPTIONS}
              selected={form.alcoholFrequency ? [form.alcoholFrequency] : []}
              onToggle={(id) =>
                patchForm({
                  alcoholFrequency:
                    form.alcoholFrequency === id ? null : (id as EatWellFrequency),
                })
              }
            />
            <TextInput
              value={form.alcoholQuantity}
              onChangeText={(alcoholQuantity) => patchForm({ alcoholQuantity })}
              placeholder="Quantidade aproximada"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
          </>
        ) : null}
      </View>
    )
  }

  function renderSleep() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.baby} />
        <FieldLabel label="Horas de sono por noite" optional />
        <TextInput
          value={form.sleepHours}
          onChangeText={(sleepHours) =>
            patchForm({ sleepHours: sleepHours.replace(/\D/g, '').slice(0, 2) })
          }
          placeholder="Ex: 7"
          placeholderTextColor={colors.textSubtle}
          keyboardType="number-pad"
          style={styles.input}
        />
        <FieldLabel label="Qualidade do sono" optional />
        <EatWellLevelSlider
          value={form.sleepQuality}
          minLabel="Ruim"
          maxLabel="Excelente"
          onChange={(sleepQuality) => patchForm({ sleepQuality })}
        />
      </View>
    )
  }

  function renderStress() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.stress} />
        <FieldLabel label="Nível de estresse" optional />
        <EatWellLevelSlider
          value={form.stressLevel}
          minLabel="Baixo"
          maxLabel="Muito alto"
          onChange={(stressLevel) => patchForm({ stressLevel })}
        />
        <TextInput
          value={form.stressCauses}
          onChangeText={(stressCauses) => patchForm({ stressCauses })}
          placeholder="Causas de estresse"
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </View>
    )
  }

  function renderBowel() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.poo} />
        <EatWellWizardSelectChips
          options={MENU_BOWEL_OPTIONS}
          selected={form.bowelFrequency ? [form.bowelFrequency] : []}
          onToggle={(id) =>
            patchForm({
              bowelFrequency:
                form.bowelFrequency === id
                  ? null
                  : (id as EatWellMenuWizardForm['bowelFrequency']),
            })
          }
        />
      </View>
    )
  }

  function renderDiets() {
    return (
      <View style={styles.formStack}>
        <StepLottie source={WIZARD_LOTTIES.diet} />
        <EatWellWizardSelectChips
          options={MENU_PREVIOUS_DIET_OPTIONS}
          selected={form.previousDiets}
          onToggle={(value) =>
            patchForm({
              previousDiets: toggleStringList(form.previousDiets, value),
              neverTriedDiets: false,
            })
          }
        />
        <CheckRow
          label="Nunca tentei dietas anteriores"
          checked={form.neverTriedDiets}
          onToggle={() =>
            patchForm({
              neverTriedDiets: !form.neverTriedDiets,
              previousDiets: !form.neverTriedDiets ? [] : form.previousDiets,
            })
          }
        />
      </View>
    )
  }

  function renderAccuracyDeclaration() {
    return (
      <View style={styles.formStack}>
        <View style={styles.disclaimerWrap}>
          {ACCURACY_DECLARATION_LINES.map((line, index) => (
            <View key={`${index}-${line.text.slice(0, 12)}`} style={styles.disclaimerLine}>
              {line.emphasis ? <View style={styles.disclaimerAccent} /> : null}
              <Text style={[styles.disclaimerText, line.emphasis && styles.disclaimerTextEmphasis]}>
                {line.text}
              </Text>
            </View>
          ))}
        </View>
        <CheckRow
          label="Li, compreendi e confirmo a veracidade das informações prestadas"
          checked={form.informationAccuracyConfirmed}
          onToggle={() =>
            patchForm({
              informationAccuracyConfirmed: !form.informationAccuracyConfirmed,
            })
          }
        />
      </View>
    )
  }

  function renderLoading() {
    const gradientProgress = loadingProgress / 100

    return (
      <View style={styles.loadingWrap}>
        <LottiePlayer
          source={loadAnimation}
          style={styles.loadingLottieWrap}
          animationStyle={styles.loadingLottie}
        />
        <Text style={styles.loadingTitle}>Gerando seu cardápio</Text>
        <Text style={styles.loadingSubtitle}>
          Analisando suas respostas e montando sugestões personalizadas…
        </Text>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#fbbf24', '#84cc16', '#22c55e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${loadingProgress}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>{Math.round(loadingProgress)}%</Text>
        <View style={styles.progressLegend}>
          <Text style={[styles.progressLegendText, { opacity: 1 - gradientProgress * 0.3 }]}>
            Preparando
          </Text>
          <Text style={[styles.progressLegendText, { opacity: 0.4 + gradientProgress * 0.6 }]}>
            Quase lá
          </Text>
        </View>
      </View>
    )
  }

  function renderSuccess() {
    return (
      <View style={styles.successWrap}>
        <LottiePlayer
          source={successAnimation}
          loop={false}
          style={styles.successLottieWrap}
          animationStyle={styles.successLottie}
        />
        <Text style={styles.successTitle}>Cardápio criado com sucesso!</Text>
        <Text style={styles.successMessage}>
          Seu cardápio personalizado foi gerado e já está disponível em Meus Cardápios.
        </Text>
      </View>
    )
  }

  function renderStepContent() {
    switch (step) {
      case 1:
        return renderDisclaimer()
      case 2:
        return renderBasicData()
      case 3:
        return renderDiseases()
      case 4:
        return renderMedications()
      case 5:
        return renderIntolerances()
      case 6:
        return renderHunger()
      case 7:
        return renderAlcohol()
      case 8:
        return renderSleep()
      case 9:
        return renderStress()
      case 10:
        return renderBowel()
      case 11:
        return renderDiets()
      case 12:
        return renderAccuracyDeclaration()
      default:
        return null
    }
  }

  function renderFooter() {
    if (phase === 'loading') return null

    if (phase === 'success') {
      return (
        <Pressable
          onPress={handleFinishSuccess}
          style={({ pressed }) => [styles.greenBtn, pressed && styles.greenBtnPressed]}
        >
          <View style={styles.greenBtnInner}>
            <Text style={styles.greenBtnText}>Concluir</Text>
          </View>
        </Pressable>
      )
    }

    const canContinue = isMenuWizardStepValid(step, form)

    if (step === 1) {
      return (
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.greenBtn, pressed && styles.greenBtnPressed]}
        >
          <View style={styles.greenBtnInner}>
            <Text style={styles.greenBtnText}>Li e concordo</Text>
          </View>
        </Pressable>
      )
    }

    if (step === 12) {
      return (
        <View style={styles.footerRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          >
            <Text style={styles.backBtnText}>Voltar</Text>
          </Pressable>
          <Pressable
            onPress={handleGenerate}
            disabled={!canContinue}
            style={({ pressed }) => [
              styles.greenBtn,
              styles.greenBtnFlex,
              !canContinue && styles.greenBtnDisabled,
              pressed && canContinue && styles.greenBtnPressed,
            ]}
          >
            <LinearGradient
              colors={['#bef264', '#84cc16', '#4d7c0f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.greenBtnInner}
            >
              <Text style={styles.greenBtnText}>Gerar cardápio</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )
    }

    if (step === 11) {
      return (
        <View style={styles.footerRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          >
            <Text style={styles.backBtnText}>Voltar</Text>
          </Pressable>
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            style={({ pressed }) => [
              styles.greenBtn,
              styles.greenBtnFlex,
              !canContinue && styles.greenBtnDisabled,
              pressed && canContinue && styles.greenBtnPressed,
            ]}
          >
            <View style={styles.greenBtnInner}>
              <Text style={styles.greenBtnText}>Continuar</Text>
            </View>
          </Pressable>
        </View>
      )
    }

    return (
      <View style={styles.footerRow}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.greenBtn,
            styles.greenBtnFlex,
            !canContinue && styles.greenBtnDisabled,
            pressed && canContinue && styles.greenBtnPressed,
          ]}
        >
          <View style={styles.greenBtnInner}>
            <Text style={styles.greenBtnText}>Continuar</Text>
          </View>
        </Pressable>
      </View>
    )
  }

  const stepMeta = MENU_WIZARD_STEP_META[step]
  const timelineStep = getMenuWizardTimelineStep(step)
  const showTimeline = phase === 'steps'
  const drawerTitle =
    phase === 'loading'
      ? 'Gerando cardápio'
      : phase === 'success'
        ? 'Pronto!'
        : stepMeta?.title ?? 'Novo cardápio'
  const drawerSubtitle =
    phase === 'loading'
      ? 'Aguarde um instante'
      : phase === 'success'
        ? 'Tudo certo por aqui'
        : stepMeta?.subtitle

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={drawerTitle}
      subtitle={drawerSubtitle}
      onClose={handleClose}
      fullScreen
      keyboardAware
      scrollable={phase !== 'loading'}
      footer={renderFooter()}
    >
      {showTimeline ? (
        <View style={styles.timelineBlock}>
          <EatWellMenuWizardTimeline currentStep={timelineStep} />
        </View>
      ) : null}

      {phase === 'loading' ? renderLoading() : phase === 'success' ? renderSuccess() : renderStepContent()}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  timelineBlock: {
    marginBottom: 4,
  },
  disclaimerWrap: {
    gap: 18,
    paddingTop: 4,
  },
  disclaimerLine: {
    flexDirection: 'row',
    gap: 10,
  },
  disclaimerAccent: {
    width: 2,
    borderRadius: 999,
    backgroundColor: '#a3e635',
    marginTop: 3,
  },
  disclaimerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  disclaimerTextEmphasis: {
    color: colors.text,
    fontWeight: '700',
  },
  formStack: {
    gap: 16,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  optionalTag: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  activityList: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  activityRowSelected: {
    borderColor: 'rgba(132, 204, 22, 0.45)',
    backgroundColor: 'rgba(132, 204, 22, 0.08)',
  },
  activityRowPressed: {
    opacity: 0.86,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  activityDotSelected: {
    borderColor: '#84cc16',
    backgroundColor: '#84cc16',
  },
  activityCopy: {
    flex: 1,
    gap: 2,
  },
  activityLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  activityLabelSelected: {
    color: '#d9f99d',
  },
  activityHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  yesNoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  yesNoBtnSelected: {
    borderColor: 'rgba(132, 204, 22, 0.5)',
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
  },
  yesNoBtnPressed: {
    opacity: 0.86,
  },
  yesNoText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  yesNoTextSelected: {
    color: '#d9f99d',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkRowPressed: {
    opacity: 0.86,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  checkBoxChecked: {
    borderColor: '#84cc16',
    backgroundColor: '#84cc16',
  },
  checkLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  stepLottieWrap: {
    marginBottom: 0,
  },
  stepLottie: {
    width: 140,
    height: 110,
  },
  stepLottieLarge: {
    width: 168,
    height: 132,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingTop: 12,
    gap: 12,
  },
  loadingLottieWrap: {
    marginBottom: 0,
  },
  loadingLottie: {
    width: 180,
    height: 150,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  loadingSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    color: '#d9f99d',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  progressLegend: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLegendText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  successWrap: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 10,
  },
  successLottieWrap: {
    marginBottom: 0,
  },
  successLottie: {
    width: 180,
    height: 150,
  },
  successTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backBtn: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  backBtnPressed: {
    opacity: 0.86,
  },
  backBtnText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  greenBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#84cc16',
  },
  greenBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  greenBtnFlex: {
    flex: 1.4,
  },
  greenBtnPressed: {
    opacity: 0.9,
  },
  greenBtnDisabled: {
    opacity: 0.45,
  },
  greenBtnText: {
    color: '#0a0a0c',
    fontSize: 15,
    fontWeight: '800',
  },
})
