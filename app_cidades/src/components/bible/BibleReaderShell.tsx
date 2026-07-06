import { LinearGradient } from 'expo-linear-gradient'
import { type ReactNode } from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenStackHeader } from '../ScreenStackHeader'
import { SpiritualModuleFab } from '../spiritual/SpiritualModuleFab'
import { useTheme } from '../../contexts/ThemeContext'
import { colors } from '../../theme/colors'

const TAB_BAR_ESTIMATED_HEIGHT = 78

type BibleReaderShellProps = {
  title: string
  subtitle: string
  onBack: () => void
  onOpenMentalHealth: () => void
  children: ReactNode
  showFab?: boolean
  headerRight?: ReactNode
}

export function BibleReaderShell({
  title,
  subtitle,
  onBack,
  onOpenMentalHealth,
  children,
  showFab = true,
  headerRight,
}: BibleReaderShellProps) {
  const { backgroundSource, colors: themeColors } = useTheme()
  const insets = useSafeAreaInsets()
  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const fabBottom = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 12

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={[themeColors.screenOverlay[0], 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title={title}
          subtitle={subtitle}
          paddingTop={headerPaddingTop}
          onBack={onBack}
          headerRight={headerRight}
        />

        {children}

        {showFab ? (
          <SpiritualModuleFab bottom={fabBottom} onPress={onOpenMentalHealth} />
        ) : null}
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
  },
})
