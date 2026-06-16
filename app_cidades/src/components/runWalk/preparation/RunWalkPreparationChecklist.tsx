import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { PreparationChecklistItem } from '../../../hooks/useRunWalkPreparationChecklist'

type RunWalkPreparationChecklistProps = {
  items: PreparationChecklistItem[]
}

export function RunWalkPreparationChecklist({ items }: RunWalkPreparationChecklistProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Checklist automático</Text>
      <Text style={styles.subtitle}>
        A internet não é obrigatória. A atividade pode ser salva localmente e sincronizada depois.
      </Text>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={[styles.iconWrap, item.ok ? styles.iconOk : styles.iconPending]}>
              <Ionicons
                name={item.ok ? 'checkmark' : 'ellipse-outline'}
                size={14}
                color={item.ok ? '#86efac' : colors.textSubtle}
              />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.detail}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  list: {
    gap: 8,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconOk: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  iconPending: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  detail: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
})
