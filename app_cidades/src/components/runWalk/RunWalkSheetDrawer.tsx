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
  useWindowDimensions,
  View,
  type KeyboardEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { drawerChrome } from '../../theme/drawerChrome'
import { colors } from '../../theme/colors'
import { sleepTimeDrawerTheme } from '../sleepTime/sleepTimeDrawerTheme'
import { getSheetBottomPadding } from '../../utils/modalSafeArea'
import { keyboardAvoidingBehavior } from '../../utils/keyboardLayout'
import { useWebViewportHeight } from '../../hooks/useWebViewportHeight'
import { AppModal } from '../AppModal'

const SHEET_OFFSET_FALLBACK = 720
const KEYBOARD_EXTRA_SCROLL_PADDING = 24
const KEYBOARD_FOOTER_CLEARANCE = 12
const IS_WEB = Platform.OS === 'web'
const USE_NATIVE_DRIVER = !IS_WEB

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
  immersiveBackground?: ReactNode
  tone?: 'default' | 'sleep'
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
  immersiveBackground,
  tone = 'default',
}: RunWalkSheetDrawerProps) {
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const webViewportHeight = useWebViewportHeight()
  const sheetOffset = IS_WEB ? webViewportHeight || screenHeight : SHEET_OFFSET_FALLBACK
  const [isMounted, setIsMounted] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const internalScrollRef = useRef<ScrollView>(null)
  const scrollRef = scrollViewRef ?? internalScrollRef
  const sheetTranslateY = useRef(new Animated.Value(sheetOffset)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    sheetTranslateY.setValue(sheetOffset)
  }, [sheetOffset, sheetTranslateY])

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      sheetTranslateY.setValue(sheetOffset)
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: USE_NATIVE_DRIVER,
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
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: sheetOffset,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false)
    })
  }, [backdropOpacity, isMounted, sheetOffset, sheetTranslateY, visible])

  useEffect(() => {
    if (!visible) {
      setKeyboardInset(0)
      return
    }

    if (!keyboardAware) {
      setKeyboardInset(0)
      return
    }

    setKeyboardInset(0)

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

  const isSleepTone = tone === 'sleep'
  const isImmersive = Boolean(immersiveBackground)
  const chromeTop = isSleepTone ? sleepTimeDrawerTheme.surface : drawerChrome.surface
  const chromeBottom = isSleepTone ? sleepTimeDrawerTheme.surfaceBottom : drawerChrome.surfaceBottom

  const footerBottomPadding = getSheetBottomPadding(insets.bottom, extraBottomInset)
  const bottomInset = footerBottomPadding
  const effectiveKeyboardInset = keyboardAware ? keyboardInset : 0
  const keyboardAvoidingEnabled = keyboardAware && Platform.OS === 'ios'
  const footerPaddingBottom =
    effectiveKeyboardInset > 0
      ? Math.max(
          KEYBOARD_FOOTER_CLEARANCE,
          effectiveKeyboardInset - Math.max(insets.bottom, 0) + KEYBOARD_FOOTER_CLEARANCE,
        )
      : footerBottomPadding

  const scrollBottomPadding =
    effectiveKeyboardInset > 0
      ? effectiveKeyboardInset + KEYBOARD_EXTRA_SCROLL_PADDING + (footer ? 72 : 0)
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
        fullScreen && footer ? styles.scrollContentFullScreenWithFooter : null,
        footer ? styles.scrollContentWithFooter : null,
        { paddingBottom: scrollBottomPadding },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' && keyboardAware}
      keyboardDismissMode="interactive"
      nestedScrollEnabled
      bounces={effectiveKeyboardInset === 0}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.staticContent,
        fullScreen && styles.staticContentFullScreen,
        isImmersive && styles.staticContentImmersive,
        dense && styles.staticContentDense,
      ]}
    >
      {children}
    </View>
  )

  const sheetBody =
    fullScreen && footer && isImmersive ? (
      <View
        style={[
          styles.immersiveFooterHost,
          effectiveKeyboardInset > 0 && styles.footerWithKeyboard,
          { paddingBottom: footerPaddingBottom },
        ]}
        pointerEvents="box-none"
      >
        <View pointerEvents="auto">{footer}</View>
      </View>
    ) : fullScreen && footer ? (
      <View style={[styles.fullScreenColumn, isImmersive && styles.fullScreenColumnImmersive]}>
        <View style={[styles.bodyFill, isImmersive && styles.bodyFillImmersive]}>{body}</View>
        <View
          style={[
            styles.footer,
            dense && styles.footerDense,
            styles.footerFullScreen,
            isImmersive && styles.footerImmersive,
            effectiveKeyboardInset > 0 && styles.footerWithKeyboard,
            { paddingBottom: footerPaddingBottom },
          ]}
          pointerEvents="box-none"
        >
          <View pointerEvents="auto">{footer}</View>
        </View>
      </View>
    ) : fullScreen ? (
      <View style={styles.bodyFill}>{body}</View>
    ) : (
      body
    )

  const sheetFooter =
    fullScreen ? null : footer ? (
      <View
        style={[
          styles.footer,
          dense && styles.footerDense,
          effectiveKeyboardInset > 0 && styles.footerWithKeyboard,
          { paddingBottom: footerPaddingBottom },
        ]}
      >
        {footer}
      </View>
    ) : null

  return (
    <AppModal
      visible
      transparent
      animationType="none"
      navBarUnderlayColor={isSleepTone ? sleepTimeDrawerTheme.surfaceBottom : drawerChrome.surfaceBottom}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.host,
          IS_WEB && styles.hostWeb,
          fullScreen && styles.hostFullScreen,
          isImmersive && styles.hostImmersive,
          isSleepTone && styles.hostFullScreenSleep,
        ]}
      >
        {!fullScreen ? (
          <Animated.View style={[styles.backdrop, IS_WEB && styles.backdropWeb, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
            {Platform.OS === 'ios' ? (
              <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFillObject} />
            ) : IS_WEB ? (
              <View style={styles.backdropWebTint} pointerEvents="none" />
            ) : null}
          </Animated.View>
        ) : null}

        <KeyboardAvoidingView
          behavior={keyboardAvoidingBehavior}
          style={[
            styles.keyboardWrap,
            IS_WEB && styles.keyboardWrapWeb,
            fullScreen && styles.keyboardWrapFullScreen,
          ]}
          enabled={keyboardAvoidingEnabled}
          pointerEvents={isImmersive ? 'box-none' : 'auto'}
        >
          <Animated.View
            style={[
              styles.sheet,
              IS_WEB && styles.sheetWeb,
              fullScreen && styles.sheetFullScreen,
              isImmersive && styles.sheetImmersive,
              effectiveKeyboardInset > 0 && styles.sheetWithKeyboard,
              minHeight != null && { minHeight },
              {
                transform: [{ translateY: sheetTranslateY }],
                paddingTop: fullScreen ? Math.max(insets.top, 12) : 0,
                paddingBottom: fullScreen ? 0 : footer ? 0 : bottomInset,
              },
            ]}
            pointerEvents={isImmersive ? 'box-none' : 'auto'}
          >
            {!isImmersive ? (
              <LinearGradient
                colors={[chromeTop, chromeBottom]}
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}

            {immersiveBackground ? (
              <View style={styles.immersiveBackground} pointerEvents="auto">
                {immersiveBackground}
              </View>
            ) : null}

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

            <View
              style={[
                styles.header,
                dense && styles.headerDense,
                isImmersive && styles.headerImmersive,
                styles.sheetForeground,
              ]}
              pointerEvents="auto"
            >
              <View style={styles.headerText}>
                <Text style={[styles.title, isSleepTone && styles.titleSleep]}>{title}</Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, isSleepTone && styles.subtitleSleep]}>{subtitle}</Text>
                ) : null}
              </View>
              {!hideCloseButton ? (
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    isSleepTone && styles.closeBtnSleep,
                    pressed && styles.closeBtnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={isSleepTone ? sleepTimeDrawerTheme.textMuted : colors.textMuted}
                  />
                </Pressable>
              ) : null}
            </View>

            {fullScreen ? (
              isImmersive ? (
                sheetBody
              ) : (
                <View style={[styles.sheetForeground, styles.fullScreenColumnRoot]}>{sheetBody}</View>
              )
            ) : (
              sheetBody
            )}
            {sheetFooter}
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
  hostWeb: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    maxHeight: 'var(--app-vh, 100dvh)',
  },
  hostFullScreen: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: drawerChrome.surfaceBottom,
  },
  hostImmersive: {
    backgroundColor: '#f0f0f2',
  },
  immersiveBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  hostFullScreenSleep: {
    backgroundColor: sleepTimeDrawerTheme.surfaceBottom,
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  keyboardWrapWeb: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    justifyContent: 'flex-end',
  },
  keyboardWrapFullScreen: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  backdropWeb: {
    backgroundColor: 'rgba(10, 10, 12, 0.42)',
  },
  backdropWebTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 247, 0.18)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sheetWeb: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  sheetFullScreen: {
    flex: 1,
    width: '100%',
    maxHeight: undefined,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 0,
    justifyContent: 'flex-start',
  },
  sheetImmersive: {
    backgroundColor: 'transparent',
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
    overflow: 'hidden',
  },
  bodyFillImmersive: {
    pointerEvents: 'box-none',
  },
  fullScreenColumnRoot: {
    flex: 1,
    minHeight: 0,
  },
  fullScreenColumn: {
    flex: 1,
    minHeight: 0,
  },
  fullScreenColumnImmersive: {
    pointerEvents: 'box-none',
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
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
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
  headerImmersive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    paddingBottom: 14,
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
  titleSleep: {
    color: sleepTimeDrawerTheme.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  subtitleSleep: {
    color: sleepTimeDrawerTheme.textMuted,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  closeBtnSleep: {
    backgroundColor: sleepTimeDrawerTheme.closeBackground,
    borderColor: sleepTimeDrawerTheme.closeBorder,
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
  scrollContentFullScreenWithFooter: {
    flexGrow: 0,
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
  staticContentImmersive: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    pointerEvents: 'box-none',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  footerFullScreen: {
    flexShrink: 0,
    zIndex: 4,
    elevation: 4,
    position: 'relative',
  },
  footerImmersive: {
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  immersiveFooterHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  footerDense: {
    paddingTop: 4,
  },
  footerWithKeyboard: {
    paddingTop: 6,
  },
})
