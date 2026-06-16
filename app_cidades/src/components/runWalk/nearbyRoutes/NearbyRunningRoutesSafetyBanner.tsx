import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

const SAFETY_TIPS = [
  'Prefira horários com boa iluminação natural.',
  'Evite fones com volume alto — mantenha atenção ao redor.',
  'Avise alguém de confiança sobre seu percurso e horário.',
  'À noite, use roupas claras ou refletivas.',
  'Leve celular carregado e identificação.',
  'Se possível, corra acompanhado(a) em áreas desconhecidas.',
]

export function NearbyRunningRoutesSafetyBanner() {
  const [expanded, setExpanded] = useState(false)

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning" size={18} color="#fbbf24" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Atenção: segurança em primeiro lugar</Text>
          <Text style={styles.subtitle}>
            Não conhecemos sua região. Avalie iluminação, movimento e segurança antes de correr.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Recolher dicas de segurança' : 'Expandir dicas de segurança'}
          onPress={() => setExpanded((value) => !value)}
          style={styles.toggle}
        >
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#fbbf24" />
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.tips}>
          {SAFETY_TIPS.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#fde68a',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  toggle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tips: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.2)',
    gap: 6,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#fbbf24',
    fontSize: 13,
    lineHeight: 18,
  },
  tipText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
})
