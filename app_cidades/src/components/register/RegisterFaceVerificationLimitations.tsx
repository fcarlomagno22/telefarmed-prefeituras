import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { styles } from './registerStepFaceScanShared'

type RegisterFaceVerificationLimitationsProps = {
  notice: string | null
  limitations: readonly string[]
}

export function RegisterFaceVerificationLimitations({
  notice,
  limitations,
}: RegisterFaceVerificationLimitationsProps) {
  if (!notice && limitations.length === 0) return null

  return (
    <View style={styles.platformNotice}>
      <Ionicons name="information-circle-outline" size={18} color={colors.primaryLight} />
      <View style={{ flex: 1, gap: 0 }}>
        {notice ? <Text style={styles.platformNoticeText}>{notice}</Text> : null}
        {limitations.length > 0 ? (
          <View style={styles.limitationsBox}>
            <Text style={styles.limitationsTitle}>Limitações nesta plataforma</Text>
            {limitations.map((item) => (
              <View key={item} style={styles.limitationItem}>
                <Text style={styles.limitationBullet}>•</Text>
                <Text style={styles.limitationText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  )
}
