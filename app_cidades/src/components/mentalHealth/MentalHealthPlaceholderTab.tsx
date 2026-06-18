import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type MentalHealthPlaceholderTabProps = {
  title: string
  description: string
  bottomPadding: number
}

export function MentalHealthPlaceholderTab({
  title,
  description,
  bottomPadding,
}: MentalHealthPlaceholderTabProps) {
  return (
    <View style={[styles.wrap, { paddingBottom: bottomPadding }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="leaf-outline" size={24} color="#67e8f9" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{description}</Text>
      <Text style={styles.badge}>Em breve</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
  },
  badge: {
    marginTop: 8,
    color: '#67e8f9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
})
