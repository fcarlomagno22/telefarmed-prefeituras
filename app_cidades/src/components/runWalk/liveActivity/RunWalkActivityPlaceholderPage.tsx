import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

type RunWalkActivityPlaceholderPageProps = {
  title: string
  subtitle?: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
}

export function RunWalkActivityPlaceholderPage({
  title,
  subtitle = 'Disponível em breve',
  icon,
}: RunWalkActivityPlaceholderPageProps) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <MaterialCommunityIcons name={icon} size={42} color={colors.textSubtle} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 36,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
})
