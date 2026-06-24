import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { TdahTodEngineResult } from '../../tdahTodInfantil/types'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'

type TdahTodInfantilResultViewProps = {
  result: TdahTodEngineResult
  bottomPadding: number
  onClose: () => void
}

function severityColor(classificationId: string) {
  switch (classificationId) {
    case 'prioridade_clinica':
      return '#f87171'
    case 'sinais_importantes':
      return '#fb923c'
    case 'sinais_moderados':
      return '#fbbf24'
    case 'sinais_leves':
      return '#86efac'
    default:
      return '#93c5fd'
  }
}

function dialPhone(phone: string) {
  void Linking.openURL(`tel:${phone.replace(/\D/g, '')}`)
}

export function TdahTodInfantilResultView({
  result,
  bottomPadding,
  onClose,
}: TdahTodInfantilResultViewProps) {
  const accent = severityColor(result.classificationId)

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {result.urgentRedFlag ? (
          <View style={styles.urgentBox}>
            <Text style={styles.urgentTitle}>Atenção imediata</Text>
            <Text style={styles.urgentText}>
              Há alertas que exigem busca de apoio profissional ou emergencial agora.
            </Text>
            <View style={styles.urgentActions}>
              <Pressable onPress={() => dialPhone('188')} style={styles.urgentBtn}>
                <Ionicons name="call-outline" size={16} color="#fff" />
                <Text style={styles.urgentBtnText}>CVV 188</Text>
              </Pressable>
              <Pressable onPress={() => dialPhone('192')} style={styles.urgentBtn}>
                <Ionicons name="medkit-outline" size={16} color="#fff" />
                <Text style={styles.urgentBtnText}>SAMU 192</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <LinearGradient colors={[`${accent}33`, 'rgba(16, 16, 20, 0.94)']} style={styles.hero}>
          <Text style={styles.heroLabel}>Classificação do rastreio</Text>
          <Text style={[styles.heroValue, { color: accent }]}>{result.classificationLabel}</Text>
          <Text style={styles.heroHeadline}>{result.headline}</Text>
          <Text style={styles.heroSummary}>{result.familySummary}</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Em linguagem simples</Text>
          <Text style={styles.cardText}>{result.safeResultPhrase}</Text>
        </View>

        {result.profilePhrases.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Padrão observado</Text>
            {result.profilePhrases.map((phrase) => (
              <Text key={phrase} style={styles.cardText}>
                • {phrase}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Domínios (SNAP-IV 26)</Text>
          {result.domainScores
            .filter((item) => item.respondent === 'responsavel')
            .map((domain) => (
              <View key={`${domain.domain}-${domain.respondent}`} style={styles.domainRow}>
                <Text style={styles.domainLabel}>
                  {domain.domain === 'desatencao'
                    ? 'Desatenção'
                    : domain.domain === 'hiperatividade_impulsividade'
                      ? 'Hiperatividade/impulsividade'
                      : 'Oposição/desafio'}
                </Text>
                <Text style={styles.domainValue}>{domain.bandLabel}</Text>
              </View>
            ))}
          <Text style={styles.meta}>
            Prejuízo funcional: {result.functionalImpairmentLabel} · Confiança: {result.confidence}
          </Text>
        </View>

        {result.differentialNote ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fatores que podem influenciar</Text>
            <Text style={styles.cardText}>{result.differentialNote}</Text>
          </View>
        ) : null}

        {result.informantNote ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informantes</Text>
            <Text style={styles.cardText}>{result.informantNote}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Próximos passos</Text>
          {result.nextSteps.map((step) => (
            <Text key={step} style={styles.cardText}>
              • {step}
            </Text>
          ))}
        </View>

        {result.referrals.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Encaminhamentos sugeridos</Text>
            {result.referrals.map((referral) => (
              <View key={`${referral.destination}-${referral.label}`} style={styles.referralRow}>
                <Text style={styles.referralLabel}>{referral.label}</Text>
                <Text style={styles.referralReason}>{referral.reason}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {result.followupDays ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reavaliação</Text>
            <Text style={styles.cardText}>
              Sugestão: repetir o rastreio em cerca de {result.followupDays} dias, ou antes se houver piora.
            </Text>
          </View>
        ) : null}

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>Importante</Text>
          <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
          <Text style={styles.disclaimerText}>{result.reassurance}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Fechar relatório" onPress={onClose} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  urgentBox: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  urgentTitle: {
    color: '#fecaca',
    fontSize: 14,
    fontWeight: '800',
  },
  urgentText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  urgentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  urgentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#dc2626',
  },
  urgentBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  hero: {
    borderRadius: 18,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  heroValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroHeadline: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  heroSummary: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(16, 16, 20, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  domainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  domainLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  domainValue: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '800',
  },
  meta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  referralRow: {
    gap: 2,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  referralLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  referralReason: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  disclaimerBox: {
    borderRadius: 14,
    padding: 14,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  disclaimerTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  disclaimerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
})
