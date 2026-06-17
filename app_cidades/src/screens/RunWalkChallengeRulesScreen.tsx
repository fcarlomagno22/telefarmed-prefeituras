import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { useAuth } from '../contexts/AuthContext'
import { getRunWalkChallengeById } from '../data/mockRunWalkChallenges'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams } from '../types/auth'
import type { RunWalkChallenge, RunWalkChallengeRules } from '../types/runWalkChallenges'

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleLabel}>{label}</Text>
      <Text style={styles.ruleValue}>{value}</Text>
    </View>
  )
}

function RulesContent({ rules }: { rules: RunWalkChallengeRules }) {
  return (
    <View style={styles.rulesCard}>
      <RuleRow label="Período" value={rules.period} />
      <RuleRow label="Modalidades válidas" value={rules.validModalities} />
      <RuleRow label="Limite diário" value={rules.dailyLimit} />
      <RuleRow label="Critérios" value={rules.criteria} />
      <RuleRow label="Privacidade" value={rules.privacy} />
      <RuleRow label="Recompensa" value={rules.reward} />
    </View>
  )
}

export function RunWalkChallengeRulesScreen() {
  const insets = useSafeAreaInsets()
  const { goBack, routeParams } = useAuth()
  const params = getRunWalkRouteParams(routeParams)
  const challengeId = params.challengeId

  const [challenge, setChallenge] = useState<RunWalkChallenge | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!challengeId) {
      goBack()
      return
    }

    const loaded = getRunWalkChallengeById(challengeId)
    setChallenge(loaded)
    setIsLoading(false)

    if (!loaded) {
      goBack()
    }
  }, [challengeId, goBack])

  if (isLoading || !challenge) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primaryLight} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0a0a0c', '#101018', '#0a0a0c']}
        style={StyleSheet.absoluteFill}
      />

      <ScreenStackHeader
        title="Regras do desafio"
        subtitle={challenge.title}
        paddingTop={Math.max(insets.top, 12) + 8}
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>{challenge.subtitle}</Text>
        <RulesContent rules={challenge.rules} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <PrimaryButton label="Voltar aos desafios" onPress={goBack} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  rulesCard: {
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  ruleRow: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  ruleLabel: {
    color: '#f9a8d4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  ruleValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 10, 12, 0.96)',
  },
})
