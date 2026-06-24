import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'

const STEPS = [
  { id: 1, title: 'O que funcionou', subtitle: 'Celebrar o que deu certo' },
  { id: 2, title: 'O que travou', subtitle: 'Sem julgamento' },
  { id: 3, title: 'Ajuste da semana', subtitle: 'O que mudar na rotina' },
] as const

type MyRoutineWeeklyReviewDrawerProps = {
  visible: boolean
  onClose: () => void
  onComplete: (payload: { workedWell: string; blocked: string; adjustment: string }) => void
}

export function MyRoutineWeeklyReviewDrawer({
  visible,
  onClose,
  onComplete,
}: MyRoutineWeeklyReviewDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [step, setStep] = useState(1)
  const [workedWell, setWorkedWell] = useState('')
  const [blocked, setBlocked] = useState('')
  const [adjustment, setAdjustment] = useState('')

  useEffect(() => {
    if (!visible) {
      setStep(1)
      setWorkedWell('')
      setBlocked('')
      setAdjustment('')
    }
  }, [visible])

  const current = STEPS[step - 1] ?? STEPS[0]

  function handleContinue() {
    if (step < STEPS.length) {
      setStep((value) => value + 1)
      return
    }
    onComplete({
      workedWell: workedWell.trim(),
      blocked: blocked.trim(),
      adjustment: adjustment.trim(),
    })
  }

  const canContinue =
    step === 1 ? workedWell.trim().length > 0 : step === 2 ? blocked.trim().length > 0 : adjustment.trim().length > 0

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Revisão de 5 min"
      subtitle={`Passo ${step}/3 · ${current.title}`}
      onClose={onClose}
      fullScreen
      hideCloseButton
      footer={
        <PrimaryButton
          label={step >= STEPS.length ? 'Concluir revisão' : 'Continuar'}
          disabled={!canContinue}
          onPress={handleContinue}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => (step > 1 ? setStep(step - 1) : onClose())} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.progressRow}>
          {STEPS.map((item) => (
            <View key={item.id} style={[styles.dot, item.id <= step && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.question}>{current.subtitle}</Text>

      {step === 1 ? (
        <TextInput
          value={workedWell}
          onChangeText={setWorkedWell}
          placeholder="Ex.: consegui caminhar 3 dias, dormi melhor..."
          placeholderTextColor={colors.textSubtle}
          multiline
          textAlignVertical="top"
          style={styles.input}
          selectionColor={ACCENT}
        />
      ) : null}

      {step === 2 ? (
        <TextInput
          value={blocked}
          onChangeText={setBlocked}
          placeholder="Ex.: reuniões longas, cansaço, falta de tempo..."
          placeholderTextColor={colors.textSubtle}
          multiline
          textAlignVertical="top"
          style={styles.input}
          selectionColor={ACCENT}
        />
      ) : null}

      {step === 3 ? (
        <>
          <TextInput
            value={adjustment}
            onChangeText={setAdjustment}
            placeholder="Ex.: quero menos tarefas, foco no essencial..."
            placeholderTextColor={colors.textSubtle}
            multiline
            textAlignVertical="top"
            style={styles.input}
            selectionColor={ACCENT}
          />
          <View style={styles.hintCard}>
            <Ionicons name="information-circle-outline" size={16} color={ACCENT_LIGHT} />
            <Text style={styles.hintText}>
              Se você pedir menos ou algo mais simples, o plano pode simplificar automaticamente.
            </Text>
          </View>
        </>
      ) : null}
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 28,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotActive: { backgroundColor: ACCENT },
  question: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  input: {
    minHeight: 120,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  hintCard: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.2)',
  },
  hintText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  footerBtn: { marginTop: 0 },
}
}

