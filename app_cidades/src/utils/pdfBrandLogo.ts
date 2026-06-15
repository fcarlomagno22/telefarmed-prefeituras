import * as FileSystem from 'expo-file-system/legacy'
import { Image } from 'react-native'
import { appEnv } from '../config/env'

const bundledLogo = require('../../assets/logo.png')

function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function toBase64FromArrayBuffer(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary)
  }

  throw new Error('Não foi possível codificar a logomarca para o PDF.')
}

export async function resolvePdfLogoDataUri(): Promise<string> {
  const configured = appEnv.logoUrl.trim()
  if (isRemoteUrl(configured)) {
    return configured
  }

  const asset = Image.resolveAssetSource(bundledLogo)
  if (!asset?.uri) {
    throw new Error('Logomarca indisponível.')
  }

  if (asset.uri.startsWith('data:')) {
    return asset.uri
  }

  if (asset.uri.startsWith('http://') || asset.uri.startsWith('https://')) {
    const response = await fetch(asset.uri)
    if (!response.ok) {
      throw new Error('Não foi possível carregar a logomarca.')
    }
    const buffer = await response.arrayBuffer()
    return `data:image/png;base64,${toBase64FromArrayBuffer(buffer)}`
  }

  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  return `data:image/png;base64,${base64}`
}
