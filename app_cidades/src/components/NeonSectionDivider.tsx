import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View, type ViewStyle } from 'react-native'

type NeonSectionDividerProps = {
  embedded?: boolean
  style?: ViewStyle
}

export function NeonSectionDivider({ embedded = false, style }: NeonSectionDividerProps) {
  return (
    <View style={[styles.container, embedded && styles.containerEmbedded, style]}>
      <View style={styles.glowShell} pointerEvents="none">
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 107, 0, 0.08)',
            'rgba(255, 133, 51, 0.35)',
            'rgba(255, 107, 0, 0.08)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.glowWide}
        />

        <View style={styles.glowMidWrap}>
          <LinearGradient
            colors={[
              'transparent',
              'rgba(255, 133, 51, 0.5)',
              'rgba(255, 107, 0, 0.65)',
              'rgba(255, 133, 51, 0.5)',
              'transparent',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.glowMid}
          />
        </View>

        <View style={styles.coreWrap}>
          <LinearGradient
            colors={[
              'transparent',
              '#ffb366',
              '#ff8533',
              '#ff6b00',
              '#ff8533',
              '#ffb366',
              'transparent',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.coreLine}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerEmbedded: {
    marginTop: 0,
  },
  glowShell: {
    width: '100%',
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWide: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    opacity: 0.85,
  },
  glowMidWrap: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 3,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 4,
  },
  glowMid: {
    flex: 1,
    borderRadius: 2,
  },
  coreWrap: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    height: 1,
    shadowColor: '#ff8533',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  coreLine: {
    flex: 1,
    borderRadius: 0.5,
  },
})
