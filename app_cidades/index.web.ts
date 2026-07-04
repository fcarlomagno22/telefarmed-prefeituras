import { applyWebChromeColor } from './src/adapters/webChromeTheme.web'
import { registerPwaServiceWorker } from './src/utils/pwaInstall.web'

applyWebChromeColor()
registerPwaServiceWorker()

import 'react-native-gesture-handler'

import { registerRootComponent } from 'expo'

import App from './App'

registerRootComponent(App)
