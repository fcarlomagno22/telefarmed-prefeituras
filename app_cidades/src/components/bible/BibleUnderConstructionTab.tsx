import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type BibleUnderConstructionTabProps = {
  bottomPadding: number
  title: string
  subtitle: string
}

export function BibleUnderConstructionTab({
  bottomPadding,
  title,
  subtitle,
}: BibleUnderConstructionTabProps) {
  return (
    <View style={[styles.root, { paddingBottom: bottomPadding }]}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct-outline" size={28} color="#fbbf24" />
        </View>
        <Text style={styles.badge}>Em construção</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    marginBottom: 4,
  },
  badge: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
})
