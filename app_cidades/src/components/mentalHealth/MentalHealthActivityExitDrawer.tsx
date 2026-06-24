import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type ExitDrawerVariant = 'exit' | 'support'

type MentalHealthActivityExitDrawerProps = {
  visible: boolean
  variant: ExitDrawerVariant
  onContinue: () => void
  onConfirm: () => void
}

const COPY: Record<
  ExitDrawerVariant,
  { title: string; subtitle: string; confirmLabel: string; continueLabel: string }
> = {
  exit: {
    title: 'Sair da atividade?',
    subtitle: 'Você pode retomar depois pelo seu plano de cuidados de hoje.',
    confirmLabel: 'Sair da atividade',
    continueLabel: 'Continuar atividade',
  },
  support: {
    title: 'Parar e buscar apoio',
    subtitle: 'Vamos pausar esta atividade. Se precisar, você pode ver opções de apoio agora.',
    confirmLabel: 'Ver opções de apoio',
    continueLabel: 'Continuar atividade',
  },
}

export function MentalHealthActivityExitDrawer({
  visible,
  variant,
  onContinue,
  onConfirm,
}: MentalHealthActivityExitDrawerProps) {
  const copy = COPY[variant]

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={copy.title}
      subtitle={copy.subtitle}
      onClose={onContinue}
      scrollable={false}
      dense
      footer={
        <View style={styles.footer}>
          <PrimaryButton label={copy.confirmLabel} onPress={onConfirm} />
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={copy.continueLabel}
          >
            <Text style={styles.continueBtnText}>{copy.continueLabel}</Text>
          </Pressable>
        </View>
      }
    >
      <View />
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  footer: {
    gap: 10,
  },
  continueBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 14,
  },
  continueBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
  },
})
