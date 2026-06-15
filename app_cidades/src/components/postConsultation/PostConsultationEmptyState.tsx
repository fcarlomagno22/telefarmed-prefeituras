import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { POS_CONSULTA_PLAN_TOTAL_DAYS } from '../../config/posConsulta'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { PostConsultationTab } from '../../types/appointmentPostConsultation'

type PostConsultationEmptyStateProps = {
  tab: PostConsultationTab
  onViewAppointmentsPress?: () => void
}

export function PostConsultationEmptyState({
  tab,
  onViewAppointmentsPress,
}: PostConsultationEmptyStateProps) {
  const isActiveTab = tab === 'active'

  return (
    <View style={styles.wrap}>
      <View style={styles.iconShadow}>
        <LinearGradient
          colors={[...ACTION_ICON_PALETTES.postConsultation.iconGradient]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.iconSquircle}
        >
          <MaterialCommunityIcons
            name={isActiveTab ? 'clipboard-pulse-outline' : 'clipboard-check-outline'}
            size={34}
            color="#fff"
          />
        </LinearGradient>
      </View>

      <Text style={styles.title}>
        {isActiveTab ? 'Nenhum ativo' : 'Nenhum encerrado'}
      </Text>
      <Text style={styles.message}>
        {isActiveTab
          ? `Após uma consulta realizada, você recebe check-ins rápidos por ${POS_CONSULTA_PLAN_TOTAL_DAYS} dias para acompanhar sua evolução.`
          : 'Planos encerrados aparecem aqui após concluir o período de acompanhamento.'}
      </Text>

      {isActiveTab && onViewAppointmentsPress ? (
        <Pressable
          onPress={onViewAppointmentsPress}
          style={({ pressed }) => [styles.ctaPressable, pressed && styles.ctaPressed]}
        >
          <LinearGradient
            colors={['#7dd3fc', '#0ea5e9', '#0284c7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <MaterialCommunityIcons name="stethoscope" size={20} color="#fff" />
            <Text style={styles.ctaText}>Ver consultas realizadas</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    gap: 10,
  },
  iconShadow: {
    shadowColor: ACTION_ICON_PALETTES.postConsultation.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 4,
  },
  iconSquircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
  },
  ctaPressable: {
    width: '100%',
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  ctaButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
