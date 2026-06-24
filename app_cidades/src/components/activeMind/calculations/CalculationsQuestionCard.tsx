import { useThemedStyles } from '../../../hooks/useThemedStyles'
import type { ThemeColors } from '../../../theme/palettes'
import { StyleSheet, Text, View } from 'react-native'

type CalculationsQuestionCardProps = {
  pergunta: string
}

export function CalculationsQuestionCard({ pergunta }: CalculationsQuestionCardProps) {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.card}>
      <Text
        style={styles.expression}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {pergunta}
      </Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderRadius: 18,
      alignItems: 'center',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(37, 99, 235, 0.28)',
    },
    expression: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.4,
      textAlign: 'center',
      includeFontPadding: false,
    },
  })
}
