import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  type MentalHealthCheckInCardData,
  isCrisisCheckInMood,
  type MentalHealthMoodLevelId,
  type MentalHealthTodayState,
} from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import {
  buildCheckInSummarySentence,
  buildCheckInSupportMessage,
} from '../../utils/mentalHealthCheckIn'
import type { MentalHealthJourneyState } from '../../utils/mentalHealthJourney'
import { MentalHealthJourneyTimeline } from './MentalHealthJourneyTimeline'
import { MentalHealthMoodIcon } from './MentalHealthMoodIcon'
import { MentalHealthMoodPicker } from './MentalHealthMoodPicker'

type MentalHealthTodayTabProps = {
  bottomPadding: number
  todayState: MentalHealthTodayState
  journey: MentalHealthJourneyState
  crisisBlocksPlan: boolean
  microPlanLoading?: boolean
  microPlanError?: string | null
  onStartInitialAnamnesis: () => void
  onStartExtendedAnamnesis: () => void
  onQuickMoodSelect: (mood: MentalHealthMoodLevelId) => void
  onViewRecentRecords: () => void
  onViewTodayRecord: () => void
  onExplainMessage: () => void
  onOpenHowItWorks: () => void
  onCreateMicroPlan: () => void
  onOpenTodayPlan: () => void
  onOpenCrisisSupport: () => void
  onFeelingBetter?: () => void
}

function PrimaryAction({
  label,
  onPress,
  subtle = false,
  crisis = false,
  loading = false,
  disabled = false,
  accessibilityLabel,
}: {
  label: string
  onPress: () => void
  subtle?: boolean
  crisis?: boolean
  loading?: boolean
  disabled?: boolean
  accessibilityLabel?: string
}) {
  return (
    <Pressable
      onPress={() => {
        if (loading || disabled) return
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: loading || disabled, busy: loading }}
      style={({ pressed }) => [
        styles.primaryAction,
        subtle && styles.primaryActionSubtle,
        crisis && styles.primaryActionCrisis,
        (pressed && !loading && !disabled) && styles.pressed,
        (loading || disabled) && styles.primaryActionDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={subtle ? colors.text : '#1a1208'} size="small" />
      ) : (
        <>
          <Text
            style={[
              styles.primaryActionText,
              subtle && styles.primaryActionTextSubtle,
              crisis && styles.primaryActionTextCrisis,
            ]}
          >
            {label}
          </Text>
          {!subtle && !crisis ? (
            <Ionicons name="arrow-forward" size={18} color="#1a1208" />
          ) : crisis ? (
            <Ionicons name="arrow-forward" size={18} color="#fda4af" />
          ) : null}
        </>
      )}
    </Pressable>
  )
}

function GhostLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.ghostLink, pressed && styles.pressed]}
    >
      <Text style={styles.ghostLinkText}>{label}</Text>
    </Pressable>
  )
}

function TellUsMorePhase({
  journey,
  onStartExtendedAnamnesis,
}: {
  journey: MentalHealthJourneyState
  onStartExtendedAnamnesis: () => void
}) {
  return (
    <View style={styles.tellUsMoreBlock}>
      <Text style={styles.tellUsMoreTitle}>Conte-nos mais sobre você</Text>
      <Text style={styles.tellUsMoreBody}>
        Queremos direcionar seu cuidado com mais precisão. Se tiver alguns minutos, responda
        perguntas extras — no seu ritmo, quando fizer sentido.
      </Text>
      {journey.extendedAnamnesisPercent > 0 ? (
        <Text style={styles.tellUsMoreMeta}>
          {journey.extendedAnamnesisPercent}% do perfil ampliado concluído
        </Text>
      ) : null}
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onStartExtendedAnamnesis()
        }}
        style={({ pressed }) => [styles.tellUsMoreButton, pressed && styles.pressed]}
      >
        <Text style={styles.tellUsMoreButtonText}>
          {journey.extendedAnamnesisPercent > 0 ? 'Continuar contando mais' : 'Responder mais perguntas'}
        </Text>
      </Pressable>
    </View>
  )
}

function KnowYouPhase({
  journey,
  onStartInitialAnamnesis,
  onOpenHowItWorks,
}: {
  journey: MentalHealthJourneyState
  onStartInitialAnamnesis: () => void
  onOpenHowItWorks: () => void
}) {
  return (
    <View style={styles.phaseBlock}>
      <Text style={styles.eyebrow}>Conhecer você</Text>
      <Text style={styles.heroTitle}>Antes do check-in{'\n'}de hoje</Text>
      <Text style={styles.heroBody}>
        Precisamos de algumas respostas iniciais para personalizar seu cuidado com segurança.
        São 11 perguntas rápidas — cerca de 3 minutos.
      </Text>

      {journey.initialAnamnesisPercent > 0 ? (
        <Text style={styles.progressMeta}>
          {journey.initialAnamnesisPercent}% das 11 perguntas iniciais concluídas
        </Text>
      ) : null}

      <PrimaryAction label="Responder as 11 perguntas" onPress={onStartInitialAnamnesis} />
      <GhostLink label="Como funciona" onPress={onOpenHowItWorks} />
    </View>
  )
}

function CheckInPhase({
  onQuickMoodSelect,
}: {
  onQuickMoodSelect: (mood: MentalHealthMoodLevelId) => void
}) {
  return (
    <View style={styles.phaseBlock}>
      <Text style={styles.eyebrow}>Momento de hoje</Text>
      <Text style={styles.heroTitle}>Como você está{'\n'}neste instante?</Text>
      <Text style={styles.heroBody}>
        Escolha o rostinho mais próximo do seu momento. Em seguida, algumas perguntas rápidas
        ajudam a entender o que está por trás.
      </Text>

      <View style={styles.moodStage}>
        <MentalHealthMoodPicker onSelect={onQuickMoodSelect} />
      </View>
    </View>
  )
}

function FeelingBetterLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      accessibilityRole="button"
      accessibilityLabel="Estou melhor — retomar cuidados"
      style={({ pressed }) => [styles.feelingBetterLink, pressed && styles.pressed]}
    >
      <Text style={styles.feelingBetterLinkText}>Estou melhor</Text>
    </Pressable>
  )
}

function CrisisPhase({
  onOpenCrisisSupport,
  onFeelingBetter,
}: {
  onOpenCrisisSupport: () => void
  onFeelingBetter?: () => void
}) {
  return (
    <View style={styles.phaseBlock}>
      <Text style={styles.crisisEyebrow}>Apoio agora</Text>
      <Text style={styles.heroTitle}>Você não precisa{'\n'}passar por isso sozinho(a).</Text>
      <Text style={styles.heroBody}>
        O que você compartilhou indica que falar com alguém agora pode fazer diferença. Separamos
        opções de apoio — sem julgamento e sem pressa.
      </Text>
      <PrimaryAction
        label="Ver opções de apoio"
        onPress={onOpenCrisisSupport}
        crisis
        accessibilityLabel="Ver opções de apoio em situação de crise"
      />
      <Text style={styles.crisisNote}>
        As sugestões automáticas de atividades estão pausadas enquanto você busca apoio.
      </Text>
      {onFeelingBetter ? <FeelingBetterLink onPress={onFeelingBetter} /> : null}
    </View>
  )
}

function ReflectPhase({
  checkInCard,
  crisisBlocksPlan,
  hasTodayPlan,
  microPlanLoading,
  microPlanError,
  onCreateMicroPlan,
  onOpenTodayPlan,
  onViewRecentRecords,
  onViewTodayRecord,
  onExplainMessage,
  onOpenCrisisSupport,
  onFeelingBetter,
}: {
  checkInCard: MentalHealthCheckInCardData
  crisisBlocksPlan: boolean
  hasTodayPlan: boolean
  microPlanLoading?: boolean
  microPlanError?: string | null
  onCreateMicroPlan: () => void
  onOpenTodayPlan: () => void
  onViewRecentRecords: () => void
  onViewTodayRecord: () => void
  onExplainMessage: () => void
  onOpenCrisisSupport: () => void
  onFeelingBetter?: () => void
}) {
  const entry = checkInCard.latestEntry
  if (!entry) return null

  const summary = buildCheckInSummarySentence(entry)
  const support = buildCheckInSupportMessage(entry)
  const isChange = checkInCard.state === 'relevant-change'
  const showCrisisSupport = crisisBlocksPlan || isCrisisCheckInMood(entry.mood)

  return (
    <View style={styles.phaseBlock}>
      <Text style={styles.eyebrow}>{isChange ? 'Algo mudou' : 'Registrado hoje'}</Text>

      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onViewTodayRecord()
        }}
        style={({ pressed }) => [styles.recordTapArea, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Ver registro de hoje"
      >
        <View style={styles.moodHero}>
          <MentalHealthMoodIcon mood={entry.mood} size="hero" />
        </View>

        <Text style={styles.quoteText}>{summary}</Text>
        <Text style={styles.supportText}>{support}</Text>
        <Text style={styles.recordTapHint}>Toque para ver o registro completo</Text>
      </Pressable>

      {isChange && checkInCard.relevantChangeMessage ? (
        <Text style={styles.changeNote}>{checkInCard.relevantChangeMessage}</Text>
      ) : null}

      <PrimaryAction
        label={
          showCrisisSupport
            ? 'Ver opções de apoio'
            : hasTodayPlan
              ? 'Ver seus cuidados de hoje'
              : microPlanLoading
                ? 'Montando seus cuidados…'
                : 'Montar cuidados para hoje'
        }
        crisis={showCrisisSupport}
        loading={!showCrisisSupport && !hasTodayPlan && microPlanLoading}
        disabled={!showCrisisSupport && !hasTodayPlan && microPlanLoading}
        onPress={
          showCrisisSupport
            ? onOpenCrisisSupport
            : hasTodayPlan
              ? onOpenTodayPlan
              : onCreateMicroPlan
        }
        accessibilityLabel={
          showCrisisSupport
            ? 'Ver opções de apoio em situação de crise'
            : hasTodayPlan
              ? 'Ver seus cuidados de hoje'
              : 'Montar cuidados personalizados para hoje'
        }
      />

      {microPlanError && !showCrisisSupport && !hasTodayPlan ? (
        <View style={styles.planErrorBlock}>
          <Text style={styles.planErrorText}>{microPlanError}</Text>
          <GhostLink label="Tentar novamente" onPress={onCreateMicroPlan} />
        </View>
      ) : null}

      {crisisBlocksPlan && onFeelingBetter ? (
        <FeelingBetterLink onPress={onFeelingBetter} />
      ) : null}

      <View style={styles.secondaryLinks}>
        <GhostLink label="Por que esta mensagem?" onPress={onExplainMessage} />
        <GhostLink label="Ver registros recentes" onPress={onViewRecentRecords} />
      </View>
    </View>
  )
}

function CareTodayPhase({
  journey,
  crisisBlocksPlan,
  onOpenTodayPlan,
  onQuickMoodSelect,
  onOpenCrisisSupport,
  checkInDone,
  onFeelingBetter,
}: {
  journey: MentalHealthJourneyState
  crisisBlocksPlan: boolean
  onOpenTodayPlan: () => void
  onQuickMoodSelect: (mood: MentalHealthMoodLevelId) => void
  onOpenCrisisSupport: () => void
  checkInDone: boolean
  onFeelingBetter?: () => void
}) {
  const remaining = Math.max(journey.planActivitiesTotal - journey.planActivitiesCompleted, 0)

  if (crisisBlocksPlan) {
    return (
      <CrisisPhase onOpenCrisisSupport={onOpenCrisisSupport} onFeelingBetter={onFeelingBetter} />
    )
  }

  return (
    <View style={styles.phaseBlock}>
      <Text style={styles.eyebrow}>Seu dia</Text>
      <Text style={styles.heroTitle}>
        {remaining > 0 ? 'Pequenos cuidados\nesperando por você.' : 'Você cuidou de\nvocê hoje.'}
      </Text>
      <Text style={styles.heroBody}>
        {remaining > 0
          ? `${journey.planActivitiesCompleted} de ${journey.planActivitiesTotal} concluídos. Um passo de cada vez.`
          : 'O que você fez já foi registrado. Se quiser, pode registrar de novo como está agora.'}
      </Text>

      {remaining > 0 ? (
        <PrimaryAction label="Ver seus cuidados de hoje" onPress={onOpenTodayPlan} />
      ) : (
        <PrimaryAction label="Abrir plano de hoje" onPress={onOpenTodayPlan} subtle />
      )}

      {!checkInDone ? (
        <View style={styles.miniCheckIn}>
          <Text style={styles.miniCheckInLabel}>Ainda não registrou hoje?</Text>
          <MentalHealthMoodPicker onSelect={onQuickMoodSelect} />
        </View>
      ) : null}
    </View>
  )
}

export function MentalHealthTodayTab({
  bottomPadding,
  todayState,
  journey,
  crisisBlocksPlan,
  microPlanLoading = false,
  microPlanError = null,
  onStartInitialAnamnesis,
  onStartExtendedAnamnesis,
  onQuickMoodSelect,
  onViewRecentRecords,
  onViewTodayRecord,
  onExplainMessage,
  onOpenHowItWorks,
  onCreateMicroPlan,
  onOpenTodayPlan,
  onOpenCrisisSupport,
  onFeelingBetter,
}: MentalHealthTodayTabProps) {
  const phase = journey.phase

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <MentalHealthJourneyTimeline phase={phase} />

      <View style={styles.mainColumn}>
        {phase === 'crisis' ? (
          <CrisisPhase
            onOpenCrisisSupport={onOpenCrisisSupport}
            onFeelingBetter={onFeelingBetter}
          />
        ) : null}

        {phase === 'know_you' ? (
          <KnowYouPhase
            journey={journey}
            onStartInitialAnamnesis={onStartInitialAnamnesis}
            onOpenHowItWorks={onOpenHowItWorks}
          />
        ) : null}

        {phase === 'check_in' ? (
          <CheckInPhase onQuickMoodSelect={onQuickMoodSelect} />
        ) : null}

        {phase === 'reflect' ? (
          <ReflectPhase
            checkInCard={todayState.checkInCard}
            crisisBlocksPlan={crisisBlocksPlan}
            hasTodayPlan={journey.hasTodayPlan}
            microPlanLoading={microPlanLoading}
            microPlanError={microPlanError}
            onCreateMicroPlan={onCreateMicroPlan}
            onOpenTodayPlan={onOpenTodayPlan}
            onViewRecentRecords={onViewRecentRecords}
            onViewTodayRecord={onViewTodayRecord}
            onExplainMessage={onExplainMessage}
            onOpenCrisisSupport={onOpenCrisisSupport}
            onFeelingBetter={onFeelingBetter}
          />
        ) : null}

        {phase === 'care_today' ? (
          <CareTodayPhase
            journey={journey}
            crisisBlocksPlan={crisisBlocksPlan}
            onOpenTodayPlan={onOpenTodayPlan}
            onQuickMoodSelect={onQuickMoodSelect}
            onOpenCrisisSupport={onOpenCrisisSupport}
            checkInDone={journey.checkInDone}
            onFeelingBetter={onFeelingBetter}
          />
        ) : null}
      </View>

      {journey.showTellUsMore ? (
        <TellUsMorePhase journey={journey} onStartExtendedAnamnesis={onStartExtendedAnamnesis} />
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 20,
    gap: 24,
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
  },
  phaseBlock: {
    gap: 18,
    paddingTop: 4,
  },
  eyebrow: {
    color: 'rgba(255, 184, 106, 0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
    maxWidth: 340,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    alignSelf: 'stretch',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#ffb86a',
    marginTop: 4,
  },
  primaryActionSubtle: {
    backgroundColor: 'rgba(255, 184, 106, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 106, 0.28)',
  },
  primaryActionDisabled: {
    opacity: 0.72,
  },
  primaryActionText: {
    flex: 1,
    color: '#1a1208',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  primaryActionCrisis: {
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  primaryActionTextCrisis: {
    color: '#fda4af',
  },
  primaryActionTextSubtle: {
    color: '#ffd8a8',
    textAlign: 'center',
    flex: 0,
  },
  moodStage: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  moodHero: {
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  recordTapArea: {
    gap: 8,
  },
  recordTapHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
  },
  progressMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  quoteText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  supportText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  changeNote: {
    color: '#fde68a',
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2,
  },
  secondaryLinks: {
    gap: 4,
    paddingTop: 4,
  },
  planErrorBlock: {
    gap: 4,
    paddingTop: 2,
  },
  planErrorText: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  ghostLink: {
    paddingVertical: 8,
  },
  ghostLinkText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.18)',
  },
  miniCheckIn: {
    gap: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  miniCheckInLabel: {
    color: colors.textSubtle,
    fontSize: 13,
  },
  crisisEyebrow: {
    color: '#fda4af',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  crisisNote: {
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 19,
  },
  feelingBetterLink: {
    alignSelf: 'center',
    paddingVertical: 8,
    marginTop: -4,
  },
  feelingBetterLinkText: {
    color: '#86efac',
    fontSize: 14,
    fontWeight: '600',
  },
  tellUsMoreBlock: {
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tellUsMoreTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  tellUsMoreBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  tellUsMoreMeta: {
    color: colors.textSubtle,
    fontSize: 12,
  },
  tellUsMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  tellUsMoreButtonText: {
    color: '#a5f3fc',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(103, 232, 249, 0.35)',
  },
  pressed: {
    opacity: 0.88,
  },
})
