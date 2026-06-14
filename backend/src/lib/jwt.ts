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

export type PrefeituraAccessClaims = {
  sub: string
  cpf: string
  nome: string
  accessLevel: string
  entidadeContratanteId: string
}

export type UbtAccessClaims = {
  sub: string
  cpf: string
  nome: string
  accessLevel: string
  entidadeContratanteId: string
  unidadeUbtId: string
}

export type ProfissionalAccessClaims = {
  sub: string
  cpf: string
  nome: string
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

export async function signPrefeituraAccessToken(claims: PrefeituraAccessClaims): Promise<string> {
  return new SignJWT({
    cpf: claims.cpf,
    nome: claims.nome,
    accessLevel: claims.accessLevel,
    entidadeContratanteId: claims.entidadeContratanteId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .setIssuer('telefarmed-prefeitura')
    .setAudience('telefarmed-prefeitura-api')
    .sign(accessSecret)
}

export async function verifyAccessToken(token: string): Promise<AdminAccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret, {
    issuer: 'telefarmed-admin',
    audience: 'telefarmed-admin-api',
  })

  return adminClaimsFromPayload(payload)
}

export async function verifyPrefeituraAccessToken(token: string): Promise<PrefeituraAccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret, {
    issuer: 'telefarmed-prefeitura',
    audience: 'telefarmed-prefeitura-api',
  })

  return prefeituraClaimsFromPayload(payload)
}

export async function signUbtAccessToken(claims: UbtAccessClaims): Promise<string> {
  return new SignJWT({
    cpf: claims.cpf,
    nome: claims.nome,
    accessLevel: claims.accessLevel,
    entidadeContratanteId: claims.entidadeContratanteId,
    unidadeUbtId: claims.unidadeUbtId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .setIssuer('telefarmed-ubt')
    .setAudience('telefarmed-ubt-api')
    .sign(accessSecret)
}

export async function verifyUbtAccessToken(token: string): Promise<UbtAccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret, {
    issuer: 'telefarmed-ubt',
    audience: 'telefarmed-ubt-api',
  })

  return ubtClaimsFromPayload(payload)
}

export async function signProfissionalAccessToken(
  claims: ProfissionalAccessClaims,
): Promise<string> {
  return new SignJWT({
    cpf: claims.cpf,
    nome: claims.nome,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .setIssuer('telefarmed-profissional')
    .setAudience('telefarmed-profissional-api')
    .sign(accessSecret)
}

export async function verifyProfissionalAccessToken(
  token: string,
): Promise<ProfissionalAccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret, {
    issuer: 'telefarmed-profissional',
    audience: 'telefarmed-profissional-api',
  })

  return profissionalClaimsFromPayload(payload)
}

function adminClaimsFromPayload(payload: JWTPayload): AdminAccessClaims {
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

function prefeituraClaimsFromPayload(payload: JWTPayload): PrefeituraAccessClaims {
  const sub = payload.sub
  if (!sub || typeof sub !== 'string') {
    throw new Error('Token inválido')
  }

  const cpf = payload.cpf
  const nome = payload.nome
  const accessLevel = payload.accessLevel
  const entidadeContratanteId = payload.entidadeContratanteId

  if (
    typeof cpf !== 'string' ||
    typeof nome !== 'string' ||
    typeof accessLevel !== 'string' ||
    typeof entidadeContratanteId !== 'string'
  ) {
    throw new Error('Token inválido')
  }

  return { sub, cpf, nome, accessLevel, entidadeContratanteId }
}

function profissionalClaimsFromPayload(payload: JWTPayload): ProfissionalAccessClaims {
  const sub = payload.sub
  if (!sub || typeof sub !== 'string') {
    throw new Error('Token inválido')
  }

  const cpf = payload.cpf
  const nome = payload.nome

  if (typeof cpf !== 'string' || typeof nome !== 'string') {
    throw new Error('Token inválido')
  }

  return { sub, cpf, nome }
}

function ubtClaimsFromPayload(payload: JWTPayload): UbtAccessClaims {
  const sub = payload.sub
  if (!sub || typeof sub !== 'string') {
    throw new Error('Token inválido')
  }

  const cpf = payload.cpf
  const nome = payload.nome
  const accessLevel = payload.accessLevel
  const entidadeContratanteId = payload.entidadeContratanteId
  const unidadeUbtId = payload.unidadeUbtId

  if (
    typeof cpf !== 'string' ||
    typeof nome !== 'string' ||
    typeof accessLevel !== 'string' ||
    typeof entidadeContratanteId !== 'string' ||
    typeof unidadeUbtId !== 'string'
  ) {
    throw new Error('Token inválido')
  }

  return { sub, cpf, nome, accessLevel, entidadeContratanteId, unidadeUbtId }
}
