import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import successAnimation from '../../../assets/success.json'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../theme/colors'
import {
  FeedbackReportType,
  formatScreenLabel,
  sendBugReport,
} from '../../utils/bugReport'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MenuBugReportDrawerProps = {
  visible: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
}

type ReportStep = 'form' | 'success'

const REPORT_TYPES: { id: FeedbackReportType; label: string; icon: keyof typeof Ionicons.glyphMap }[] =
  [
    { id: 'bug', label: 'Problema', icon: 'bug-outline' },
    { id: 'suggestion', label: 'Sugestão', icon: 'bulb-outline' },
  ]

export function MenuBugReportDrawer({
  visible,
  onClose,
  userName,
  userEmail,
}: MenuBugReportDrawerProps) {
  const { screen, user } = useAuth()
  const [step, setStep] = useState<ReportStep>('form')
  const [reportType, setReportType] = useState<FeedbackReportType>('bug')
  const [description, setDescription] = useState('')
  const [screenName, setScreenName] = useState('')
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const resolvedName = userName ?? user?.name
  const resolvedEmail = userEmail ?? user?.email

  useEffect(() => {
    if (!visible) return

    setStep('form')
    setReportType('bug')
    setDescription('')
    setEvidenceUri(null)
    setScreenName(screen ? formatScreenLabel(screen) : '')
  }, [screen, visible])

  function resetForm() {
    setStep('form')
    setReportType('bug')
    setDescription('')
    setScreenName('')
    setEvidenceUri(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSuccessClose() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    handleClose()
  }

  async function pickEvidence(source: 'camera' | 'gallery') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        source === 'camera'
          ? 'Precisamos da câmera para registrar um print ou foto do problema.'
          : 'Precisamos acessar sua galeria para anexar uma evidência.',
      )
      return
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
          })

    if (result.canceled || !result.assets[0]?.uri) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setEvidenceUri(result.assets[0].uri)
  }

  async function handleSubmit() {
    if (!description.trim() || isSending) return

    setIsSending(true)
    try {
      await sendBugReport({
        type: reportType,
        description,
        screenName,
        evidenceUri,
        userName: resolvedName,
        userEmail: resolvedEmail,
      })

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setStep('success')
    } catch {
      Alert.alert(
        'Não foi possível enviar',
        'Tente novamente em instantes. Se o problema continuar, use "Falar com suporte" no menu.',
      )
    } finally {
      setIsSending(false)
    }
  }

  const drawerTitle = step === 'success' ? 'Obrigado!' : 'Bug ou sugestão'
  const drawerSubtitle =
    step === 'success'
      ? 'Recebemos seu feedback'
      : 'Conte o que aconteceu ou como podemos melhorar'

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={drawerTitle}
      subtitle={drawerSubtitle}
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
            label="Enviar feedback"
            onPress={() => void handleSubmit()}
            loading={isSending}
            disabled={!description.trim()}
          />
        )
      }
    >
      {step === 'success' ? (
        <View style={styles.successWrap}>
          <LottiePlayer source={successAnimation} loop={false} style={styles.successLottie} />
          <Text style={styles.successTitle}>Muito obrigado por nos ajudar</Text>
          <Text style={styles.successMessage}>
            Sabemos que nada é perfeito — e é justamente o seu olhar que nos ajuda a deixar o
            Telefarmed cada vez melhor para você e para toda a cidade. Nossa equipe vai ler com
            carinho.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.empathyCard}>
            <Ionicons name="heart-outline" size={18} color={colors.primaryLight} />
            <Text style={styles.empathyText}>
              Aplicativos podem falhar, e tudo aqui ainda está em evolução. Queremos ouvir você —
              seja um bug, algo confuso ou uma ideia para melhorar sua experiência.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>O que você quer nos contar?</Text>
            <View style={styles.typeRow}>
              {REPORT_TYPES.map((item) => {
                const selected = reportType === item.id

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setReportType(item.id)
                    }}
                    style={({ pressed }) => [
                      styles.typeChip,
                      selected && styles.typeChipSelected,
                      pressed && styles.typeChipPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={selected ? colors.primaryLight : colors.textMuted}
                    />
                    <Text style={[styles.typeChipLabel, selected && styles.typeChipLabelSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {reportType === 'bug' ? 'O que aconteceu?' : 'Qual sua sugestão?'}
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={
                reportType === 'bug'
                  ? 'Ex.: o app fechou ao abrir minhas consultas'
                  : 'Ex.: seria ótimo ter um atalho para métricas na home'
              }
              placeholderTextColor={colors.textSubtle}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.textArea]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tela ou funcionalidade (opcional)</Text>
            <TextInput
              value={screenName}
              onChangeText={setScreenName}
              placeholder="Ex.: Histórias para dormir"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Evidência (opcional)</Text>
            <Text style={styles.fieldHint}>
              Anexe um print ou foto para facilitar nossa investigação.
            </Text>

            {evidenceUri ? (
              <View style={styles.evidencePreviewWrap}>
                <Image source={{ uri: evidenceUri }} style={styles.evidencePreview} contentFit="cover" />
                <Pressable
                  onPress={() => setEvidenceUri(null)}
                  style={({ pressed }) => [styles.evidenceRemoveBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Remover evidência"
                >
                  <Ionicons name="close" size={18} color={colors.text} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.evidenceActions}>
                <Pressable
                  onPress={() => void pickEvidence('gallery')}
                  style={({ pressed }) => [styles.evidenceBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Escolher da galeria"
                >
                  <Ionicons name="images-outline" size={20} color={colors.primaryLight} />
                  <Text style={styles.evidenceBtnText}>Galeria</Text>
                </Pressable>

                <Pressable
                  onPress={() => void pickEvidence('camera')}
                  style={({ pressed }) => [styles.evidenceBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Tirar foto"
                >
                  <Ionicons name="camera-outline" size={20} color={colors.primaryLight} />
                  <Text style={styles.evidenceBtnText}>Câmera</Text>
                </Pressable>
              </View>
            )}
          </View>
        </>
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  empathyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.22)',
    marginBottom: 4,
  },
  empathyText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  field: {
    gap: 8,
    marginBottom: 14,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
  },
  typeChipSelected: {
    borderColor: 'rgba(255, 133, 51, 0.45)',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  typeChipPressed: {
    opacity: 0.82,
  },
  typeChipLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  typeChipLabelSelected: {
    color: colors.text,
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
    minHeight: 140,
  },
  evidenceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  evidenceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    borderStyle: 'dashed',
  },
  evidenceBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  evidencePreviewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    aspectRatio: 16 / 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  evidencePreview: {
    width: '100%',
    height: '100%',
  },
  evidenceRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
})
