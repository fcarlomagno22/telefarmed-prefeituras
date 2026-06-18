import * as NavigationBar from 'expo-navigation-bar'
import * as SystemUI from 'expo-system-ui'
import { useEffect } from 'react'
import { Modal, ModalProps, Platform, StyleSheet, View } from 'react-native'
import { drawerChrome } from '../theme/drawerChrome'
import { colors } from '../theme/colors'
import { AndroidNavBarUnderlay } from './AndroidNavBarUnderlay'

type AppModalProps = ModalProps & {
  /** Omitir ou 'transparent' para deixar o conteúdo do modal aparecer atrás da nav bar. */
  navBarUnderlayColor?: string
}

export function AppModal({
  children,
  visible,
  navBarUnderlayColor = drawerChrome.surfaceBottom,
  statusBarTranslucent,
  navigationBarTranslucent,
  ...rest
}: AppModalProps) {
  useEffect(() => {
    if (Platform.OS !== 'android') return

    if (visible) {
      void NavigationBar.setStyle('light')
      void NavigationBar.setBackgroundColorAsync('#00000000')
      return
    }

    void SystemUI.setBackgroundColorAsync(colors.background)
    void NavigationBar.setBackgroundColorAsync(colors.background)
    void NavigationBar.setStyle('light')
  }, [visible])

  return (
    <Modal
      visible={visible}
      statusBarTranslucent={
        statusBarTranslucent ?? Platform.OS === 'android'
      }
      navigationBarTranslucent={
        navigationBarTranslucent ?? Platform.OS === 'android'
      }
      {...rest}
    >
      <View style={styles.host}>
        {visible && navBarUnderlayColor !== 'transparent' ? (
          <AndroidNavBarUnderlay color={navBarUnderlayColor} />
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
})
