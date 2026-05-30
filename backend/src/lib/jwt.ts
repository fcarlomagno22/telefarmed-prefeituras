import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { env } from '../config/env.js'

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)

export type AdminAccessClaims = {
  sub: string
  cpf: string
  nome: string
  accessLevel: string
  isMaster: boolean
}

const ACCESS_TTL = '15m'

export async function signAccessToken(claims: AdminAccessClaims): Promise<string> {
  return new SignJWT({
    cpf: claims.cpf,
    nome: claims.nome,
    accessLevel: claims.accessLevel,
    isMaster: claims.isMaster,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .setIssuer('telefarmed-admin')
    .setAudience('telefarmed-admin-api')
    .sign(accessSecret)
}

export async function verifyAccessToken(token: string): Promise<AdminAccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret, {
    issuer: 'telefarmed-admin',
    audience: 'telefarmed-admin-api',
  })

  return claimsFromPayload(payload)
}

function claimsFromPayload(payload: JWTPayload): AdminAccessClaims {
  const sub = payload.sub
  if (!sub || typeof sub !== 'string') {
    throw new Error('Token inválido')
  }

  const cpf = payload.cpf
  const nome = payload.nome
  const accessLevel = payload.accessLevel
  const isMaster = payload.isMaster

  if (
    typeof cpf !== 'string' ||
    typeof nome !== 'string' ||
    typeof accessLevel !== 'string' ||
    typeof isMaster !== 'boolean'
  ) {
    throw new Error('Token inválido')
  }

  return { sub, cpf, nome, accessLevel, isMaster }
}
