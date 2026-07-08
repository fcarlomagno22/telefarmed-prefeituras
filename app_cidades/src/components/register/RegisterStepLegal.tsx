import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRegistrationConsentTerms } from '../../hooks/useRegistrationConsentTerms'
import type { LegalAcceptances } from '../../types/registrationTerms'
import {
  isLegalAcceptancesComplete,
  type RegisterLegalAgreement,
} from '../../utils/registerLegalAgreements'
import { formStyles } from '../AppShell'
import { RegisterTimeline } from './RegisterTimeline'
import { PrimaryButton } from '../PrimaryButton'
import { RegisterConsentTermDrawer } from './RegisterConsentTermDrawer'
import { colors } from '../../theme/colors'

export type { LegalAcceptances } from '../../types/registrationTerms'

export const emptyLegalAcceptances = (): LegalAcceptances => ({
  termsOfUse: false,
  privacyPolicy: false,
  lgpdConsent: false,
  healthDataConsent: false,
  communicationsConsent: false,
})

type RegisterStepLegalProps = {
  value: LegalAcceptances
  onChange: (value: LegalAcceptances) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
  submitError?: string | null
}

export function RegisterStepLegal({
  value,
  onChange,
  onSubmit,
  onBack,
  isSubmitting,
  submitError = null,
}: RegisterStepLegalProps) {
  const [error, setError] = useState<string | null>(null)
  const [activeAgreement, setActiveAgreement] = useState<RegisterLegalAgreement | null>(null)
  const { agreements, isLoading, loadError, reload } = useRegistrationConsentTerms()

  const requiredAccepted = useMemo(
    () => isLegalAcceptancesComplete(value, agreements),
    [agreements, value],
  )

  const allAccepted = useMemo(
    () => agreements.every((item) => value[item.id]),
    [agreements, value],
  )

  function toggleItem(id: keyof LegalAcceptances) {
    onChange({ ...value, [id]: !value[id] })
    setError(null)
  }

  function toggleAll() {
    const nextValue = !allAccepted
    onChange({
      termsOfUse: nextValue,
      privacyPolicy: nextValue,
      lgpdConsent: nextValue,
      healthDataConsent: nextValue,
      communicationsConsent: nextValue,
    })
    setError(null)
  }

  function handleSubmit() {
    if (!requiredAccepted) {
      setError('Você precisa aceitar todos os termos obrigatórios para concluir o cadastro.')
      return
    }

    setError(null)
    onSubmit()
  }

  return (
    <>
      <RegisterTimeline currentStep={5} />

      <View style={styles.iconWrap}>
        <Ionicons name="document-text-outline" size={34} color={colors.primary} />
      </View>

      <Text style={formStyles.stepTitle}>Termos e consentimentos</Text>
      <Text style={formStyles.stepSubtitle}>
        Para concluir seu cadastro, aceite os documentos e autorizações legais abaixo.
      </Text>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Carregando termos atualizados…</Text>
        </View>
      ) : null}

      {loadError ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <View style={styles.loadErrorTextWrap}>
            <Text style={formStyles.errorText}>{loadError}</Text>
            <Pressable onPress={reload} style={styles.retryLink}>
              <Text style={styles.retryLinkText}>Tentar novamente</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {submitError ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={formStyles.errorText}>{submitError}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable onPress={toggleAll} style={styles.acceptAllCard} disabled={isLoading}>
        <Ionicons
          name={allAccepted ? 'checkbox' : 'square-outline'}
          size={22}
          color={allAccepted ? colors.primary : colors.textMuted}
        />
        <View style={styles.acceptAllTextWrap}>
          <Text style={styles.acceptAllTitle}>Aceitar todos os termos obrigatórios</Text>
          <Text style={styles.acceptAllSubtitle}>
            Marca de uma vez todos os consentimentos necessários.
          </Text>
        </View>
      </Pressable>

      <View style={styles.agreementsList}>
        {agreements.map((agreement) => {
          const checked = value[agreement.id]

          return (
            <View
              key={agreement.id}
              style={[styles.agreementCard, checked && styles.agreementCardChecked]}
            >
              <Pressable onPress={() => toggleItem(agreement.id)} style={styles.agreementToggle}>
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={checked ? colors.primary : colors.textMuted}
                  style={styles.agreementCheckbox}
                />

                <View style={styles.agreementContent}>
                  <View style={styles.agreementHeader}>
                    <Text style={styles.agreementTitle}>{agreement.title}</Text>
                    {agreement.required ? (
                      <Text style={styles.requiredBadge}>Obrigatório</Text>
                    ) : null}
                  </View>
                  <Text style={styles.agreementDescription}>{agreement.description}</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setActiveAgreement(agreement)}
                style={({ pressed }) => [styles.readTermBtn, pressed && styles.readTermBtnPressed]}
              >
                <Ionicons name="open-outline" size={14} color={colors.primaryLight} />
                <Text style={styles.readTermBtnText}>Ler documento completo</Text>
              </Pressable>
            </View>
          )
        })}
      </View>

      <PrimaryButton
        label="Concluir cadastro"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!requiredAccepted || isLoading}
      />

      <Pressable onPress={onBack} style={formStyles.secondaryButton}>
        <Text style={formStyles.secondaryButtonText}>Voltar</Text>
      </Pressable>

      <RegisterConsentTermDrawer
        visible={activeAgreement !== null}
        agreement={activeAgreement}
        accepted={activeAgreement ? value[activeAgreement.id] : false}
        onClose={() => setActiveAgreement(null)}
        onAcceptChange={(accepted) => {
          if (!activeAgreement) return
          onChange({ ...value, [activeAgreement.id]: accepted })
          setError(null)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  iconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    marginBottom: 14,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  loadErrorTextWrap: {
    flex: 1,
    gap: 4,
  },
  retryLink: {
    alignSelf: 'flex-start',
  },
  retryLinkText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  acceptAllCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  acceptAllTextWrap: {
    flex: 1,
  },
  acceptAllTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  acceptAllSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  agreementsList: {
    gap: 10,
    marginBottom: 8,
  },
  agreementCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
    overflow: 'hidden',
  },
  agreementCardChecked: {
    borderColor: 'rgba(255, 107, 0, 0.35)',
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
  },
  agreementToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  agreementCheckbox: {
    marginTop: 2,
  },
  agreementContent: {
    flex: 1,
    marginLeft: 10,
  },
  agreementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  agreementTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  requiredBadge: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  agreementDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  readTermBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 2,
  },
  readTermBtnPressed: {
    opacity: 0.8,
  },
  readTermBtnText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
})
