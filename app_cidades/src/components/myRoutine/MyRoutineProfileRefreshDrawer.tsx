import { StyleSheet, Text, View } from 'react-native'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type MyRoutineProfileRefreshDrawerProps = {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
}

export function MyRoutineProfileRefreshDrawer({
  visible,
  onClose,
  onConfirm,
}: MyRoutineProfileRefreshDrawerProps) {
  const styles = useThemedStyles(createStyles)
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Refazer onboarding parcial"
      subtitle="Atualize contexto, horários e rotina ideal"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Continuar para onboarding"
          onPress={() => {
            onConfirm()
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.body}>
          Você voltará aos passos de configuração (contexto, rotina atual e ideal). Seu histórico
          diário e preferências serão mantidos.
        </Text>
        <View style={styles.list}>
          <Bullet text="Horários de acordar e dormir" />
          <Bullet text="Contexto de vida e rotina atual" />
          <Bullet text="Rotina ideal e template" />
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

function Bullet({ text }: { text: string }) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 14 },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  list: { gap: 8 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f0abfc',
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  footerBtn: { marginTop: 4 },
}
}

