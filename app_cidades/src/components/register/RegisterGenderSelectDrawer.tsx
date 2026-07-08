import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import {
  REGISTRATION_GENDER_OPTIONS,
  type RegistrationGender,
} from '../../utils/registrationGender'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type RegisterGenderSelectDrawerProps = {
  visible: boolean
  value: RegistrationGender | ''
  onClose: () => void
  onSelect: (gender: RegistrationGender) => void
}

export function RegisterGenderSelectDrawer({
  visible,
  value,
  onClose,
  onSelect,
}: RegisterGenderSelectDrawerProps) {
  function handleSelect(gender: RegistrationGender) {
    void Haptics.selectionAsync()
    onSelect(gender)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Gênero"
      subtitle="Selecione a opção que melhor te representa"
      onClose={onClose}
      scrollable={false}
      minHeight={340}
    >
      <View style={styles.options}>
        {REGISTRATION_GENDER_OPTIONS.map((option) => {
          const active = value === option.id
          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && styles.optionPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={styles.optionCopy}>
                <View style={[styles.iconOrb, { backgroundColor: option.iconColor }]}>
                  <MaterialCommunityIcons name={option.icon} size={20} color="#fff" />
                </View>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {option.label}
                </Text>
              </View>
              {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
            </Pressable>
          )
        })}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  options: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  optionActive: {
    borderColor: 'rgba(255, 107, 0, 0.55)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  optionPressed: {
    opacity: 0.88,
  },
  optionCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 8,
  },
  iconOrb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  optionLabelActive: {
    color: colors.primaryLight,
  },
})
