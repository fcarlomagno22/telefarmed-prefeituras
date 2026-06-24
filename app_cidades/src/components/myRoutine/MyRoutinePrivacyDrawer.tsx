import { StyleSheet, Text, View } from 'react-native'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type MyRoutinePrivacyDrawerProps = {
  visible: boolean
  onClose: () => void
}

const POLICY_SECTIONS = [
  {
    title: 'Dados da rotina',
    body:
      'Registramos preferências, plano semanal, conclusão de tarefas e fechamentos diários para personalizar lembretes e mostrar seu progresso. Esses dados ficam no dispositivo e na sua conta Telefarmed.',
  },
  {
    title: 'Uso e finalidade',
    body:
      'Usamos suas respostas de onboarding e histórico para sugerir ajustes, calcular aderência à rotina mínima e apoiar revisões semanais. Não vendemos nem compartilhamos seus dados com terceiros para marketing.',
  },
  {
    title: 'Proteção',
    body:
      'Informações são transmitidas com criptografia e acesso restrito. Profissionais de saúde vinculados ao seu cuidado podem ver dados agregados de aderência quando autorizado pelo programa municipal.',
  },
  {
    title: 'Seus direitos (LGPD)',
    body:
      'Você pode revisar, corrigir ou solicitar exclusão dos registros. Use “Recomeçar do zero” para apagar localmente ou contate o suporte Telefarmed para pedidos formais.',
  },
  {
    title: 'Limitações',
    body:
      'Minha Rotina é uma ferramenta de organização pessoal. Não substitui orientação médica, psicológica ou de enfermagem. Em emergências, procure atendimento imediato.',
  },
] as const

export function MyRoutinePrivacyDrawer({ visible, onClose }: MyRoutinePrivacyDrawerProps) {
  const styles = useThemedStyles(createStyles)
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Privacidade"
      subtitle="Como tratamos seus dados de rotina"
      onClose={onClose}
      fullScreen
    >
      <Text style={styles.intro}>
        Esta política descreve como a Telefarmed utiliza e protege suas informações no módulo Minha
        Rotina.
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

function createStyles(colors: ThemeColors) {
  return {
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
  },
  sectionBody: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
}
}

