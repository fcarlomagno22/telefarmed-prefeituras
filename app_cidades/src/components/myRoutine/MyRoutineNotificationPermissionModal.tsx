import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { AppModal } from '../AppModal'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const PALETTE = ACTION_ICON_PALETTES.myRoutine
const ACCENT_LIGHT = '#f0abfc'

type MyRoutineNotificationPermissionModalProps = {
  visible: boolean
  onAcknowledge: () => void
  onDismiss: () => void
}

const REMINDER_ITEMS = [
  {
    icon: 'sunny-outline' as const,
    title: 'Bloco da manhã',
    description: 'Um toque leve para começar o dia com os essenciais.',
  },
  {
    icon: 'notifications-outline' as const,
    title: 'Tarefas do dia',
    description: 'Lembretes quando você adia ou agenda algo importante.',
  },
  {
    icon: 'calendar-outline' as const,
    title: 'Revisão de domingo',
    description: 'Convite de 5 minutos para ajustar a semana seguinte.',
  },
] as const

export function MyRoutineNotificationPermissionModal({
  visible,
  onAcknowledge,
  onDismiss,
}: MyRoutineNotificationPermissionModalProps) {
  const styles = useThemedStyles(createStyles)
  return (
    <AppModal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={[
            'rgba(217, 70, 239, 0.22)',
            'rgba(240, 171, 252, 0.08)',
            'rgba(10, 10, 12, 0.92)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View style={styles.cardInner}>
            <View style={styles.iconWrap}>
              <LinearGradient colors={[...PALETTE.iconGradient]} style={styles.iconGradient}>
                <Ionicons name="notifications-outline" size={28} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Lembretes da sua rotina</Text>
            <Text style={styles.subtitle}>
              Por enquanto guardamos suas preferências no app. Quando as notificações nativas
              estiverem disponíveis, usaremos estes lembretes:
            </Text>

            <View style={styles.list}>
              {REMINDER_ITEMS.map((item) => (
                <View key={item.title} style={styles.listRow}>
                  <View style={styles.listIcon}>
                    <Ionicons name={item.icon} size={18} color={ACCENT_LIGHT} />
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={styles.listTitle}>{item.title}</Text>
                    <Text style={styles.listDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.footnote}>
              Você pode desativar tudo a qualquer momento em Perfil → Preferências.
            </Text>

            <PrimaryButton label="Entendi" onPress={onAcknowledge} style={styles.primaryBtn} />

            <Pressable onPress={onDismiss} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Agora não</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </AppModal>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  cardBorder: {
    width: '100%',
    borderRadius: 22,
    padding: 1,
  },
  cardInner: {
    borderRadius: 21,
    padding: 20,
    gap: 12,
    backgroundColor: 'rgba(22, 16, 28, 0.98)',
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  list: {
    gap: 10,
    marginTop: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.18)',
  },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 70, 239, 0.14)',
  },
  listCopy: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  listDescription: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  footnote: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 4,
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
}
}

