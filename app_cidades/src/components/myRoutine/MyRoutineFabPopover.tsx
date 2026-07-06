import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppModal } from '../AppModal'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'
import { myRoutineAccent } from '../../theme/myRoutineAccent'

const FAB_RIGHT = 18
const POPOVER_WIDTH = 280
const CARD_MAX_HEIGHT = 220
const BASE_LINE_HEIGHT = 0.5

type MyRoutineFabAction = 'quick-task' | 'reminder' | 'disruption'

type MyRoutineFabPopoverProps = {
  visible: boolean
  fabBottom: number
  onClose: () => void
  onAction: (action: MyRoutineFabAction) => void
}

const ACTIONS: {
  id: MyRoutineFabAction
  label: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  {
    id: 'quick-task',
    label: 'Adicionar tarefa',
    subtitle: 'Avulsa só para hoje',
    icon: 'add-circle-outline',
  },
  {
    id: 'reminder',
    label: 'Lembrete',
    subtitle: 'Horário ou flexível',
    icon: 'alarm-outline',
  },
  {
    id: 'disruption',
    label: 'Registrar imprevisto',
    subtitle: 'Modo dia leve',
    icon: 'cloud-outline',
  },
]

export function MyRoutineFabPopover({
  visible,
  fabBottom,
  onClose,
  onAction,
}: MyRoutineFabPopoverProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [isMounted, setIsMounted] = useState(false)
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const cardHeight = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardHeight, {
          toValue: CARD_MAX_HEIGHT,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (!isMounted) return
    setIsMounted(false)
  }, [backdropOpacity, cardHeight, cardOpacity, isMounted, visible])

  if (!isMounted) return null

  return (
    <AppModal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.host}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.backdropTint} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <View style={[styles.anchor, { bottom: fabBottom, right: FAB_RIGHT, width: POPOVER_WIDTH }]}>
          <Animated.View style={[styles.cardClip, { maxHeight: cardHeight, opacity: cardOpacity }]}>
            <LinearGradient
              colors={['#fdf4ff', '#ffffff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.popoverShell}
            >
              <LinearGradient
                colors={['rgba(240, 171, 252, 0.35)', 'rgba(217, 70, 239, 0.12)', 'rgba(162, 28, 175, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.popoverBorder}
              />

              <View style={styles.popoverInner}>
                <View style={styles.header}>
                  <Text style={styles.headerEyebrow}>Ações rápidas</Text>
                </View>

                {ACTIONS.map((action, index) => (
                  <View key={action.id}>
                    <Pressable
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        onAction(action.id)
                        onClose()
                      }}
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    >
                      <Ionicons name={action.icon} size={18} color={myRoutineAccent.chipTextSelected} />
                      <View style={styles.copy}>
                        <Text style={styles.label}>{action.label}</Text>
                        <Text style={styles.subtitle}>{action.subtitle}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                    </Pressable>
                    {index < ACTIONS.length - 1 ? <View style={styles.separator} /> : null}
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.baseLine}>
            <LinearGradient
              colors={['rgba(240, 171, 252, 0.25)', myRoutineAccent.accent, 'rgba(162, 28, 175, 0.55)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.baseLineGradient}
            />
          </View>
        </View>
      </View>
    </AppModal>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  host: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  anchor: {
    position: 'absolute',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  cardClip: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: BASE_LINE_HEIGHT,
  },
  popoverShell: {
    width: '100%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 14,
  },
  popoverBorder: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0.7,
  },
  popoverInner: {
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
    backgroundColor: myRoutineAccent.cardBackground,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(217, 70, 239, 0.22)',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#fdf4ff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: myRoutineAccent.cardBorder,
  },
  headerEyebrow: {
    color: myRoutineAccent.chipTextSelected,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowPressed: {
    backgroundColor: '#fdf4ff',
  },
  copy: { flex: 1, gap: 2 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 14,
    backgroundColor: myRoutineAccent.cardBorder,
  },
  baseLine: {
    width: 56,
    height: BASE_LINE_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  baseLineGradient: {
    flex: 1,
    borderRadius: 999,
  },
}
}
