import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import successAnimation from '../../../assets/success.json'
import { menuSupportConfig } from '../../config/menuSupport'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../theme/colors'
import { openWhatsAppMessage } from '../../utils/runWalkLocationShare'
import {
  formatScreenLabel,
  sendSupportRequest,
  SUPPORT_TOPICS,
  type SupportContactPreference,
  type SupportTopicId,
} from '../../utils/supportRequest'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MenuSupportDrawerProps = {
  visible: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
  userPhone?: string
}

type SupportStep = 'form' | 'success'

const CONTACT_OPTIONS: {
  id: SupportContactPreference
  label: string
  icon: keyof typeof Ionicons.glyphMap
  hint: string
}[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    hint: 'Resposta mais rápida',
  },
  {
    id: 'email',
    label: 'E-mail',
    icon: 'mail-outline',
    hint: menuSupportConfig.email,
  },
  {
    id: 'phone',
    label: 'Telefone',
    icon: 'call-outline',
    hint: menuSupportConfig.phone || 'Ligação',
  },
]

export function MenuSupportDrawer({
  visible,
  onClose,
  userName,
  userEmail,
  userPhone,
}: MenuSupportDrawerProps) {
  const { screen, user } = useAuth()
  const [step, setStep] = useState<SupportStep>('form')
  const [topic, setTopic] = useState<SupportTopicId>('appointments')
  const [message, setMessage] = useState('')
  const [contactPreference, setContactPreference] = useState<SupportContactPreference>('whatsapp')
  const [isSending, setIsSending] = useState(false)
  const [successChannel, setSuccessChannel] = useState<SupportContactPreference>('email')

  const resolvedName = userName ?? user?.name
  const resolvedEmail = userEmail ?? user?.email
  const resolvedPhone = userPhone ?? user?.phone

  useEffect(() => {
    if (!visible) return

    setStep('form')
    setTopic('appointments')
    setMessage('')
    setContactPreference(menuSupportConfig.whatsApp ? 'whatsapp' : 'email')
    setSuccessChannel('email')
  }, [visible])

  function resetForm() {
    setStep('form')
    setTopic('appointments')
    setMessage('')
    setContactPreference(menuSupportConfig.whatsApp ? 'whatsapp' : 'email')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSuccessClose() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    handleClose()
  }

  async function handleQuickWhatsApp() {
    if (!menuSupportConfig.whatsApp) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await openWhatsAppMessage(
      menuSupportConfig.whatsApp,
      `Olá! Preciso de ajuda com o app Telefarmed ${menuSupportConfig.municipalityName}.`,
    )
  }

  async function handleQuickCall() {
    if (!menuSupportConfig.phone) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const digits = menuSupportConfig.phone.replace(/\D/g, '')
    await Linking.openURL(`tel:${digits}`)
  }

  async function handleSubmit() {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await sendSupportRequest({
        topic,
        message,
        contactPreference,
        screenName: screen ? formatScreenLabel(screen) : undefined,
        userName: resolvedName,
        userEmail: resolvedEmail,
        userPhone: resolvedPhone,
      })

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSuccessChannel(contactPreference)
      setStep('success')
    } catch (error) {
      if (error instanceof Error && error.message === 'cancelled') return

      Alert.alert(
        'Não foi possível abrir o pedido',
        'Tente outro canal de contato ou fale conosco pelo WhatsApp.',
      )
    } finally {
      setIsSending(false)
    }
  }

  const successCopy =
    successChannel === 'whatsapp'
      ? 'Abrimos o WhatsApp com sua mensagem. É só enviar — nossa equipe responde o quanto antes.'
      : successChannel === 'phone'
        ? `Ligue para ${menuSupportConfig.phone} se ainda não conectou. Estamos prontos para ajudar.`
        : 'Se abriu o e-mail, toque em enviar. Recebemos seu pedido e vamos retornar em breve.'

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={step === 'success' ? 'Pedido enviado' : 'Falar com suporte'}
      subtitle={
        step === 'success'
          ? 'Estamos com você'
          : 'Conte o que aconteceu — vamos te ajudar'
      }
      onClose={step === 'success' ? handleSuccessClose : handleClose}
      fullScreen
      scrollable
      keyboardAware
      hideCloseButton={step === 'success'}
      footer={
        step === 'success' ? (
          <PrimaryButton label="Fechar" onPress={handleSuccessClose} />
        ) : (
          <PrimaryButton
            label="Abrir pedido de suporte"
            onPress={() => void handleSubmit()}
            loading={isSending}
            disabled={!message.trim()}
          />
        )
      }
    >
      {step === 'success' ? (
        <View style={styles.successWrap}>
          <LottiePlayer source={successAnimation} loop={false} style={styles.successLottie} />
          <Text style={styles.successTitle}>Recebemos seu pedido</Text>
          <Text style={styles.successMessage}>
            Sabemos que imprevistos acontecem. Nossa equipe vai ler sua mensagem com atenção e fazer
            o possível para resolver o mais rápido possível.
          </Text>
          <Text style={styles.successHint}>{successCopy}</Text>
        </View>
      ) : (
        <>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(255, 133, 51, 0.2)', 'rgba(255, 107, 0, 0.06)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroIconWrap}>
              <Ionicons name="headset" size={22} color={colors.primaryLight} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Como podemos ajudar?</Text>
              <Text style={styles.heroText}>
                Dúvidas, algo que não funcionou ou precisa de uma mão — abra um pedido e escolha como
                prefere ser atendido.
              </Text>
            </View>
          </View>

          <View style={styles.emergencyCard}>
            <Ionicons name="medical-outline" size={18} color="#fca5a5" />
            <Text style={styles.emergencyText}>
              Para emergência médica, ligue <Text style={styles.emergencyStrong}>192 (SAMU)</Text>.
              Este suporte é para o app e o programa de saúde.
            </Text>
          </View>

          {(menuSupportConfig.whatsApp || menuSupportConfig.phone) && (
            <View style={styles.quickRow}>
              {menuSupportConfig.whatsApp ? (
                <Pressable
                  onPress={() => void handleQuickWhatsApp()}
                  style={({ pressed }) => [styles.quickBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="WhatsApp rápido"
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#86efac" />
                  <Text style={styles.quickBtnText}>WhatsApp agora</Text>
                </Pressable>
              ) : null}

              {menuSupportConfig.phone ? (
                <Pressable
                  onPress={() => void handleQuickCall()}
                  style={({ pressed }) => [styles.quickBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Ligar agora"
                >
                  <Ionicons name="call-outline" size={18} color={colors.primaryLight} />
                  <Text style={styles.quickBtnText}>Ligar agora</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Sobre o que é?</Text>
            <View style={styles.topicGrid}>
              {SUPPORT_TOPICS.map((item) => {
                const selected = topic === item.id

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setTopic(item.id)
                    }}
                    style={({ pressed }) => [
                      styles.topicChip,
                      selected && styles.topicChipSelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={selected ? colors.primaryLight : colors.textMuted}
                    />
                    <Text style={[styles.topicLabel, selected && styles.topicLabelSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Text style={styles.topicHint}>
              {SUPPORT_TOPICS.find((item) => item.id === topic)?.hint}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>O que aconteceu?</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Descreva com calma o que você precisa. Quanto mais detalhes, melhor conseguimos ajudar."
              placeholderTextColor={colors.textSubtle}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.textArea]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Como prefere ser atendido?</Text>
            <View style={styles.contactColumn}>
              {CONTACT_OPTIONS.map((option) => {
                const selected = contactPreference === option.id
                const disabled =
                  (option.id === 'whatsapp' && !menuSupportConfig.whatsApp) ||
                  (option.id === 'phone' && !menuSupportConfig.phone)

                return (
                  <Pressable
                    key={option.id}
                    disabled={disabled}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setContactPreference(option.id)
                    }}
                    style={({ pressed }) => [
                      styles.contactRow,
                      selected && styles.contactRowSelected,
                      disabled && styles.contactRowDisabled,
                      pressed && !disabled && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled }}
                  >
                    <View style={styles.contactIconWrap}>
                      <Ionicons
                        name={option.icon}
                        size={18}
                        color={selected ? colors.primaryLight : colors.textMuted}
                      />
                    </View>
                    <View style={styles.contactCopy}>
                      <Text style={[styles.contactTitle, selected && styles.contactTitleSelected]}>
                        {option.label}
                      </Text>
                      <Text style={styles.contactHint}>
                        {disabled ? 'Indisponível no momento' : option.hint}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primaryLight} />
                    ) : null}
                  </Pressable>
                )
              })}
            </View>
          </View>

          {resolvedName || resolvedEmail ? (
            <View style={styles.identityCard}>
              <Text style={styles.identityLabel}>Seus dados no pedido</Text>
              {resolvedName ? <Text style={styles.identityValue}>{resolvedName}</Text> : null}
              {resolvedEmail ? <Text style={styles.identityMeta}>{resolvedEmail}</Text> : null}
              {resolvedPhone ? <Text style={styles.identityMeta}>{resolvedPhone}</Text> : null}
            </View>
          ) : null}
        </>
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.25)',
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.3)',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
    marginBottom: 12,
  },
  emergencyText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  emergencyStrong: {
    color: '#fca5a5',
    fontWeight: '800',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  quickBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  field: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
  },
  topicChipSelected: {
    borderColor: 'rgba(255, 133, 51, 0.45)',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  topicLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  topicLabelSelected: {
    color: colors.text,
  },
  topicHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 130,
  },
  contactColumn: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
  },
  contactRowSelected: {
    borderColor: 'rgba(255, 133, 51, 0.45)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  contactRowDisabled: {
    opacity: 0.45,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  contactCopy: {
    flex: 1,
    gap: 2,
  },
  contactTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  contactTitleSelected: {
    color: colors.text,
  },
  contactHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  identityCard: {
    gap: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 8,
  },
  identityLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  identityValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  identityMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.82,
  },
  successWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    gap: 10,
  },
  successLottie: {
    marginBottom: 4,
  },
  successTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  successHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 4,
  },
})
