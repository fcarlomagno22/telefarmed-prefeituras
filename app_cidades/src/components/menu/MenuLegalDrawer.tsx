import { StyleSheet, Text, View } from 'react-native'
import { MENU_PRIVACY_SECTIONS, MENU_TERMS_SECTIONS } from '../../config/menuLegalContent'
import { colors } from '../../theme/colors'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MenuLegalVariant = 'privacy' | 'terms'

type MenuLegalDrawerProps = {
  visible: boolean
  variant: MenuLegalVariant
  onClose: () => void
}

const LEGAL_COPY: Record<
  MenuLegalVariant,
  { title: string; subtitle: string; intro: string; sections: readonly { title: string; body: string }[] }
> = {
  privacy: {
    title: 'Privacidade e dados',
    subtitle: 'Como tratamos suas informações',
    intro:
      'Esta política descreve como a Telefarmed coleta, usa e protege seus dados no app municipal de saúde.',
    sections: MENU_PRIVACY_SECTIONS,
  },
  terms: {
    title: 'Termos de uso',
    subtitle: 'Regras de utilização do app',
    intro:
      'Leia atentamente as condições para utilizar o Telefarmed Sua Cidade e os serviços disponibilizados pela prefeitura.',
    sections: MENU_TERMS_SECTIONS,
  },
}

export function MenuLegalDrawer({ visible, variant, onClose }: MenuLegalDrawerProps) {
  const copy = LEGAL_COPY[variant]

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={copy.title}
      subtitle={copy.subtitle}
      onClose={onClose}
      fullScreen
    >
      <Text style={styles.intro}>{copy.intro}</Text>

      {copy.sections.map((section) => (
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
