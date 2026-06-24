import { useId, useLayoutEffect } from 'react'
import { Modal, ModalProps, Platform, StyleSheet, View } from 'react-native'
import { useOverlayPortal } from '../contexts/OverlayPortalContext'
import { AndroidNavBarUnderlay } from './AndroidNavBarUnderlay'
import { colors } from '../theme/colors'

type AppModalProps = ModalProps & {
  navBarUnderlayColor?: string
}

type ModalShellProps = {
  children: React.ReactNode
  transparent: boolean
  navBarUnderlayColor: string
}

function ModalShell({ children, transparent, navBarUnderlayColor }: ModalShellProps) {
  return (
    <View style={[styles.host, transparent && styles.hostTransparent]}>
      <View style={styles.content}>{children}</View>
      <AndroidNavBarUnderlay color={navBarUnderlayColor} />
    </View>
  )
}

/**
 * Wrapper único para modais/drawers/sheets.
 * No Android usa overlay na MainActivity (portal) — nunca o Modal nativo (Dialog separado).
 */
export function AppModal({
  children,
  visible = true,
  navBarUnderlayColor = colors.background,
  transparent = true,
  statusBarTranslucent,
  navigationBarTranslucent,
  ...rest
}: AppModalProps) {
  const overlayId = useId()
  const overlayPortal = useOverlayPortal()
  const useAndroidOverlay = Platform.OS === 'android'

  useLayoutEffect(() => {
    if (!useAndroidOverlay) {
      return
    }

    if (!visible) {
      overlayPortal.unmount(overlayId)
      return
    }

    overlayPortal.mount(
      overlayId,
      <ModalShell transparent={transparent} navBarUnderlayColor={navBarUnderlayColor}>
        {children}
      </ModalShell>,
    )

    return () => {
      overlayPortal.unmount(overlayId)
    }
  }, [
    children,
    navBarUnderlayColor,
    overlayId,
    overlayPortal,
    transparent,
    useAndroidOverlay,
    visible,
  ])

  if (useAndroidOverlay) {
    return null
  }

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      statusBarTranslucent={statusBarTranslucent ?? false}
      navigationBarTranslucent={navigationBarTranslucent ?? false}
      {...rest}
    >
      <ModalShell transparent={transparent} navBarUnderlayColor={navBarUnderlayColor}>
        {children}
      </ModalShell>
    </Modal>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hostTransparent: {
    backgroundColor: 'transparent',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
})
