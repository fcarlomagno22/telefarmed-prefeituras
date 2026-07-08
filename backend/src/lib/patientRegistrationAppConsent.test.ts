import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS,
  APP_TO_UBT_CONSENT_SOURCE_KEYS,
  appRegistrationConsentSchema,
  buildAppRegistrationConsent,
  buildConsentimentoCadastroFromAppRegistration,
  mapAppAcceptancesToRegistrationConsent,
  resolveRegistrationAcceptedAt,
  resolveSelfServiceOperatorName,
  SELF_SERVICE_OPERATOR_NAME_DEFAULT,
} from './patientRegistrationAppConsent.js'

const baseAcceptances = {
  termsOfUse: true as const,
  privacyPolicy: true as const,
  lgpdConsent: true as const,
  healthDataConsent: true as const,
  communicationsConsent: true as const,
  acceptedAt: '2026-07-07T22:00:00.000Z',
}

const baseContext = {
  patientName: 'Maria Silva',
  entityDisplayName: 'Prefeitura de Exemplo',
  entidadeId: '11111111-1111-4111-8111-111111111111',
}

describe('patientRegistrationAppConsent', () => {
  it('resolveSelfServiceOperatorName retorna Autoatendimento', () => {
    assert.equal(resolveSelfServiceOperatorName('Maria Silva'), SELF_SERVICE_OPERATOR_NAME_DEFAULT)
    assert.equal(resolveSelfServiceOperatorName('   '), SELF_SERVICE_OPERATOR_NAME_DEFAULT)
  })

  it('buildAppRegistrationConsent preenche 4 literais UBT com defaults self-service', () => {
    const consent = buildAppRegistrationConsent({
      acceptances: baseAcceptances,
      context: baseContext,
    })

    assert.equal(appRegistrationConsentSchema.safeParse(consent).success, true)
    assert.equal(consent.operatorName, 'Autoatendimento')
    assert.equal(consent.registrationUnitName, 'Prefeitura de Exemplo')
    assert.equal(consent.registeredAt, '2026-07-07T22:00:00.000Z')
  })

  it('resolveRegistrationAcceptedAt gera ISO quando acceptedAt omitido', () => {
    const { acceptedAt: _ignored, ...withoutTimestamp } = baseAcceptances
    const resolved = resolveRegistrationAcceptedAt(withoutTimestamp)
    assert.equal(Number.isNaN(Date.parse(resolved)), false)
  })

  it('mapAppAcceptancesToRegistrationConsent preenche operador e unidade sem IDs UBT', () => {
    const consent = mapAppAcceptancesToRegistrationConsent({
      acceptances: baseAcceptances,
      context: baseContext,
    })

    assert.equal(consent.dataReviewed, true)
    assert.equal(consent.teleconsultationAuthorized, true)
    assert.equal(consent.dataUsageAcknowledged, true)
    assert.equal(consent.notificationsAllowed, true)
    assert.equal(consent.operatorName, 'Autoatendimento')
    assert.equal(consent.registrationUnitName, 'Prefeitura de Exemplo')
    assert.equal(consent.registeredAt, '2026-07-07T22:00:00.000Z')
    assert.equal(consent.registrationUnitId, undefined)
    assert.equal(consent.operatorUserId, undefined)
    assert.equal(consent.operatorAdminId, undefined)
  })

  it('buildConsentimentoCadastroFromAppRegistration persiste canal app e trilha de aceites', () => {
    const jsonb = buildConsentimentoCadastroFromAppRegistration({
      acceptances: baseAcceptances,
      context: baseContext,
    })

    assert.equal(jsonb.canal, 'app_vd')
    assert.equal(jsonb.operador_nome, 'Autoatendimento')
    assert.equal(jsonb.paciente_nome, 'Maria Silva')
    assert.equal(jsonb.unidade_ubt_nome, 'Prefeitura de Exemplo')
    assert.equal(jsonb.dados_conferidos, true)
    assert.deepEqual(jsonb.mapeamento_ubt, APP_TO_UBT_CONSENT_SOURCE_KEYS)

    const appAceites = jsonb.app_aceites as Record<
      string,
      { chave: string; documento_id: string; documento_secundario_id?: string }
    >

    assert.equal(
      appAceites.termos_uso.documento_id,
      APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS.termsOfUse,
    )
    assert.equal(
      appAceites.politica_privacidade.documento_id,
      APP_LEGAL_ACCEPTANCE_DOCUMENT_IDS.privacyPolicy,
    )
    assert.equal(
      appAceites.dados_saude.documento_secundario_id,
      'cadastro_ciencia_dados',
    )
    assert.equal(appAceites.comunicacoes.chave, 'communicationsConsent')
  })
})
