import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

type RunWalkHistoryInsightBannerProps = {
  message: string | null
}

export function RunWalkHistoryInsightBanner({ message }: RunWalkHistoryInsightBannerProps) {
  if (!message) return null

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles-outline" size={16} color="#6ee7b7" />
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.24)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  text: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
})
