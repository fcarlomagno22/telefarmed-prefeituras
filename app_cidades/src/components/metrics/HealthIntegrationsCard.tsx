import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { HEALTH_INTEGRATIONS } from '../../config/healthIntegrations'
import { colors } from '../../theme/colors'
import {
  HealthIntegrationConfig,
  IntegrationConnectionState,
  IntegrationId,
} from '../../types/healthIntegrations'
import { HealthIntegrationConnectDrawer } from './HealthIntegrationConnectDrawer'
import { SkeletonBone } from '../SkeletonBone'

function isIntegrationAvailableOnDevice(integration: HealthIntegrationConfig): boolean {
  if (integration.platform === 'all') {
    return true
  }
  return integration.platform === Platform.OS
}

function formatLastSync(timestamp: number): string {
  const diffMin = Math.floor((Date.now() - timestamp) / 60000)
  if (diffMin < 1) return 'Agora mesmo'
  if (diffMin === 1) return 'há 1 min'
  return `há ${diffMin} min`
}

function IntegrationIcon({
  integration,
  size = 22,
}: {
  integration: HealthIntegrationConfig
  size?: number
}) {
  return integration.iconFamily === 'ionicons' ? (
    <Ionicons name={integration.icon as keyof typeof Ionicons.glyphMap} size={size} color="#fff" />
  ) : (
    <MaterialCommunityIcons
      name={integration.icon as keyof typeof MaterialCommunityIcons.glyphMap}
      size={size - 2}
      color="#fff"
    />
  )
}

function IntegrationRow({
  integration,
  connection,
  onPress,
}: {
  integration: HealthIntegrationConfig
  connection: IntegrationConnectionState | undefined
  onPress: () => void
}) {
  const status = connection?.status ?? 'disconnected'
  const isConnected = status === 'connected'
  const isDenied = status === 'denied'

  const actionLabel = isConnected ? 'Gerenciar' : isDenied ? 'Tentar novamente' : 'Conectar'
  const actionColor = isConnected ? '#34d399' : isDenied ? colors.textMuted : colors.primaryLight

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.integrationRow, pressed && styles.integrationRowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${actionLabel} ${integration.title}`}
    >
      <LinearGradient
        colors={[...integration.gradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.integrationIconOrb}
      >
        <IntegrationIcon integration={integration} />
      </LinearGradient>

      <View style={styles.integrationTextCol}>
        <View style={styles.integrationTitleRow}>
          <Text style={styles.integrationTitle}>{integration.title}</Text>
          {isConnected ? (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedBadgeText}>Conectado</Text>
            </View>
          ) : isDenied ? (
            <View style={styles.deniedBadge}>
              <Text style={styles.deniedBadgeText}>Não conectado</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.integrationDescription}>
          {isConnected && connection?.connectedDeviceName
            ? `${connection.connectedDeviceName} · ${connection.lastSyncedAt ? formatLastSync(connection.lastSyncedAt) : 'sincronizando'}`
            : isConnected && connection?.lastSyncedAt
              ? `Sincronizado ${formatLastSync(connection.lastSyncedAt)}`
              : isDenied
                ? 'Sem permissão. Toque para tentar de novo.'
                : integration.description}
        </Text>
      </View>

      <View style={styles.connectChip}>
        <Text style={[styles.connectChipText, { color: actionColor }]}>{actionLabel}</Text>
        <Ionicons
          name={isConnected ? 'settings-outline' : 'chevron-forward'}
          size={14}
          color={actionColor}
        />
      </View>
    </Pressable>
  )
}

export function HealthIntegrationsCard({
  skeleton = false,
  connections: controlledConnections,
  onConnectionsChange,
  connectRequestId = null,
  onConnectRequestHandled,
}: {
  skeleton?: boolean
  connections?: Record<string, IntegrationConnectionState>
  onConnectionsChange?: (next: Record<string, IntegrationConnectionState>) => void
  connectRequestId?: IntegrationId | null
  onConnectRequestHandled?: () => void
}) {
  const [internalConnections, setInternalConnections] = useState<
    Record<string, IntegrationConnectionState>
  >({})
  const [activeIntegration, setActiveIntegration] = useState<HealthIntegrationConfig | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)

  const connections = controlledConnections ?? internalConnections

  function updateConnections(next: Record<string, IntegrationConnectionState>) {
    if (onConnectionsChange) {
      onConnectionsChange(next)
      return
    }
    setInternalConnections(next)
  }

  function setConnection(integrationId: string, next: IntegrationConnectionState) {
    updateConnections({ ...connections, [integrationId]: next })
  }

  const visibleIntegrations = useMemo(
    () => HEALTH_INTEGRATIONS.filter(isIntegrationAvailableOnDevice),
    [],
  )

  function handlePress(integration: HealthIntegrationConfig) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActiveIntegration(integration)
    setDrawerVisible(true)
  }

  function handleCloseDrawer() {
    setDrawerVisible(false)
    setActiveIntegration(null)
  }

  function handleConnectionChange(integrationId: string, next: IntegrationConnectionState) {
    setConnection(integrationId, next)
  }

  useEffect(() => {
    if (!connectRequestId || skeleton) return

    const integration = HEALTH_INTEGRATIONS.find((item) => item.id === connectRequestId)
    if (!integration || !isIntegrationAvailableOnDevice(integration)) {
      onConnectRequestHandled?.()
      return
    }

    setActiveIntegration(integration)
    setDrawerVisible(true)
    onConnectRequestHandled?.()
  }, [connectRequestId, onConnectRequestHandled, skeleton])

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[
          'rgba(255, 133, 51, 0.28)',
          'rgba(255, 107, 0, 0.12)',
          'rgba(255, 255, 255, 0.05)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.cardInner}>
          <LinearGradient
            colors={['rgba(28, 28, 36, 0.96)', 'rgba(14, 14, 20, 0.98)']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.headerRow}>
            {skeleton ? (
              <>
                <SkeletonBone width={36} height={36} borderRadius={12} />
                <View style={styles.headerTextCol}>
                  <SkeletonBone width="62%" height={15} borderRadius={6} />
                  <SkeletonBone width="96%" height={12} borderRadius={5} />
                  <SkeletonBone width="88%" height={12} borderRadius={5} />
                </View>
              </>
            ) : (
              <>
                <LinearGradient
                  colors={['#ffb366', '#ff6b00', '#e55f00']}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.headerIconOrb}
                >
                  <MaterialCommunityIcons name="link-variant" size={18} color="#fff" />
                </LinearGradient>

                <View style={styles.headerTextCol}>
                  <Text style={styles.cardTitle}>Integrações de saúde</Text>
                  <Text style={styles.cardSubtitle}>
                    Conecte apps e dispositivos para preencher suas métricas automaticamente
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.integrationsList}>
            {skeleton
              ? visibleIntegrations.map((integration, index) => (
                  <View key={integration.id}>
                    <View style={styles.integrationRow}>
                      <SkeletonBone width={40} height={40} borderRadius={13} />
                      <View style={styles.integrationTextCol}>
                        <SkeletonBone width="48%" height={13} borderRadius={5} />
                        <SkeletonBone width="82%" height={10} borderRadius={4} />
                      </View>
                      <SkeletonBone width={54} height={12} borderRadius={4} />
                    </View>
                    {index < visibleIntegrations.length - 1 ? <View style={styles.rowDivider} /> : null}
                  </View>
                ))
              : visibleIntegrations.map((integration, index) => (
                  <View key={integration.id}>
                    <IntegrationRow
                      integration={integration}
                      connection={connections[integration.id]}
                      onPress={() => handlePress(integration)}
                    />
                    {index < visibleIntegrations.length - 1 ? <View style={styles.rowDivider} /> : null}
                  </View>
                ))}
          </View>
        </View>
      </LinearGradient>

      <HealthIntegrationConnectDrawer
        visible={!skeleton && drawerVisible}
        integration={activeIntegration}
        connection={activeIntegration ? connections[activeIntegration.id] : undefined}
        onClose={handleCloseDrawer}
        onConnectionChange={handleConnectionChange}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 4,
  },
  cardBorder: {
    borderRadius: 22,
    padding: 1,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  cardInner: {
    borderRadius: 21,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  headerIconOrb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  headerTextCol: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  integrationsList: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  integrationRowPressed: {
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  integrationIconOrb: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    flexShrink: 0,
  },
  integrationTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  integrationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  integrationTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  connectedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  connectedBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  deniedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  deniedBadgeText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  integrationDescription: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
  },
  connectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 4,
    flexShrink: 0,
  },
  connectChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
})
