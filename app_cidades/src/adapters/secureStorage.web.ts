const secureValues = new Map<string, string>()

export async function getSecureItemAsync(key: string): Promise<string | null> {
  return secureValues.get(key) ?? null
}

export async function setSecureItemAsync(key: string, value: string): Promise<void> {
  secureValues.set(key, value)
}

export async function removeSecureItemAsync(key: string): Promise<void> {
  secureValues.delete(key)
}
