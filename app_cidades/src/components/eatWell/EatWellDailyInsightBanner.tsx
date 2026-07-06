import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type EatWellDailyInsightBannerProps = {
  message: string | null
}

export function EatWellDailyInsightBanner({ message }: EatWellDailyInsightBannerProps) {
  if (!message) return null

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#ecfccb', '#f7fee7', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles-outline" size={16} color="#4d7c0f" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>Insight do dia</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(101, 163, 13, 0.28)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#4d7c0f',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
})
