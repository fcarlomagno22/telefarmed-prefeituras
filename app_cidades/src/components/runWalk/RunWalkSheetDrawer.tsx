import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type KeyboardEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { drawerChrome } from '../../theme/drawerChrome'
import { colors } from '../../theme/colors'
import { AppModal } from '../AppModal'

const SHEET_OFFSET = 720

type RunWalkSheetDrawerProps = {
  visible: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  scrollable?: boolean
  footer?: ReactNode
  fullScreen?: boolean
  keyboardAware?: boolean
  minHeight?: number | `${number}%`
  extraBottomInset?: number
}

export function RunWalkSheetDrawer({
  visible,
  title,
  subtitle,
  onClose,
  children,
  scrollable = true,
  footer,
  fullScreen = false,
  keyboardAware = true,
  minHeight,
  extraBottomInset = 0,
}: RunWalkSheetDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (!isMounted) return

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false)
    })
  }, [backdropOpacity, isMounted, sheetTranslateY, visible])

  useEffect(() => {
    if (!visible || !keyboardAware) {
      setKeyboardInset(0)
      return
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    function handleKeyboardShow(event: KeyboardEvent) {
      setKeyboardInset(event.endCoordinates.height)
    }

    function handleKeyboardHide() {
      setKeyboardInset(0)
    }

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow)
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [keyboardAware, visible])

  useEffect(() => {
    if (!keyboardInset || !scrollable) return

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 80)

    return () => clearTimeout(timer)
  }, [keyboardInset, scrollable])

  if (!isMounted) return null

  const scrollBottomPadding = 8 + (keyboardInset > 0 ? keyboardInset - Math.max(insets.bottom, 16) : 0)
  const bottomInset = Math.max(insets.bottom, 20) + extraBottomInset

  const body = scrollable ? (
    <ScrollView
      ref={scrollRef}
      style={fullScreen ? styles.scrollFill : undefined}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        fullScreen && styles.scrollContentFullScreen,
        keyboardInset > 0 && { paddingBottom: Math.max(scrollBottomPadding, 24) },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={keyboardAware}
      bounces={keyboardInset === 0}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, fullScreen && styles.staticContentFullScreen]}>
      {children}
    </View>
  )

  return (
    <AppModal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.host, fullScreen && styles.hostFullScreen]}>
        {!fullScreen ? (
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
            {Platform.OS === 'ios' ? (
              <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : null}
          </Animated.View>
        ) : null}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardWrap}
          enabled={keyboardAware}
        >
          <Animated.View
            style={[
              styles.sheet,
              fullScreen && styles.sheetFullScreen,
              keyboardInset > 0 && styles.sheetWithKeyboard,
              minHeight != null && { minHeight },
              {
                transform: [{ translateY: sheetTranslateY }],
                paddingTop: fullScreen ? Math.max(insets.top, 12) : 0,
                paddingBottom: footer ? 0 : bottomInset,
              },
            ]}
          >
            <LinearGradient
              colors={[drawerChrome.surface, drawerChrome.surfaceBottom]}
              style={StyleSheet.absoluteFillObject}
            />

            {!fullScreen ? (
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>
            ) : null}

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {body}
            {footer ? (
              <View style={[styles.footer, { paddingBottom: bottomInset }]}>{footer}</View>
            ) : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  hostFullScreen: {
    justifyContent: 'flex-start',
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetFullScreen: {
    flex: 1,
    maxHeight: undefined,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 0,
  },
  sheetWithKeyboard: {
    maxHeight: '100%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeBtnPressed: {
    opacity: 0.85,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  scrollContentFullScreen: {
    paddingBottom: 24,
  },
  scrollFill: {
    flex: 1,
  },
  staticContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  staticContentFullScreen: {
    flex: 1,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
})
