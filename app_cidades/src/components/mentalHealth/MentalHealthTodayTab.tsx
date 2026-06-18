import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  type MentalHealthCheckInCardData,
  type MentalHealthMoodLevelId,
  type MentalHealthTodayState,
} from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import {
  buildCheckInSummarySentence,
  buildCheckInSupportMessage,
} from '../../utils/mentalHealthCheckIn'
import type { MentalHealthJourneyState } from '../../utils/mentalHealthJourney'
import { MentalHealthMoodIcon } from './MentalHealthMoodIcon'
import { MentalHealthMoodPicker } from './MentalHealthMoodPicker'

type MentalHealthTodayTabProps = {
  bottomPadding: number
  todayState: MentalHealthTodayState
  journey: MentalHealthJourneyState
  onStartExtendedAnamnesis: () => void
  onQuickMoodSelect: (mood: MentalHealthMoodLevelId) => void
  onAnswerQuickQuestions: () => void
  onViewRecentRecords: () => void
  onCreateMicroPlan: () => void
  onOpenTodayPlan: () => void
  onTalkPress: () => void
}

function PrimaryAction({
  label,
  onPress,
  subtle = false,
}: {
  label: string
  onPress: () => void
  subtle?: boolean
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => [
        styles.primaryAction,
        subtle && styles.primaryActionSubtle,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.primaryActionText, subtle && styles.primaryActionTextSubtle]}>
        {label}
      </Text>
      {!subtle ? <Ionicons name="arrow-forward" size={18} color="#1a1208" /> : null}
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

function ReflectPhase({
  checkInCard,
  onCreateMicroPlan,
  onViewRecentRecords,
  onAnswerQuickQuestions,
}: {
  checkInCard: MentalHealthCheckInCardData
  onCreateMicroPlan: () => void
  onViewRecentRecords: () => void
  onAnswerQuickQuestions: () => void
}) {
  const entry = checkInCard.latestEntry
  if (!entry) return null

  const summary = buildCheckInSummarySentence(entry)
  const support = buildCheckInSupportMessage(entry)
  const isChange = checkInCard.state === 'relevant-change'

  return (
    <View style={styles.phaseBlock}>
      <Text style={styles.eyebrow}>{isChange ? 'Algo mudou' : 'Registrado hoje'}</Text>

      <View style={styles.moodHero}>
        <MentalHealthMoodIcon mood={entry.mood} size="hero" />
      </View>

      <Text style={styles.quoteText}>{summary}</Text>
      <Text style={styles.supportText}>{support}</Text>

      {isChange && checkInCard.relevantChangeMessage ? (
        <Text style={styles.changeNote}>{checkInCard.relevantChangeMessage}</Text>
      ) : null}

      <PrimaryAction label="Montar cuidados para hoje" onPress={onCreateMicroPlan} />

      <View style={styles.secondaryLinks}>
        <GhostLink label="Entender mais sobre meu momento" onPress={onAnswerQuickQuestions} />
        <GhostLink label="Ver registros recentes" onPress={onViewRecentRecords} />
      </View>
    </View>
  )
}

function CareTodayPhase({
  journey,
  onOpenTodayPlan,
  onQuickMoodSelect,
  checkInDone,
}: {
  journey: MentalHealthJourneyState
  onOpenTodayPlan: () => void
  onQuickMoodSelect: (mood: MentalHealthMoodLevelId) => void
  checkInDone: boolean
}) {
  const remaining = Math.max(journey.planActivitiesTotal - journey.planActivitiesCompleted, 0)

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
        <PrimaryAction label="Ver plano de hoje" onPress={onOpenTodayPlan} />
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
  onStartExtendedAnamnesis,
  onQuickMoodSelect,
  onAnswerQuickQuestions,
  onViewRecentRecords,
  onCreateMicroPlan,
  onOpenTodayPlan,
  onTalkPress,
}: MentalHealthTodayTabProps) {
  const phase =
    journey.phase === 'know_you' ? 'check_in' : journey.phase

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mainColumn}>
        {phase === 'check_in' ? (
          <CheckInPhase onQuickMoodSelect={onQuickMoodSelect} />
        ) : null}

        {phase === 'reflect' ? (
          <ReflectPhase
            checkInCard={todayState.checkInCard}
            onCreateMicroPlan={onCreateMicroPlan}
            onViewRecentRecords={onViewRecentRecords}
            onAnswerQuickQuestions={onAnswerQuickQuestions}
          />
        ) : null}

        {phase === 'care_today' ? (
          <CareTodayPhase
            journey={journey}
            onOpenTodayPlan={onOpenTodayPlan}
            onQuickMoodSelect={onQuickMoodSelect}
            checkInDone={journey.checkInDone}
          />
        ) : null}
      </View>

      {journey.showTellUsMore ? (
        <TellUsMorePhase journey={journey} onStartExtendedAnamnesis={onStartExtendedAnamnesis} />
      ) : null}

      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onTalkPress()
        }}
        style={({ pressed }) => [styles.talkLink, pressed && styles.pressed]}
      >
        <Text style={styles.talkLinkText}>Preciso conversar com alguém</Text>
      </Pressable>
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
  primaryActionText: {
    flex: 1,
    color: '#1a1208',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
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
  talkLink: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  talkLinkText: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '500',
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
