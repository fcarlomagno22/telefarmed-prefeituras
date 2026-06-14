export async function mockDelay<T>(value: T, ms = 0): Promise<T> {
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }
  return value
}
