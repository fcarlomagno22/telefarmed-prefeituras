import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { CrisisRecoveryMode } from '../../utils/mentalHealthCrisis'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MentalHealthCrisisRecoveryDrawerProps = {
  visible: boolean
  mode?: CrisisRecoveryMode
  onClose: () => void
  onConfirm: () => void
  onOpenCrisisSupport: () => void
}

export function MentalHealthCrisisRecoveryDrawer({
  visible,
  mode = 'standard',
  onClose,
  onConfirm,
  onOpenCrisisSupport,
}: MentalHealthCrisisRecoveryDrawerProps) {
  const guarded = mode === 'guarded'

  const footer = (
    <View style={styles.footer}>
      <PrimaryButton
        label={guarded ? 'Estou seguro(a), refazer perguntas' : 'Refazer perguntas'}
        onPress={onConfirm}
      />
      <Pressable
        onPress={onOpenCrisisSupport}
        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Ainda preciso de apoio"
      >
        <Text style={styles.secondaryBtnText}>Ainda preciso de apoio</Text>
      </Pressable>
      {!guarded ? (
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.tertiaryBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <Text style={styles.tertiaryBtnText}>Agora não</Text>
        </Pressable>
      ) : null}
    </View>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={guarded ? 'Retomar com segurança' : 'Que bom!'}
      subtitle="Retomar seus cuidados"
      onClose={onClose}
      footer={footer}
    >
      <View style={[styles.heroIcon, guarded && styles.heroIconGuarded]}>
        <Ionicons
          name={guarded ? 'shield-checkmark-outline' : 'sunny-outline'}
          size={26}
          color={guarded ? '#fda4af' : '#86efac'}
        />
      </View>

      <Text style={styles.lead}>
        {guarded
          ? 'Quer retomar os cuidados no seu ritmo?'
          : 'Ficamos felizes em saber que você está se sentindo melhor.'}
      </Text>

      <Text style={styles.body}>
        {guarded
          ? 'Se você se sente melhor e seguro(a) agora, vamos refazer as perguntas iniciais para entender seu momento atual. Se algo indicar que ainda é preciso de apoio imediato, pausamos de novo e mostramos as opções de ajuda.'
          : 'Para retomar seus cuidados com segurança, vamos refazer as perguntas iniciais. Isso nos ajuda a entender seu momento atual e montar atividades adequadas para você.'}
      </Text>

      <View style={[styles.noteCard, guarded && styles.noteCardGuarded]}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={guarded ? '#fda4af' : '#86efac'}
        />
        <Text style={[styles.noteText, guarded && styles.noteTextGuarded]}>
          {guarded
            ? 'Se ainda houver qualquer risco ou sensação de perigo, prefira as opções de apoio antes de continuar.'
            : 'Se o desconforto voltar a qualquer momento, você pode ver as opções de apoio novamente.'}
        </Text>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.28)',
    marginBottom: 4,
  },
  heroIconGuarded: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.28)',
  },
  lead: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(134, 239, 172, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.2)',
    marginTop: 4,
  },
  noteCardGuarded: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.22)',
  },
  noteText: {
    flex: 1,
    color: '#bbf7d0',
    fontSize: 13,
    lineHeight: 19,
  },
  noteTextGuarded: {
    color: '#fecaca',
  },
  footer: {
    gap: 8,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#fda4af',
    fontSize: 14,
    fontWeight: '600',
  },
  tertiaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  tertiaryBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.88,
  },
})
