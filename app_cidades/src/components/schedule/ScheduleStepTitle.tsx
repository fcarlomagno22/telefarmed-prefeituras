import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../../theme/colors'

type ScheduleStepTitleProps = {
  title: string
  onBack?: () => void
}

export function ScheduleStepTitle({ title, onBack }: ScheduleStepTitleProps) {
  return (
    <Pressable
      onPress={onBack}
      disabled={!onBack}
      style={({ pressed }) => [styles.row, onBack && pressed && styles.pressed]}
      accessibilityRole={onBack ? 'button' : 'header'}
      accessibilityLabel={onBack ? `Voltar: ${title}` : title}
    >
      {onBack ? <Ionicons name="chevron-back" size={22} color={colors.text} /> : null}
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginLeft: -6,
  },
  pressed: {
    opacity: 0.82,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
})
