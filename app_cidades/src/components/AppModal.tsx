import * as NavigationBar from 'expo-navigation-bar'
import { useEffect } from 'react'
import { Modal, ModalProps, Platform, StyleSheet, View } from 'react-native'
import { drawerChrome } from '../theme/drawerChrome'
import { AndroidNavBarUnderlay } from './AndroidNavBarUnderlay'

type AppModalProps = ModalProps & {
  navBarUnderlayColor?: string
}

export function AppModal({
  children,
  visible,
  navBarUnderlayColor = drawerChrome.navBarUnderlay,
  statusBarTranslucent,
  navigationBarTranslucent,
  ...rest
}: AppModalProps) {
  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) return

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
        {visible ? <AndroidNavBarUnderlay color={navBarUnderlayColor} /> : null}
        <View style={styles.content}>{children}</View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
})
