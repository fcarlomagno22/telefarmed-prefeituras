import argon2 from 'argon2'
import { createHash, randomBytes } from 'node:crypto'

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 4,
}

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false
  }
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
