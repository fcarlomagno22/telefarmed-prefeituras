import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildRegisterLegalAgreements,
  summarizeRegistrationTermContent,
} from './registerLegalAgreements.ts'

describe('registerLegalAgreements', () => {
  it('resume conteúdo longo com reticências', () => {
    const summary = summarizeRegistrationTermContent(`${'A'.repeat(200)}\n\nSegundo parágrafo`)
    assert.match(summary, /…$/)
    assert.ok(summary.length <= 180)
  })

  it('monta termos do app e anexa ciência de dados do cadastro paciente', () => {
    const agreements = buildRegisterLegalAgreements(
      {
        terms: {
          termsOfUse: {
            acceptanceKey: 'termsOfUse',
            id: 'vd_cadastro_termos_uso',
            title: 'Termos de Uso do App',
            content: 'Conteúdo dos termos de uso.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
          },
          privacyPolicy: {
            acceptanceKey: 'privacyPolicy',
            id: 'privacidade',
            title: 'Privacidade',
            content: 'Conteúdo da privacidade.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
          },
          lgpdConsent: {
            acceptanceKey: 'lgpdConsent',
            id: 'lgpd',
            title: 'LGPD',
            content: 'Conteúdo LGPD.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
          },
          healthDataConsent: {
            acceptanceKey: 'healthDataConsent',
            id: 'cadastro_autorizacao_teleconsulta',
            title: 'Teleconsulta',
            content: 'Autorizo teleconsulta.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
            secondaryDocumentId: 'cadastro_ciencia_dados',
          },
          communicationsConsent: {
            acceptanceKey: 'communicationsConsent',
            id: 'cadastro_permissao_notificacoes',
            title: 'Notificações',
            content: 'Aceito notificações.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
          },
        },
      },
      {
        terms: {
          dataReviewed: {
            id: 'cadastro_conferencia_dados',
            title: 'Conferência',
            content: 'Conferi os dados.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
          },
          teleconsultationAuthorized: {
            id: 'cadastro_autorizacao_teleconsulta',
            title: 'Teleconsulta UBT',
            content: 'Autorizo teleconsulta UBT.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
          },
          dataUsageAcknowledged: {
            id: 'cadastro_ciencia_dados',
            title: 'Ciência de dados',
            content: 'Tenho ciência sobre uso dos dados.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
          },
          notificationsAllowed: {
            id: 'cadastro_permissao_notificacoes',
            title: 'Notificações UBT',
            content: 'Permito notificações UBT.',
            version: '1.0',
            updatedAtLabel: 'Jul/2026',
          },
        },
      },
    )

    assert.equal(agreements.length, 5)
    assert.equal(agreements[0]?.title, 'Termos de Uso do App')
    assert.match(agreements[3]?.fullContent ?? '', /Autorizo teleconsulta\./)
    assert.match(agreements[3]?.fullContent ?? '', /Tenho ciência sobre uso dos dados\./)
  })

  it('usa fallback local quando termos do app não estão disponíveis', () => {
    const agreements = buildRegisterLegalAgreements(null, null)
    assert.equal(agreements.length, 5)
    assert.equal(agreements[0]?.id, 'termsOfUse')
    assert.match(agreements[0]?.title ?? '', /Termos de Uso/)
  })
})
