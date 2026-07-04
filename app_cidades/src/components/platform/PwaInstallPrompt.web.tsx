import { usePwaInstall } from '../../hooks/usePwaInstall'
import { PwaInstallDrawer } from './PwaInstallDrawer'

export function PwaInstallPrompt() {
  const { visible, installMode, isInstalling, canNativeInstall, dismiss, install } = usePwaInstall()

  return (
    <PwaInstallDrawer
      visible={visible}
      installMode={installMode}
      isInstalling={isInstalling}
      canNativeInstall={canNativeInstall}
      onInstall={() => void install()}
      onDismiss={dismiss}
    />
  )
}
