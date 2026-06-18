import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode, RefObject, useEffect, useRef, useState } from 'react'
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
import { getSheetBottomPadding } from '../../utils/modalSafeArea'
import { keyboardAvoidingBehavior } from '../../utils/keyboardLayout'
import { AppModal } from '../AppModal'

const SHEET_OFFSET = 720
const KEYBOARD_EXTRA_SCROLL_PADDING = 24
const KEYBOARD_FOOTER_CLEARANCE = 12

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
  dense?: boolean
  hideCloseButton?: boolean
  scrollViewRef?: RefObject<ScrollView | null>
  sheetBackground?: ReactNode
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
  dense = false,
  hideCloseButton = false,
  scrollViewRef,
  sheetBackground,
}: RunWalkSheetDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const internalScrollRef = useRef<ScrollView>(null)
  const scrollRef = scrollViewRef ?? internalScrollRef
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

  if (!isMounted) return null

  const footerBottomPadding = getSheetBottomPadding(insets.bottom, extraBottomInset)
  const bottomInset = footerBottomPadding
  const footerPaddingBottom =
    keyboardInset > 0
      ? Math.max(KEYBOARD_FOOTER_CLEARANCE, keyboardInset - Math.max(insets.bottom, 0) + KEYBOARD_FOOTER_CLEARANCE)
      : footerBottomPadding

  const scrollBottomPadding =
    keyboardInset > 0
      ? keyboardInset + KEYBOARD_EXTRA_SCROLL_PADDING + (footer ? 72 : 0)
      : footer
        ? 12
        : Math.max(8, bottomInset)

  const useScrollBody = scrollable || keyboardAware

  const body = useScrollBody ? (
    <ScrollView
      ref={scrollRef}
      style={fullScreen ? styles.scrollFill : undefined}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        fullScreen && styles.scrollContentFullScreen,
        footer ? styles.scrollContentWithFooter : null,
        { paddingBottom: scrollBottomPadding },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' && keyboardAware}
      keyboardDismissMode="interactive"
      nestedScrollEnabled
      bounces={keyboardInset === 0}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, fullScreen && styles.staticContentFullScreen, dense && styles.staticContentDense]}>
      {children}
    </View>
  )

  return (
    <AppModal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      navBarUnderlayColor={drawerChrome.surfaceBottom}
    >
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
          behavior={keyboardAvoidingBehavior}
          style={[styles.keyboardWrap, fullScreen && styles.keyboardWrapFullScreen]}
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

            {sheetBackground ? (
              <View style={styles.sheetBackground} pointerEvents="none">
                {sheetBackground}
              </View>
            ) : null}

            {!fullScreen ? (
              <View style={[styles.handleRow, dense && styles.handleRowDense]}>
                <View style={styles.handle} />
              </View>
            ) : null}

            <View style={[styles.header, dense && styles.headerDense, styles.sheetForeground]}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              {!hideCloseButton ? (
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {fullScreen ? (
              <View style={[styles.bodyFill, styles.sheetForeground]}>{body}</View>
            ) : (
              body
            )}
            {footer ? (
              <View
                style={[
                  styles.footer,
                  dense && styles.footerDense,
                  keyboardInset > 0 && styles.footerWithKeyboard,
                  { paddingBottom: footerPaddingBottom },
                ]}
              >
                {footer}
              </View>
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
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: drawerChrome.surfaceBottom,
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  keyboardWrapFullScreen: {
    flex: 1,
    justifyContent: 'flex-start',
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
    width: '100%',
    maxHeight: undefined,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 0,
  },
  sheetBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetForeground: {
    zIndex: 1,
  },
  bodyFill: {
    flex: 1,
    minHeight: 0,
  },
  sheetWithKeyboard: {
    maxHeight: '100%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleRowDense: {
    paddingTop: 8,
    paddingBottom: 2,
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
  headerDense: {
    paddingBottom: 8,
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
    gap: 12,
  },
  scrollContentFullScreen: {
    flexGrow: 1,
  },
  scrollContentWithFooter: {
    paddingBottom: 12,
  },
  scrollFill: {
    flex: 1,
  },
  staticContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  staticContentDense: {
    gap: 8,
  },
  staticContentFullScreen: {
    flex: 1,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: drawerChrome.surfaceBottom,
  },
  footerDense: {
    paddingTop: 4,
  },
  footerWithKeyboard: {
    paddingTop: 6,
  },
})
