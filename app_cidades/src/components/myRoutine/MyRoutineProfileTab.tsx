import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { MY_ROUTINE_IDEAL_ACTIVITY_OPTIONS } from '../../types/myRoutine'
import type { MyRoutineWeeklyHistoryPoint } from '../../utils/myRoutineHistoryStats'
import { summarizeHistoryPoint } from '../../utils/myRoutineHistoryStats'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'
import {  MyRoutineHistoryBarChart,
  MyRoutineHistoryBarLegend,
} from './MyRoutineHistoryBarChart'

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'

type PreferencesSummary = {
  notifications: string
  schedule: string
  intensity: string
}

export type MyRoutineProfileTabProps = {
  bottomPadding: number
  isLoading: boolean
  mapView: 'current' | 'ideal' | 'both'
  onMapViewChange: (view: 'current' | 'ideal' | 'both') => void
  currentActivityLabels: string[]
  idealActivityIds: string[]
  essentials: string[]
  preferencesSummary: PreferencesSummary
  historySeries: MyRoutineWeeklyHistoryPoint[]
  onEditEssentials: () => void
  onOpenPreferences: () => void
  onSelectHistoryWeek: (point: MyRoutineWeeklyHistoryPoint) => void
  onOpenHowItWorks?: () => void
  onOpenPrivacy: () => void
  onOpenRefresh: () => void
  onRequestFullReset: () => void
}

function labelForIdealId(id: string) {
  return MY_ROUTINE_IDEAL_ACTIVITY_OPTIONS.find((option) => option.id === id)?.label ?? id
}

function ChipList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  const styles = useThemedStyles(createStyles)
  if (items.length === 0) {
    return <Text style={styles.emptyChip}>{emptyLabel}</Text>
  }

  return (
    <View style={styles.chipWrap}>
      {items.map((item) => (
        <View key={item} style={styles.chip}>
          <Text style={styles.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

export function MyRoutineProfileTab({
  bottomPadding,
  isLoading,
  mapView,
  onMapViewChange,
  currentActivityLabels,
  idealActivityIds,
  essentials,
  preferencesSummary,
  historySeries,
  onEditEssentials,
  onOpenPreferences,
  onSelectHistoryWeek,
  onOpenHowItWorks,
  onOpenPrivacy,
  onOpenRefresh,
  onRequestFullReset,
}: MyRoutineProfileTabProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={ACCENT_LIGHT} />
      </View>
    )
  }

  const idealLabels = idealActivityIds.map(labelForIdealId)
  const essentialLabels = essentials.map(labelForIdealId)
  const showCurrent = mapView === 'current' || mapView === 'both'
  const showIdeal = mapView === 'ideal' || mapView === 'both'

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Rotina atual vs ideal, preferências e histórico.</Text>

      {/* A — Mapa atual vs ideal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mapa da rotina</Text>
        <View style={styles.toggleRow}>
          {(
            [
              { id: 'both', label: 'Colunas' },
              { id: 'current', label: 'Atual' },
              { id: 'ideal', label: 'Ideal' },
            ] as const
          ).map((option) => {
            const active = mapView === option.id
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  onMapViewChange(option.id)
                }}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View style={[styles.mapGrid, mapView !== 'both' && styles.mapGridSingle]}>
          {showCurrent ? (
            <View style={styles.mapCol}>
              <Text style={styles.mapColTitle}>Atual</Text>
              <ChipList items={currentActivityLabels} emptyLabel="Configure na rotina atual" />
            </View>
          ) : null}
          {showIdeal ? (
            <View style={styles.mapCol}>
              <Text style={styles.mapColTitle}>Ideal</Text>
              <ChipList items={idealLabels} emptyLabel="Defina na rotina ideal" />
            </View>
          ) : null}
        </View>
      </View>

      {/* B — Rotina mínima */}
      <Pressable
        onPress={onEditEssentials}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <LinearGradient
          colors={['rgba(217, 70, 239, 0.14)', 'rgba(240, 171, 252, 0.06)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Rotina mínima</Text>
            <Ionicons name="create-outline" size={18} color={ACCENT_LIGHT} />
          </View>
          <Text style={styles.cardHint}>Até 5 essenciais · toque para editar</Text>
          <ChipList items={essentialLabels} emptyLabel="Nenhum essencial definido" />
        </LinearGradient>
      </Pressable>

      {/* C — Preferências */}
      <Pressable
        onPress={onOpenPreferences}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.plainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Preferências</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </View>
          <View style={styles.metaGrid}>
            <MetaPill label="Notificações" value={preferencesSummary.notifications} />
            <MetaPill label="Horário" value={preferencesSummary.schedule} />
            <MetaPill label="Intensidade" value={preferencesSummary.intensity} />
          </View>
        </View>
      </Pressable>

      {/* D — Histórico 4 semanas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas 4 semanas</Text>
        <View style={styles.historyCard}>
          <MyRoutineHistoryBarChart series={historySeries} onSelectWeek={onSelectHistoryWeek} />
          <MyRoutineHistoryBarLegend series={historySeries} />
          <View style={styles.historyList}>
            {historySeries
              .slice()
              .reverse()
              .map((point) => (
                <Pressable
                  key={point.weekStartIso}
                  onPress={() => onSelectHistoryWeek(point)}
                  style={({ pressed }) => [styles.historyRow, pressed && styles.cardPressed]}
                >
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyWeek}>{point.weekLabel}</Text>
                    <Text style={styles.historySummary}>{summarizeHistoryPoint(point)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                </Pressable>
              ))}
          </View>
        </View>
      </View>

      {/* E — Ajuda */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajuda</Text>
        <View style={styles.helpCard}>
          {onOpenHowItWorks ? (
            <HelpRow
              icon="help-circle-outline"
              title="Como funciona"
              description="Rotina mínima, janelas e revisão semanal"
              onPress={onOpenHowItWorks}
            />
          ) : null}
          <HelpRow
            icon="shield-checkmark-outline"
            title="Privacidade"
            description="Como seus dados de rotina são tratados"
            onPress={onOpenPrivacy}
          />
          <HelpRow
            icon="refresh-outline"
            title="Refazer onboarding"
            description="Atualizar contexto e rotina ideal"
            onPress={onOpenRefresh}
          />
          <HelpRow
            icon="trash-outline"
            title="Recomeçar do zero"
            description="Apaga plano, histórico e preferências"
            onPress={onRequestFullReset}
            danger
            last
          />
        </View>
      </View>
    </ScrollView>
  )
}

function MetaPill({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillLabel}>{label}</Text>
      <Text style={styles.metaPillValue}>{value}</Text>
    </View>
  )
}

function HelpRow({
  icon,
  title,
  description,
  onPress,
  danger = false,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  onPress: () => void
  danger?: boolean
  last?: boolean
}) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.helpRow,
        !last && styles.helpRowBorder,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.helpIcon, danger && styles.helpIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? '#fca5a5' : ACCENT_LIGHT} />
      </View>
      <View style={styles.helpCopy}>
        <Text style={[styles.helpTitle, danger && styles.helpTitleDanger]}>{title}</Text>
        <Text style={styles.helpDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  section: { gap: 10 },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(217, 70, 239, 0.14)',
    borderColor: 'rgba(240, 171, 252, 0.35)',
  },
  toggleBtnText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: ACCENT_LIGHT,
  },
  mapGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  mapGridSingle: {
    flexDirection: 'column',
  },
  mapCol: {
    flex: 1,
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mapColTitle: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 70, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.2)',
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyChip: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.9 },
  cardGradient: {
    padding: 14,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
  },
  plainCard: {
    padding: 14,
    gap: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  cardHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexGrow: 1,
    minWidth: '30%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 2,
  },
  metaPillLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaPillValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  historyCard: {
    padding: 14,
    borderRadius: 16,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  historyList: { gap: 0 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  historyCopy: { flex: 1, gap: 2 },
  historyWeek: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  historySummary: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  helpCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  helpRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  helpIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 70, 239, 0.14)',
  },
  helpIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  helpCopy: { flex: 1, gap: 2 },
  helpTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  helpTitleDanger: { color: '#fca5a5' },
  helpDescription: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
}
}

