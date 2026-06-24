import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppModal } from '../AppModal'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

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
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
          {Platform.OS === 'ios' ? (
            <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : null}
        </Animated.View>

        <View style={[styles.anchor, { bottom: fabBottom, right: FAB_RIGHT, width: POPOVER_WIDTH }]}>
          <Animated.View style={[styles.cardClip, { maxHeight: cardHeight, opacity: cardOpacity }]}>
            <LinearGradient
              colors={['rgba(28, 16, 32, 0.98)', 'rgba(12, 10, 14, 0.98)']}
              style={styles.shell}
            >
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
                    <Ionicons name={action.icon} size={18} color="#f0abfc" />
                    <View style={styles.copy}>
                      <Text style={styles.label}>{action.label}</Text>
                      <Text style={styles.subtitle}>{action.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                  </Pressable>
                  {index < ACTIONS.length - 1 ? <View style={styles.separator} /> : null}
                </View>
              ))}
            </LinearGradient>
          </Animated.View>
          <View style={styles.baseLine} />
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
    backgroundColor: 'rgba(0,0,0,0.38)',
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
  shell: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.18)',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
  },
  headerEyebrow: {
    color: '#f0abfc',
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
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
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
    height: 0.5,
    marginLeft: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  baseLine: {
    width: 56,
    height: BASE_LINE_HEIGHT,
    borderRadius: 999,
    backgroundColor: '#d946ef',
    alignSelf: 'flex-end',
  },
}
}

