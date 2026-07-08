import { ReactNode, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../contexts/ThemeContext'
import { useThemedStyles } from '../hooks/useThemedStyles'
import { useWebKeyboardInset } from '../hooks/useWebKeyboardInset'
import { getThemeColors, type ThemeColors } from '../theme/palettes'
import { keyboardAvoidingBehavior } from '../utils/keyboardLayout'

type AppShellProps = {
  children: ReactNode
  footer?: ReactNode
  contentStyle?: ViewStyle
}

export function AppShell({ children, footer, contentStyle }: AppShellProps) {
  const { backgroundSource, colors } = useTheme()
  const styles = useThemedStyles(createShellStyles)
  const keyboardInset = useWebKeyboardInset()
  const isWeb = Platform.OS === 'web'

  useEffect(() => {
    if (!isWeb) return

    function handleFocusIn(event: FocusEvent) {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return

      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      })
    }

    document.addEventListener('focusin', handleFocusIn)
    return () => document.removeEventListener('focusin', handleFocusIn)
  }, [isWeb])

  return (
    <View style={styles.root}>
      <ImageBackground
        source={backgroundSource}
        style={styles.background}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
      />

      <LinearGradient
        colors={[...colors.screenOverlay]}
        locations={[0, 0.35, 1]}
        style={styles.screenOverlay}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={keyboardAvoidingBehavior}
          enabled={!isWeb}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isWeb && styles.scrollContentWeb,
              isWeb && keyboardInset > 0
                ? { paddingBottom: Math.max(keyboardInset, 16) + 16 }
                : null,
              contentStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>{children}</View>

            {footer}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

export function useFormStyles() {
  return useThemedStyles(createFormStyles)
}

function createFormStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fieldGroup: {
      marginBottom: 16,
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
      marginLeft: 4,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 16,
      paddingHorizontal: 14,
      minHeight: 52,
    },
    inputWrapperReadOnly: {
      opacity: 0.85,
    },
    inputWrapperError: {
      borderColor: 'rgba(255, 107, 107, 0.5)',
      backgroundColor: colors.errorBg,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      paddingVertical: 13,
      ...(Platform.OS === 'web'
        ? ({
            outlineStyle: 'none',
            outlineWidth: 0,
            borderWidth: 0,
            boxShadow: 'none',
          } as object)
        : null),
    },
    inputReadOnly: {
      color: colors.textMuted,
    },
    fieldError: {
      color: colors.error,
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.errorBg,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 107, 107, 0.25)',
    },
    errorText: {
      flex: 1,
      color: colors.error,
      fontSize: 13,
      lineHeight: 18,
    },
    primaryButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 8,
    },
    primaryButtonPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    primaryButtonDisabled: {
      opacity: 0.75,
    },
    primaryButtonGradient: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    secondaryButton: {
      marginTop: 12,
      alignItems: 'center',
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    stepTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 6,
    },
    stepSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    stepBadge: {
      alignSelf: 'center',
      color: colors.primaryLight,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
  })
}

/** @deprecated Prefer `useFormStyles()` for theme-aware form styling. */
export const formStyles = createFormStyles(getThemeColors('light'))

function createShellStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    background: {
      ...StyleSheet.absoluteFillObject,
    },
    backgroundImage: {
      width: '100%',
      height: '100%',
    },
    screenOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    flex: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 28,
      paddingBottom: 40,
    },
    scrollContentWeb: {
      justifyContent: 'flex-start',
      paddingTop: 20,
    },
    card: {
      borderRadius: 32,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 24,
      ...Platform.select({
        web: {
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.06)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 4,
        },
      }),
    },
  })
}
