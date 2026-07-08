import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  extractAppCidadesClientSlug,
  isAppCidadesDedicatedHost,
  isVdPlatformHost,
  normalizeVdTenantEntitySlugInput,
} from './appCidadesHost.js'
import { buildVdUrl, vdPublicUrl } from './publicUrls.js'
import {
  DEFAULT_VD_PLATFORM_ENTITY_SLUG,
  isVdPlatformTenant,
  VD_LEGACY_INTERNAL_DEMO_SLUG,
} from './vdPlatformEntity.js'
import { publicUrlForTenant, toPublicTenantPayload, vdHostSlugForTenant } from '../../modules/public-tenant/serializer.js'
import type { ResolvedTenant } from './types.js'

const telefarmedBranding: ResolvedTenant['branding'] = {
  logoUrl: 'https://www.telefarmed.com.br/logo_4.png',
  loginBackgroundUrl: null,
  faviconUrl: null,
  corPrimaria: '#f97316',
  nomeMarca: 'Telefarmed',
  terminologia: {
    rede: 'Rede',
    gestao: 'Gestão',
    portal_gestao: 'Portal de gestão',
    contrato: 'Contrato',
    operador_plataforma: 'Operador',
    satisfacao_publico: 'Satisfação',
  },
  tipoEntidade: 'generico',
}

describe('appCidadesHost', () => {
  it('detecta hosts dedicados do app cidadão', () => {
    assert.equal(isAppCidadesDedicatedHost('vd.telefarmed.com.br'), true)
    assert.equal(isAppCidadesDedicatedHost('vd-santacasa.telefarmed.com.br'), true)
    assert.equal(isAppCidadesDedicatedHost('santacasa.telefarmed.com.br'), false)
  })

  it('extrai slug da entidade de vd-{slug}', () => {
    assert.equal(extractAppCidadesClientSlug('vd-santacasa.telefarmed.com.br'), 'santacasa')
    assert.equal(extractAppCidadesClientSlug('vd.telefarmed.com.br'), null)
    assert.equal(extractAppCidadesClientSlug('vd-.telefarmed.com.br'), null)
  })

  it('normaliza slug da entidade a partir de query', () => {
    assert.equal(normalizeVdTenantEntitySlugInput('santacasa'), 'santacasa')
    assert.equal(normalizeVdTenantEntitySlugInput('vd-santacasa'), 'santacasa')
    assert.equal(normalizeVdTenantEntitySlugInput('vd-'), null)
    assert.equal(normalizeVdTenantEntitySlugInput(VD_LEGACY_INTERNAL_DEMO_SLUG), null)
  })

  it('detecta host plataforma vd sem slug de cliente', () => {
    assert.equal(isVdPlatformHost('vd.telefarmed.com.br'), true)
    assert.equal(isVdPlatformHost('vd.localhost:8081'), true)
    assert.equal(isVdPlatformHost('vd-santacasa.telefarmed.com.br'), false)
  })
})

describe('vd platform entity tenant', () => {
  it('identifica tenant da entidade plataforma Telefarmed', () => {
    const tenant: ResolvedTenant = {
      kind: 'vd',
      slug: DEFAULT_VD_PLATFORM_ENTITY_SLUG,
      entidadeId: 'f0000000-0000-4000-8000-000000000001',
      branding: telefarmedBranding,
    }

    assert.equal(isVdPlatformTenant(tenant), true)
    assert.equal(vdHostSlugForTenant(tenant), null)
    assert.match(publicUrlForTenant(tenant), /https:\/\/vd\./)
  })
})

describe('vd tenant serializer', () => {
  const tenant: ResolvedTenant = {
    kind: 'vd',
    slug: 'santacasa',
    entidadeId: '11111111-1111-4111-8111-111111111111',
    branding: {
      logoUrl: null,
      loginBackgroundUrl: null,
      faviconUrl: null,
      corPrimaria: '#ff6b00',
      nomeMarca: 'Santa Casa',
      terminologia: telefarmedBranding.terminologia,
      tipoEntidade: 'prefeitura',
    },
  }

  it('monta payload público do app cidadão', () => {
    const payload = toPublicTenantPayload(tenant)

    assert.equal(payload.portalKind, 'vd')
    assert.equal(payload.kind, 'vd')
    assert.equal(payload.slug, 'santacasa')
    assert.equal(payload.vdHostSlug, 'vd-santacasa')
    assert.equal(payload.entidadeId, tenant.entidadeId)
    assert.equal(payload.loginPath, '/login')
    assert.match(payload.publicUrl ?? '', /vd-santacasa/)
  })

  it('vdHostSlugForTenant retorna null fora do kind vd', () => {
    assert.equal(
      vdHostSlugForTenant({
        kind: 'gestao',
        slug: 'santacasa',
        entidadeId: 'x',
        branding: tenant.branding,
      }),
      null,
    )
  })

  it('buildVdUrl usa host vd-{slug}', () => {
    assert.match(buildVdUrl('santacasa'), /vd-santacasa/)
    assert.match(vdPublicUrl('santacasa'), /\/login$/)
    assert.match(publicUrlForTenant(tenant), /vd-santacasa/)
  })

  it('payload da entidade plataforma usa host vd sem vdHostSlug', () => {
    const platformTenant: ResolvedTenant = {
      kind: 'vd',
      slug: DEFAULT_VD_PLATFORM_ENTITY_SLUG,
      entidadeId: 'f0000000-0000-4000-8000-000000000001',
      branding: telefarmedBranding,
    }
    const payload = toPublicTenantPayload(platformTenant)

    assert.equal(payload.vdHostSlug, null)
    assert.equal(payload.entidadeId, platformTenant.entidadeId)
    assert.equal(payload.slug, DEFAULT_VD_PLATFORM_ENTITY_SLUG)
    assert.match(payload.publicUrl ?? '', /https:\/\/vd\./)
    assert.equal(payload.branding.nomeMarca, 'Telefarmed')
  })
})
