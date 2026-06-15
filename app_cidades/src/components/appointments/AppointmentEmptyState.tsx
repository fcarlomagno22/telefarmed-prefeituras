import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import { MyAppointmentsTab } from '../../types/myAppointments'

type AppointmentEmptyStateProps = {
  tab: MyAppointmentsTab
  onSchedulePress: () => void
  filtered?: boolean
}

export function AppointmentEmptyState({
  tab,
  onSchedulePress,
  filtered = false,
}: AppointmentEmptyStateProps) {
  const isUpcoming = tab === 'upcoming'

  return (
    <View style={styles.wrap}>
      <View style={styles.iconShadow}>
        <LinearGradient
          colors={[...ACTION_ICON_PALETTES.myAppointments.iconGradient]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.iconSquircle}
        >
          <MaterialCommunityIcons name="stethoscope" size={34} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>
        {isUpcoming
          ? 'Nenhuma consulta agendada'
          : filtered
            ? 'Nenhuma consulta neste período'
            : 'Nenhuma consulta no histórico'}
      </Text>
      <Text style={styles.message}>
        {isUpcoming
          ? 'Quando você agendar uma consulta, ela aparecerá aqui com lembretes e atalhos rápidos.'
          : filtered
            ? 'Tente ampliar o intervalo de datas no calendário.'
            : 'Consultas realizadas e canceladas aparecerão nesta aba.'}
      </Text>

      {isUpcoming ? (
        <Pressable
          onPress={onSchedulePress}
          style={({ pressed }) => [styles.ctaPressable, pressed && styles.ctaPressed]}
        >
          <LinearGradient
            colors={['#ffb366', '#ff6b00', '#e55f00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#fff" />
            <Text style={styles.ctaText}>Agendar consulta</Text>
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
    shadowColor: ACTION_ICON_PALETTES.myAppointments.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 6,
  },
  iconSquircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  ctaPressable: {
    width: '100%',
    marginTop: 10,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
})
