import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Recolher dicas de segurança' : 'Expandir dicas de segurança'}
      onPress={() => setExpanded((value) => !value)}
      style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}
    >
      <View style={styles.accent} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#b45309" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Segurança em primeiro lugar</Text>
            <Text style={styles.subtitle}>
              Avalie iluminação, movimento e segurança antes de correr.
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textMuted}
          />
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
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.07)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  wrapPressed: {
    opacity: 0.96,
  },
  accent: {
    width: 3,
    backgroundColor: '#f59e0b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  tips: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    gap: 6,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#d97706',
    fontSize: 12,
    lineHeight: 17,
  },
  tipText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
})
