import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formStyles } from '../AppShell'
import { RegisterTimeline } from './RegisterTimeline'
import { PrimaryButton } from '../PrimaryButton'
import { colors } from '../../theme/colors'

export type LegalAcceptances = {
  termsOfUse: boolean
  privacyPolicy: boolean
  lgpdConsent: boolean
  healthDataConsent: boolean
  communicationsConsent: boolean
}

export const emptyLegalAcceptances = (): LegalAcceptances => ({
  termsOfUse: false,
  privacyPolicy: false,
  lgpdConsent: false,
  healthDataConsent: false,
  communicationsConsent: false,
})

type LegalAgreement = {
  id: keyof LegalAcceptances
  title: string
  description: string
  required: boolean
}

const legalAgreements: LegalAgreement[] = [
  {
    id: 'termsOfUse',
    title: 'Termos de Uso',
    description: 'Concordo com as regras de utilização do app Telefarmed Sua Cidade.',
    required: true,
  },
  {
    id: 'privacyPolicy',
    title: 'Política de Privacidade',
    description: 'Li e aceito como meus dados pessoais são coletados, usados e armazenados.',
    required: true,
  },
  {
    id: 'lgpdConsent',
    title: 'Consentimento LGPD',
    description:
      'Autorizo o tratamento dos meus dados conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
    required: true,
  },
  {
    id: 'healthDataConsent',
    title: 'Dados sensíveis de saúde',
    description:
      'Autorizo o tratamento dos meus dados de saúde para fins de teleatendimento, prontuário e continuidade do cuidado.',
    required: true,
  },
  {
    id: 'communicationsConsent',
    title: 'Comunicações do serviço',
    description:
      'Aceito receber avisos operacionais sobre consultas, agendamentos e atualizações do serviço.',
    required: true,
  },
]

type RegisterStepLegalProps = {
  value: LegalAcceptances
  onChange: (value: LegalAcceptances) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function RegisterStepLegal({
  value,
  onChange,
  onSubmit,
  onBack,
  isSubmitting,
}: RegisterStepLegalProps) {
  const [error, setError] = useState<string | null>(null)

  const requiredAccepted = useMemo(
    () => legalAgreements.filter((item) => item.required).every((item) => value[item.id]),
    [value],
  )

  const allAccepted = useMemo(
    () => legalAgreements.every((item) => value[item.id]),
    [value],
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

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable onPress={toggleAll} style={styles.acceptAllCard}>
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
        {legalAgreements.map((agreement) => {
          const checked = value[agreement.id]

          return (
            <Pressable
              key={agreement.id}
              onPress={() => toggleItem(agreement.id)}
              style={[styles.agreementCard, checked && styles.agreementCardChecked]}
            >
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
          )
        })}
      </View>

      <PrimaryButton
        label="Concluir cadastro"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!requiredAccepted}
      />

      <Pressable onPress={onBack} style={formStyles.secondaryButton}>
        <Text style={formStyles.secondaryButtonText}>Voltar</Text>
      </Pressable>
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
  acceptAllCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  agreementCardChecked: {
    borderColor: 'rgba(255, 107, 0, 0.35)',
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
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
})
