import { MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Platform, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg'
import { colors } from '../theme/colors'
import { SkeletonBone } from './SkeletonBone'

const SCORE = 87
const PROGRESS = SCORE / 100
const RING_SIZE = 78
const RING_STROKE = 4

type MetricConfig = {
  label: string
  value: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  gradient: readonly [string, string]
}

const METRICS: MetricConfig[] = [
  {
    label: 'Coração',
    value: 'Bom',
    icon: 'heart-pulse',
    gradient: ['#ff8533', '#ff6b00'],
  },
  {
    label: 'Pressão',
    value: 'Normal',
    icon: 'water-percent',
    gradient: ['#fbbf24', '#f59e0b'],
  },
  {
    label: 'Estresse',
    value: 'Baixo',
    icon: 'emoticon-happy-outline',
    gradient: ['#34d399', '#10b981'],
  },
]

function HealthScoreRing() {
  const radius = (RING_SIZE - RING_STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - PROGRESS)

  return (
    <View style={styles.ringWrap}>
      <View style={styles.ringGlow} pointerEvents="none" />

      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <SvgLinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffb366" />
            <Stop offset="50%" stopColor="#ff8533" />
            <Stop offset="100%" stopColor="#ff6b00" />
          </SvgLinearGradient>
        </Defs>

        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={RING_STROKE}
          fill="none"
        />

        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>

      <View style={styles.ringCenter}>
        <Text style={styles.scoreValue}>{SCORE}</Text>
        <Text style={styles.scoreLabel}>índice geral</Text>
        <Text style={styles.scoreStatus}>Muito bom</Text>
      </View>
    </View>
  )
}

function MetricItem({ metric }: { metric: MetricConfig }) {
  return (
    <View style={styles.metricItem}>
      <LinearGradient
        colors={[...metric.gradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.metricIconOrb}
      >
        <MaterialCommunityIcons name={metric.icon} size={12} color="#fff" />
      </LinearGradient>

      <View style={styles.metricTextCol}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text style={styles.metricValue}>{metric.value}</Text>
      </View>
    </View>
  )
}

export function HealthSummaryCard({ skeleton = false }: { skeleton?: boolean }) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[
          'rgba(255, 133, 51, 0.42)',
          'rgba(255, 107, 0, 0.18)',
          'rgba(255, 255, 255, 0.06)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.cardInner}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : null}

          <LinearGradient
            colors={['rgba(28, 28, 36, 0.96)', 'rgba(14, 14, 20, 0.98)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {skeleton ? (
            <>
              <SkeletonBone width="58%" height={14} borderRadius={6} />
              <View style={styles.mainRow}>
                <SkeletonBone width={RING_SIZE} height={RING_SIZE} borderRadius={RING_SIZE / 2} />
                <View style={styles.contentCol}>
                  <SkeletonBone width="100%" height={13} borderRadius={5} />
                  <SkeletonBone width="88%" height={13} borderRadius={5} />
                  <View style={styles.metricsRow}>
                    {METRICS.map((metric) => (
                      <View key={metric.label} style={styles.metricItem}>
                        <SkeletonBone width={24} height={24} borderRadius={8} />
                        <View style={styles.metricTextCol}>
                          <SkeletonBone width={42} height={8} borderRadius={4} />
                          <SkeletonBone width={34} height={9} borderRadius={4} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Resumo da sua saúde</Text>

              <View style={styles.mainRow}>
                <HealthScoreRing />

                <View style={styles.contentCol}>
                  <Text style={styles.messageText}>
                    Você está cuidando muito bem da sua saúde! Continue assim.
                  </Text>

                  <View style={styles.metricsRow}>
                    {METRICS.map((metric) => (
                      <MetricItem key={metric.label} metric={metric} />
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 4,
  },
  cardBorder: {
    borderRadius: 22,
    padding: 1,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
  },
  cardInner: {
    borderRadius: 21,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  contentCol: {
    flex: 1,
    gap: 10,
    paddingTop: 2,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGlow: {
    position: 'absolute',
    width: RING_SIZE - 8,
    height: RING_SIZE - 8,
    borderRadius: (RING_SIZE - 8) / 2,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '500',
  },
  scoreStatus: {
    color: colors.primaryLight,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  messageText: {
    color: 'rgba(245, 245, 247, 0.82)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
    letterSpacing: -0.1,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: '30%',
    flexGrow: 1,
  },
  metricIconOrb: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  metricTextCol: {
    flex: 1,
    gap: 1,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '500',
  },
  metricValue: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
})
