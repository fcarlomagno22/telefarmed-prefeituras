import { Asset } from 'expo-asset'
import { EncodingType, readAsStringAsync } from '../adapters/fileSystem'
import {
  fetchUriAsDataUri,
  resolveConfiguredPdfLogoDataUri,
} from './pdfBrandLogoShared'

async function readUriAsDataUri(uri: string): Promise<string> {
  if (
    uri.startsWith('data:') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('blob:')
  ) {
    return fetchUriAsDataUri(uri)
  }

  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  })

  return `data:image/png;base64,${base64}`
}

async function resolveModuleAssetDataUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId)
  await asset.downloadAsync()
  const uri = asset.localUri ?? asset.uri
  if (!uri) {
    throw new Error('Logomarca indisponível.')
  }

  return readUriAsDataUri(uri)
}

export async function resolvePdfLogoDataUri(): Promise<string> {
  return resolveConfiguredPdfLogoDataUri(readUriAsDataUri, resolveModuleAssetDataUri)
}
