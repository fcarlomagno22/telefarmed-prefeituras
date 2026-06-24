import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  DEFAULT_ENABLED_PERMISSIONS,
  HEALTH_PERMISSIONS,
  MOCK_BLUETOOTH_DEVICES,
} from '../../config/healthIntegrations'
import { colors } from '../../theme/colors'
import {
  HealthIntegrationConfig,
  HealthPermissionId,
  IntegrationConnectionState,
} from '../../types/healthIntegrations'
import { PrimaryButton } from '../PrimaryButton'
import { AppModal } from '../AppModal'

const SHEET_OFFSET = 640
const MOCK_LOADING_MS = 1600
const MOCK_SCAN_MS = 2200
const MOCK_PAIR_MS = 1800

type DrawerStep =
  | 'intro'
  | 'loading'
  | 'scanning'
  | 'devices'
  | 'pairing'
  | 'success'
  | 'denied'
  | 'manage'

type HealthIntegrationConnectDrawerProps = {
  visible: boolean
  integration: HealthIntegrationConfig | null
  connection: IntegrationConnectionState | undefined
  onClose: () => void
  onConnectionChange: (integrationId: string, next: IntegrationConnectionState) => void
}

function formatLastSync(timestamp: number): string {
  const diffMin = Math.floor((Date.now() - timestamp) / 60000)
  if (diffMin < 1) return 'Atualizado agora mesmo'
  if (diffMin === 1) return 'Atualizado há 1 min'
  return `Atualizado há ${diffMin} min`
}

function getHeaderTitle(step: DrawerStep, integration: HealthIntegrationConfig): string {
  if (integration.id === 'devices') return 'Dispositivos'
  return integration.title
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

function InfoRow({
  icon,
  title,
  description,
  accentColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  title: string
  description: string
  accentColor: string
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color={accentColor} style={styles.infoIcon} />
      <View style={styles.infoTextCol}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
      </View>
    </View>
  )
}

function ListDivider() {
  return <View style={styles.listDivider} />
}

function PermissionToggle({
  label,
  icon,
  enabled,
  accentColor,
  onToggle,
  isLast = false,
}: {
  label: string
  icon: string
  enabled: boolean
  accentColor: string
  onToggle: () => void
  isLast?: boolean
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.permissionRow,
        !isLast && styles.permissionRowBorder,
        pressed && styles.permissionRowPressed,
      ]}
    >
      <View style={styles.permissionLeft}>
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={18}
          color={enabled ? accentColor : colors.textMuted}
        />
        <Text style={[styles.permissionLabel, enabled && { color: colors.text }]}>{label}</Text>
      </View>
      <Ionicons
        name={enabled ? 'checkbox' : 'square-outline'}
        size={20}
        color={enabled ? accentColor : colors.textSubtle}
      />
    </Pressable>
  )
}

function SignalBars({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <View style={styles.signalBars}>
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[
            styles.signalBar,
            { height: 4 + bar * 2 },
            bar <= level ? styles.signalBarActive : styles.signalBarInactive,
          ]}
        />
      ))}
    </View>
  )
}

export function HealthIntegrationConnectDrawer({
  visible,
  integration,
  connection,
  onClose,
  onConnectionChange,
}: HealthIntegrationConnectDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [step, setStep] = useState<DrawerStep>('intro')
  const [enabledPermissions, setEnabledPermissions] = useState<HealthPermissionId[]>(
    DEFAULT_ENABLED_PERMISSIONS,
  )
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [successDeviceName, setSuccessDeviceName] = useState<string | null>(null)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(0.6)).current

  const isDevicesFlow = integration?.id === 'devices'

  useEffect(() => {
    if (visible && integration) {
      setIsMounted(true)
      setStep(connection?.status === 'connected' ? 'manage' : 'intro')
      setEnabledPermissions(
        (connection?.enabledPermissions as HealthPermissionId[] | undefined) ?? DEFAULT_ENABLED_PERMISSIONS,
      )
      setSelectedDeviceId(null)
      setSuccessDeviceName(null)
      sheetTranslateY.setValue(SHEET_OFFSET)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible, integration?.id, connection?.status])

  const selectedDevice = MOCK_BLUETOOTH_DEVICES.find((device) => device.id === selectedDeviceId)

  useEffect(() => {
    if (step !== 'scanning' && step !== 'pairing') return

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )

    pulse.start()
    return () => pulse.stop()
  }, [step, pulseAnim])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false)
      setStep('intro')
      done?.()
    })
  }

  function handleDismiss() {
    if (!visible) return
    closeSheet(onClose)
  }

  function togglePermission(id: HealthPermissionId) {
    setEnabledPermissions((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function finishSuccess(extra?: Partial<IntegrationConnectionState>) {
    if (!integration) return

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onConnectionChange(integration.id, {
      status: 'connected',
      lastSyncedAt: Date.now(),
      enabledPermissions: isDevicesFlow ? undefined : enabledPermissions,
      ...extra,
    })
    setSuccessDeviceName(extra?.connectedDeviceName ?? null)
    setStep('success')
  }

  function handleAuthorize() {
    if (!integration || enabledPermissions.length === 0) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setStep('loading')

    setTimeout(() => {
      finishSuccess()
    }, MOCK_LOADING_MS)
  }

  function handleSearchDevices() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setStep('scanning')

    setTimeout(() => {
      setStep('devices')
    }, MOCK_SCAN_MS)
  }

  function handleSelectDevice(deviceId: string) {
    const device = MOCK_BLUETOOTH_DEVICES.find((item) => item.id === deviceId)
    if (!device || !integration) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedDeviceId(deviceId)
    setStep('pairing')

    setTimeout(() => {
      finishSuccess({ connectedDeviceName: device.name })
    }, MOCK_PAIR_MS)
  }

  function handleDisconnect() {
    if (!integration) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onConnectionChange(integration.id, { status: 'disconnected' })
    handleDismiss()
  }

  function handleRetry() {
    setStep(isDevicesFlow ? 'intro' : 'intro')
  }

  if (!isMounted || !integration) return null

  const canAuthorize = enabledPermissions.length > 0

  function renderContent() {
    if (step === 'loading') {
      return (
        <View style={styles.centerStage}>
          <ActivityIndicator size="large" color={integration.accentColor} />
          <Text style={styles.stageTitle} numberOfLines={1}>
            Abrindo permissões…
          </Text>
          <Text style={styles.stageSubtitle}>
            Aguarde enquanto preparamos a autorização de acesso às suas métricas
          </Text>
        </View>
      )
    }

    if (step === 'scanning') {
      return (
        <View style={styles.centerStage}>
          <Animated.View style={[styles.bluetoothPulse, { opacity: pulseAnim }]}>
            <LinearGradient
              colors={[...integration.gradient]}
              style={styles.bluetoothPulseInner}
            >
              <MaterialCommunityIcons name="bluetooth" size={28} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.stageTitle} numberOfLines={1}>
            Buscando dispositivos…
          </Text>
          <Text style={styles.stageSubtitle}>
            Mantenha o Bluetooth ativo e o dispositivo perto do celular
          </Text>
        </View>
      )
    }

    if (step === 'pairing' && selectedDevice) {
      return (
        <View style={styles.centerStage}>
          <ActivityIndicator size="large" color={integration.accentColor} />
          <Text style={styles.stageTitle} numberOfLines={1}>
            Pareando…
          </Text>
          <Text style={styles.stageSubtitle} numberOfLines={1}>
            {selectedDevice.name}
          </Text>
        </View>
      )
    }

    if (step === 'success') {
      return (
        <View style={styles.centerStage}>
          <LinearGradient colors={['#34d399', '#10b981', '#059669']} style={styles.successOrb}>
            <Ionicons name="checkmark" size={34} color="#fff" />
          </LinearGradient>
          <Text style={styles.stageTitle} numberOfLines={1}>
            Conectado
          </Text>
          <Text style={styles.stageSubtitle}>
            {successDeviceName
              ? `${successDeviceName} está sincronizando suas métricas`
              : `${integration.title} está pronto para sincronizar suas métricas`}
          </Text>
          <View style={styles.successButtonWrap}>
            <PrimaryButton label="Concluir" onPress={handleDismiss} />
          </View>
        </View>
      )
    }

    if (step === 'denied') {
      return (
        <View style={styles.centerStage}>
          <LinearGradient colors={['#fca5a5', '#ef4444', '#b91c1c']} style={styles.successOrb}>
            <Ionicons name="close" size={34} color="#fff" />
          </LinearGradient>
          <Text style={styles.stageTitle} numberOfLines={1}>
            Sem permissão
          </Text>
          <Text style={styles.stageSubtitle}>
            Sem acesso autorizado, não conseguimos sincronizar suas métricas automaticamente
          </Text>
          <View style={styles.successButtonWrap}>
            <PrimaryButton label="Tentar novamente" onPress={handleRetry} />
            <Pressable onPress={handleDismiss} style={styles.laterButton}>
              <Text style={styles.laterButtonText}>Agora não</Text>
            </Pressable>
          </View>
        </View>
      )
    }

    if (step === 'manage' && connection) {
      const syncedPermissions = HEALTH_PERMISSIONS.filter((item) =>
        connection.enabledPermissions?.includes(item.id),
      )

      return (
        <View style={styles.manageContent}>
          <View style={styles.manageStatusRow}>
            <Ionicons name="checkmark-circle" size={16} color="#34d399" />
            <Text style={styles.manageStatusText}>Conectado</Text>
          </View>

          {connection.lastSyncedAt ? (
            <Text style={styles.syncHint}>{formatLastSync(connection.lastSyncedAt)}</Text>
          ) : null}

          {connection.connectedDeviceName ? (
            <View style={styles.manageInlineRow}>
              <MaterialCommunityIcons name="watch-variant" size={16} color={integration.accentColor} />
              <Text style={styles.manageInlineText}>{connection.connectedDeviceName}</Text>
            </View>
          ) : null}

          {syncedPermissions.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Dados sincronizados</Text>
              {syncedPermissions.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.manageInlineRow,
                    index < syncedPermissions.length - 1 && styles.manageInlineRowBorder,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={16}
                    color={integration.accentColor}
                  />
                  <Text style={styles.manageInlineText}>{item.label}</Text>
                </View>
              ))}
            </>
          ) : null}

          <View style={styles.actionsBlock}>
            <PrimaryButton label="Desconectar" onPress={handleDisconnect} />
          </View>
        </View>
      )
    }

    if (step === 'devices') {
      return (
        <View style={styles.devicesContent}>
          {MOCK_BLUETOOTH_DEVICES.map((device, index) => (
            <Pressable
              key={device.id}
              onPress={() => handleSelectDevice(device.id)}
              style={({ pressed }) => [
                styles.deviceRow,
                index < MOCK_BLUETOOTH_DEVICES.length - 1 && styles.deviceRowBorder,
                pressed && styles.deviceRowPressed,
              ]}
            >
              <MaterialCommunityIcons
                name={device.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={20}
                color={integration.accentColor}
              />
              <View style={styles.deviceTextCol}>
                <Text style={styles.deviceName}>{device.name}</Text>
              </View>
              <SignalBars level={device.signal} />
              <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
            </Pressable>
          ))}
        </View>
      )
    }

    if (isDevicesFlow) {
      return (
        <View style={styles.introContent}>
          <InfoRow
            icon="bluetooth"
            title="Conexão por Bluetooth"
            description="Ative o Bluetooth e deixe o dispositivo perto do celular"
            accentColor={integration.accentColor}
          />
          <ListDivider />
          <InfoRow
            icon="watch-variant"
            title="Dispositivos compatíveis"
            description="Smartwatches, pulseiras e balanças com sincronização direta"
            accentColor={integration.accentColor}
          />
          <ListDivider />
          <InfoRow
            icon="shield-check"
            title="Você no controle"
            description="O pareamento pode ser removido a qualquer momento"
            accentColor={integration.accentColor}
          />

          <View style={styles.actionsBlock}>
            <PrimaryButton label="Buscar dispositivos" onPress={handleSearchDevices} />
            <Pressable onPress={handleDismiss} style={styles.laterButton}>
              <Text style={styles.laterButtonText}>Agora não</Text>
            </Pressable>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.introContent}>
        <InfoRow
          icon="sync"
          title="O que sincroniza"
          description="Passos, distância, frequência cardíaca e dados corporais"
          accentColor={integration.accentColor}
        />
        <ListDivider />
        <InfoRow
          icon="cellphone-check"
          title="Como funciona"
          description="Usamos o app de saúde do celular, sem parear Bluetooth"
          accentColor={integration.accentColor}
        />
        <ListDivider />
        <InfoRow
          icon="shield-lock"
          title="Privacidade"
          description="Você escolhe o que compartilhar e pode revogar depois"
          accentColor={integration.accentColor}
        />

        <Text style={styles.sectionLabel}>Compartilhar</Text>
        <View style={styles.permissionsList}>
          {HEALTH_PERMISSIONS.map((permission, index) => (
            <PermissionToggle
              key={permission.id}
              label={permission.label}
              icon={permission.icon}
              enabled={enabledPermissions.includes(permission.id)}
              accentColor={integration.accentColor}
              onToggle={() => togglePermission(permission.id)}
              isLast={index === HEALTH_PERMISSIONS.length - 1}
            />
          ))}
        </View>

        <View style={styles.actionsBlock}>
          <PrimaryButton
            label="Autorizar conexão"
            onPress={handleAuthorize}
            disabled={!canAuthorize}
          />
          <Pressable onPress={handleDismiss} style={styles.laterButton}>
            <Text style={styles.laterButtonText}>Agora não</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const showHeader = !['loading', 'scanning', 'pairing', 'success', 'denied'].includes(step)

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
            style={StyleSheet.absoluteFillObject}
          />
          {Platform.OS === 'ios' ? (
            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : null}

          <LinearGradient
            colors={[...integration.gradient]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          {showHeader ? (
            <View style={styles.headerRow}>
              <LinearGradient
                colors={[...integration.gradient]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={styles.headerIconOrb}
              >
                <IntegrationIcon integration={integration} size={20} />
              </LinearGradient>

              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                {getHeaderTitle(step, integration)}
              </Text>

              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {renderContent()}
          </ScrollView>
        </Animated.View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topAccent: {
    height: 3,
    width: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    marginTop: 8,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    minHeight: 36,
  },
  headerIconOrb: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexShrink: 0,
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(255, 107, 0, 0.14)',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  introContent: {
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  infoIcon: {
    marginTop: 1,
    width: 20,
  },
  infoTextCol: {
    flex: 1,
    gap: 3,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  infoDescription: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  listDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 4,
  },
  permissionsList: {
    marginBottom: 4,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  permissionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  permissionRowPressed: {
    opacity: 0.7,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  actionsBlock: {
    marginTop: 20,
    gap: 2,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  laterButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  centerStage: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 12,
    gap: 12,
  },
  stageTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: '100%',
  },
  stageSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  bluetoothPulse: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bluetoothPulseInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successButtonWrap: {
    width: '100%',
    gap: 4,
    marginTop: 8,
  },
  devicesContent: {
    paddingBottom: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  deviceRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  deviceRowPressed: {
    opacity: 0.7,
  },
  deviceTextCol: {
    flex: 1,
  },
  deviceName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
  },
  signalBarActive: {
    backgroundColor: '#34d399',
  },
  signalBarInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  manageContent: {
    paddingBottom: 8,
  },
  manageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  manageStatusText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '600',
  },
  syncHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  manageInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  manageInlineRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  manageInlineText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
})
