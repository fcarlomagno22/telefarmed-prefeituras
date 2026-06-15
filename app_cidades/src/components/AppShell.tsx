import { ReactNode } from 'react'
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
import { appEnv } from '../config/env'
import { colors } from '../theme/colors'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(
  appEnv.backgroundImageUrl,
  'fundo_login.png',
)

type AppShellProps = {
  children: ReactNode
  footer?: ReactNode
  contentStyle?: ViewStyle
}

export function AppShell({ children, footer, contentStyle }: AppShellProps) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={backgroundSource}
        style={styles.background}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            keyboardShouldPersistTaps="handled"
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

export const formStyles = StyleSheet.create({
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

const styles = StyleSheet.create({
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
  },
  card: {
    borderRadius: 32,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
})
