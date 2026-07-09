import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  setNavigationBarBackgroundColorAsync,
  setNavigationBarButtonStyleAsync,
} from '../adapters/navigationBar'
import { AppSystemBars } from '../components/platform/AppSystemBars'
import { AppLoadingState } from '../components/AppLoadingState'
import { LiveLocationTrackingMap } from '../components/runWalk/liveShare/LiveLocationTrackingMap'
import { LiveShareParticipantAvatar } from '../components/runWalk/liveShare/LiveShareParticipantAvatar'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useRunWalkLiveShareViewer } from '../hooks/useRunWalkLiveShareViewer'
import { colors } from '../theme/colors'
import { getLiveShareViewerRouteParams } from '../types/auth'
import { isValidLiveShareToken, normalizeLiveShareToken } from '../utils/runWalkLiveShareToken'
import {
  calculateLiveShareAverageSpeedKmh,
  formatAverageSpeedKmh,
  getParticipantFirstName,
} from '../utils/runWalkLiveShareStats'

function formatUpdatedAt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Tela exclusiva para quem recebeu o link de acompanhamento — não é usada pelo corredor/caminhante. */
export function RunWalkLiveLocationViewerScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, goBack, canGoBack, navigateTo } = useAuth()
  const { token: routeToken } = getLiveShareViewerRouteParams(routeParams)

  const shareToken = useMemo(() => normalizeLiveShareToken(routeToken ?? ''), [routeToken])
  const hasValidLink = isValidLiveShareToken(shareToken)

  const { snapshot, isLoading, error, lastUpdatedAt, refresh, refreshIntervalMs } =
    useRunWalkLiveShareViewer({
      token: shareToken,
      enabled: hasValidLink,
    })

  useAndroidBackHandler(() => {
    handleClose()
    return true
  })

  function handleClose() {
    if (canGoBack()) {
      goBack()
      return
    }
    navigateTo('home')
  }

  const firstName = snapshot ? getParticipantFirstName(snapshot.participantName) : ''
  const averageSpeedKmh = useMemo(
    () => (snapshot ? calculateLiveShareAverageSpeedKmh(snapshot.points) : null),
    [snapshot],
  )
  const averageSpeedLabel = formatAverageSpeedKmh(averageSpeedKmh)
  const hasMapPoints = Boolean(snapshot && snapshot.points.length > 0)
  const [bottomInsetPx, setBottomInsetPx] = useState(220)

  useEffect(() => {
    void setNavigationBarBackgroundColorAsync('#000000')
    void setNavigationBarButtonStyleAsync('light')
  }, [])

  const topInsetPx = Math.max(insets.top, 12) + 52

  return (
    <View style={styles.root}>
      <AppSystemBars style="light" />

      {insets.top > 0 ? (
        <View pointerEvents="none" style={[styles.safeAreaBand, { height: insets.top }]} />
      ) : null}
      {insets.bottom > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.safeAreaBand, styles.safeAreaBandBottom, { height: insets.bottom }]}
        />
      ) : null}

      <View style={styles.mapLayer}>
        {hasValidLink && hasMapPoints ? (
          <LiveLocationTrackingMap
            points={snapshot!.points}
            participantLabel={firstName}
            participantName={snapshot!.participantName}
            participantPhotoUrl={snapshot!.participantPhotoUrl}
            activityLabel={snapshot!.activityName}
            fullscreen
            bottomInsetPx={bottomInsetPx}
            topInsetPx={topInsetPx}
          />
        ) : (
          <LinearGradient
            colors={[colors.backgroundElevated, colors.background, colors.background]}
            style={StyleSheet.absoluteFillObject}
          />
        )}
      </View>

      <LinearGradient
        colors={['#000000', 'transparent', 'transparent']}
        locations={[0, 0.18, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={28} tint="light" style={styles.backBtnBlur}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </BlurView>
          ) : (
            <View style={styles.backBtnFallback}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </View>
          )}
        </Pressable>

        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, snapshot?.isActive ? styles.liveDotOn : styles.liveDotOff]} />
          <Text style={styles.liveBadgeText}>Acompanhando</Text>
        </View>
      </View>

      <View
        style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
        onLayout={(event) => {
          setBottomInsetPx(Math.ceil(event.nativeEvent.layout.height) + 16)
        }}
      >
        {!hasValidLink ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorTitle}>Link inválido</Text>
            <Text style={styles.errorText}>
              Este link de acompanhamento não é válido. Peça para a pessoa compartilhar novamente.
            </Text>
          </View>
        ) : null}

        {hasValidLink && error ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {hasValidLink && isLoading && !snapshot ? (
          <View style={styles.messageCard}>
            <AppLoadingState style={styles.inlineLoading} />
          </View>
        ) : null}

        {hasValidLink && snapshot ? (
          <>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={36} tint="light" style={styles.statsCard}>
                <StatsContent
                  firstName={firstName}
                  participantName={snapshot.participantName}
                  participantPhotoUrl={snapshot.participantPhotoUrl}
                  averageSpeedLabel={averageSpeedLabel}
                  lastUpdatedLabel={formatUpdatedAt(lastUpdatedAt)}
                  isActive={snapshot.isActive}
                />
              </BlurView>
            ) : (
              <View style={[styles.statsCard, styles.statsCardAndroid]}>
                <StatsContent
                  firstName={firstName}
                  participantName={snapshot.participantName}
                  participantPhotoUrl={snapshot.participantPhotoUrl}
                  averageSpeedLabel={averageSpeedLabel}
                  lastUpdatedLabel={formatUpdatedAt(lastUpdatedAt)}
                  isActive={snapshot.isActive}
                />
              </View>
            )}

            {!hasMapPoints ? (
              <View style={styles.waitingCard}>
                <Text style={styles.waitingTitle}>Aguardando localização</Text>
                <Text style={styles.waitingText}>
                  A posição aparecerá no mapa em até {Math.round(refreshIntervalMs / 60000)}{' '}
                  minutos.
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void refresh()}
              style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Atualizar agora"
            >
              <Ionicons name="refresh" size={16} color={colors.text} />
              <Text style={styles.refreshLabel}>Atualizar agora</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  )
}

function StatsContent({
  firstName,
  participantName,
  participantPhotoUrl,
  averageSpeedLabel,
  lastUpdatedLabel,
  isActive,
}: {
  firstName: string
  participantName: string
  participantPhotoUrl?: string | null
  averageSpeedLabel: string
  lastUpdatedLabel: string
  isActive: boolean
}) {
  return (
    <View style={styles.statsContent}>
      <View style={styles.statsHeaderRow}>
        <LiveShareParticipantAvatar
          name={participantName}
          photoUrl={participantPhotoUrl}
          size={48}
        />
        <Text style={styles.firstName}>{firstName}</Text>
      </View>

      <View style={styles.statsMetrics}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Velocidade média</Text>
          <Text style={styles.metricValue}>{averageSpeedLabel}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Atualizado</Text>
          <Text style={styles.metricValue}>{lastUpdatedLabel}</Text>
        </View>
      </View>

      <Text style={[styles.statusHint, isActive ? styles.statusHintLive : styles.statusHintOff]}>
        {isActive ? 'Localização sendo atualizada automaticamente' : 'Atividade encerrada'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeAreaBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#000000',
    zIndex: 2,
  },
  safeAreaBandBottom: {
    top: undefined,
    bottom: 0,
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  backBtnPressed: {
    opacity: 0.85,
  },
  backBtnBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  backBtnFallback: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveDotOn: {
    backgroundColor: '#22c55e',
  },
  liveDotOff: {
    backgroundColor: colors.textSubtle,
  },
  liveBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    paddingHorizontal: 16,
    gap: 10,
  },
  messageCard: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 20, 24, 0.92)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
  inlineLoading: {
    paddingVertical: 12,
  },
  statsCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statsCardAndroid: {
    backgroundColor: 'rgba(16, 16, 20, 0.94)',
  },
  statsContent: {
    padding: 18,
    gap: 14,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  firstName: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  statsMetrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  metricBlock: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  metricValue: {
    color: '#ffb366',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.surface,
  },
  statusHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusHintLive: {
    color: '#15803d',
  },
  statusHintOff: {
    color: colors.textSubtle,
  },
  waitingCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 20, 24, 0.88)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 4,
  },
  waitingTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  waitingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(16, 16, 20, 0.88)',
  },
  refreshBtnPressed: {
    opacity: 0.85,
  },
  refreshLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
})
