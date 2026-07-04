export {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  documentDirectory,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
} from 'expo-file-system/legacy'

export function getPublicFileUri(uri: string): string {
  return uri
}
