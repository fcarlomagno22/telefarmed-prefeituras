export type SecureStorageAdapter = {
  getSecureItemAsync: (key: string) => Promise<string | null>
  setSecureItemAsync: (key: string, value: string) => Promise<void>
  removeSecureItemAsync: (key: string) => Promise<void>
}
