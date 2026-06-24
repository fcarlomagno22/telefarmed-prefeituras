import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MentalHealthPrivacyPolicyDrawerProps = {
  visible: boolean
  onClose: () => void
}

const POLICY_SECTIONS = [
  {
    title: 'Coleta e uso dos dados',
    body:
      'Coletamos informações que você registra no módulo de saúde mental — como respostas a questionários, preferências de cuidado e registros emocionais — para personalizar seu acompanhamento e apoiar profissionais autorizados.',
  },
  {
    title: 'Proteção e acesso',
    body:
      'Seus dados são armazenados com criptografia e acesso restrito. Apenas profissionais vinculados ao seu cuidado podem visualizar informações individuais identificáveis.',
  },
  {
    title: 'Dados agregados para gestores',
    body:
      'Prefeituras e gestores de saúde recebem apenas relatórios agregados e anonimizados, sem identificação individual dos cidadãos.',
  },
  {
    title: 'Seus direitos',
    body:
      'Você pode revisar, corrigir ou solicitar a exclusão de seus registros pessoais, conforme a Lei Geral de Proteção de Dados (LGPD). Entre em contato com o suporte da Telefarmed para exercer seus direitos.',
  },
  {
    title: 'Limitações do recurso',
    body:
      'Este módulo complementa o cuidado em saúde mental, mas não substitui avaliação ou tratamento por um profissional de saúde. Em situações de risco imediato, procure atendimento de emergência.',
  },
] as const

export function MentalHealthPrivacyPolicyDrawer({
  visible,
  onClose,
}: MentalHealthPrivacyPolicyDrawerProps) {
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Política de privacidade"
      subtitle="Como tratamos seus dados de saúde mental"
      onClose={onClose}
      fullScreen
    >
      <Text style={styles.intro}>
        Esta política descreve como a Telefarmed utiliza e protege suas informações no módulo de
        saúde mental.
      </Text>

      {POLICY_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 8,
  },
  section: {
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionBody: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
})
