import type { PwaInstallMode } from '../utils/pwaInstall.types'

type UsePwaInstallResult = {
  visible: boolean
  installMode: PwaInstallMode
  isInstalling: boolean
  canNativeInstall: boolean
  dismiss: () => void
  install: () => Promise<void>
}

export function usePwaInstall(): UsePwaInstallResult {
  return {
    visible: false,
    installMode: 'native',
    isInstalling: false,
    canNativeInstall: false,
    dismiss: () => {},
    install: async () => {},
  }
}
