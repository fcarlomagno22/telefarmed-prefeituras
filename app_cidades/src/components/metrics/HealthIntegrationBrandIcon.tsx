import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { StyleSheet } from 'react-native'
import { HealthIntegrationConfig } from '../../types/healthIntegrations'

const googleHealthConnectLogo = require('../../../assets/google-health-connect-svgrepo-com.svg')
const appleHealthLogo = require('../../../assets/apple-health-app-vector_svgstack_com_5961782767508.svg')

type HealthIntegrationBrandIconProps = {
  integration: HealthIntegrationConfig
  size?: number
}

export function HealthIntegrationBrandIcon({
  integration,
  size = 22,
}: HealthIntegrationBrandIconProps) {
  if (integration.id === 'health-connect') {
    return (
      <Image
        source={googleHealthConnectLogo}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    )
  }

  if (integration.id === 'apple-health') {
    return (
      <Image
        source={appleHealthLogo}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    )
  }

  if (integration.iconFamily === 'ionicons') {
    return (
      <Ionicons
        name={integration.icon as keyof typeof Ionicons.glyphMap}
        size={size}
        color="#fff"
      />
    )
  }

  return (
    <MaterialCommunityIcons
      name={integration.icon as keyof typeof MaterialCommunityIcons.glyphMap}
      size={size - 2}
      color="#fff"
      style={styles.materialIcon}
    />
  )
}

const styles = StyleSheet.create({
  materialIcon: {
    marginTop: 1,
  },
})
