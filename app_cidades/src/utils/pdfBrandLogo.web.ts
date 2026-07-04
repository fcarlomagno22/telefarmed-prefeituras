import { Asset } from 'expo-asset'
import {
  fetchUriAsDataUri,
  resolveConfiguredPdfLogoDataUri,
} from './pdfBrandLogoShared'

async function readUriAsDataUri(uri: string): Promise<string> {
  return fetchUriAsDataUri(uri)
}

async function resolveModuleAssetDataUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId)
  await asset.downloadAsync()

  const uri = asset.uri
  if (!uri) {
    throw new Error('Logomarca indisponível.')
  }

  return readUriAsDataUri(uri)
}

export async function resolvePdfLogoDataUri(): Promise<string> {
  return resolveConfiguredPdfLogoDataUri(readUriAsDataUri, resolveModuleAssetDataUri)
}
