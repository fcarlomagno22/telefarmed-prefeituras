import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { RegisterLegalAgreement } from '../../utils/registerLegalAgreements'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type RegisterConsentTermDrawerProps = {
  visible: boolean
  agreement: RegisterLegalAgreement | null
  accepted: boolean
  onClose: () => void
  onAcceptChange: (accepted: boolean) => void
}

export function RegisterConsentTermDrawer({
  visible,
  agreement,
  accepted,
  onClose,
  onAcceptChange,
}: RegisterConsentTermDrawerProps) {
  if (!agreement) return null

  const versionLabel = [agreement.version, agreement.updatedAtLabel].filter(Boolean).join(' · ')

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={agreement.title}
      subtitle={agreement.required ? 'Termo obrigatório' : 'Termo opcional'}
      onClose={onClose}
      footer={
        accepted ? (
          <PrimaryButton label="Fechar" onPress={onClose} />
        ) : (
          <PrimaryButton
            label="Aceitar termo"
            onPress={() => {
              onAcceptChange(true)
              onClose()
            }}
          />
        )
      }
    >
      <View style={styles.content}>
        {versionLabel ? <Text style={styles.versionLabel}>{versionLabel}</Text> : null}
        {agreement.description ? <Text style={styles.summary}>{agreement.description}</Text> : null}
        <Text style={styles.fullText}>{agreement.fullContent}</Text>
        {accepted ? (
          <View style={styles.acceptedBadge}>
            <Text style={styles.acceptedBadgeText}>Aceito</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              onAcceptChange(true)
              onClose()
            }}
            style={({ pressed }) => [styles.inlineAcceptBtn, pressed && styles.pressed]}
          >
            <Text style={styles.inlineAcceptBtnText}>Aceitar este termo</Text>
          </Pressable>
        )}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 8,
  },
  versionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  fullText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  acceptedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.35)',
  },
  acceptedBadgeText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inlineAcceptBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.35)',
  },
  inlineAcceptBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
})
