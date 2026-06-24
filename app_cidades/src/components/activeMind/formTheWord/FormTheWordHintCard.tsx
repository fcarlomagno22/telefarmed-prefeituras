import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

type FormTheWordHintCardProps = {
  hint: string
}

export function FormTheWordHintCard({ hint }: FormTheWordHintCardProps) {
  if (!hint.trim()) return null

  return (
    <View style={styles.card} accessibilityRole="text" accessibilityLabel={`Dica: ${hint}`}>
      <Text style={styles.label}>Dica</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.18)',
  },
  label: {
    color: '#67e8f9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
})
