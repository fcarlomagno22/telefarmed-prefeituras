import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  BPA_HEADER_LENGTH,
  BPA_LINEBREAK,
  BPA_RECORD_LENGTH,
  TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
} from './constants.js'
import {
  assertBpaFileStructure,
  buildBpaTeleconsultaExport,
  measureBpaFileBytes,
} from './buildBpaTeleconsultaExport.js'
import {
  buildBpaHeaderLine,
  buildBpaRecordLine,
  extractPatientCnsFromRecordLine,
  extractPatientCpfFromRecordLine,
  extractProcedureCodeFromRecordLine,
  extractQuantityFromRecordLine,
} from './layout.js'
import type { BpaTeleconsultaInput } from './types.js'
import { validateTeleconsultaForBpa } from './validateTeleconsulta.js'

const institution = {
  cnesExecutante: '7654321',
  responsavelNome: 'SECRETARIA MUNICIPAL DE SAUDE',
  responsavelSigla: 'SMS',
  responsavelCnpjCpf: '12345678000199',
  destinatarioNome: 'SECRETARIA ESTADUAL DE SAUDE',
  destinoIndicador: 'M' as const,
  versaoSistema: 'TELEFARMED001',
}

const baseRecord: BpaTeleconsultaInput = {
  consultaId: 'uuid-1',
  codigoAtendimento: 'CNS-001',
  competencia: '2026-06',
  realizadoEm: '2026-06-15T14:30:00.000Z',
  cnesExecutante: '7654321',
  profissionalCns: '898001234567890',
  profissionalCbo: '225125',
  procedimentoCodigo: TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
  pacienteNome: 'Maria da Silva Souza',
  pacienteNascimento: '1990-03-12',
  pacienteSexo: 'feminino',
  pacienteRacaCor: 'parda',
  pacienteNacionalidade: 'brasileira',
  pacienteIbge6: '355030',
  pacienteCns: '706001234567890',
  pacienteCpf: null,
  pacienteEndereco: {
    ibge: '3550308',
    cep: '01310100',
    logradouro: 'AV PAULISTA',
    numero: '1000',
    bairro: 'BELA VISTA',
  },
  pacienteTelefone: '11999999999',
  pacienteEmail: 'maria@example.com',
  situacaoRua: 'N',
  clinicalCid: null,
  folha: 1,
  sequencia: 1,
}

describe('BPA-I teleconsulta médica especializada', () => {
  it('gera cabeçalho com 130 caracteres', () => {
    const header = buildBpaHeaderLine({
      competencia: '2026-06',
      totalRegistros: 1,
      totalFolhas: 1,
      responsavelNome: institution.responsavelNome,
      responsavelSigla: institution.responsavelSigla,
      responsavelCnpjCpf: institution.responsavelCnpjCpf,
      destinatarioNome: institution.destinatarioNome,
      destinoIndicador: 'M',
      versaoSistema: institution.versaoSistema,
    })

    assert.equal(header.length, BPA_HEADER_LENGTH)
    assert.equal(header.slice(0, 2), '01')
    assert.equal(header.slice(2, 7), '#BPA#')
  })

  it('gera registro BPA-I com 350 caracteres', () => {
    const line = buildBpaRecordLine(baseRecord)
    assert.equal(line.length, BPA_RECORD_LENGTH)
    assert.equal(line.slice(0, 2), '03')
  })

  it('usa CRLF e totaliza 484 bytes para uma consulta', () => {
    const exportResult = buildBpaTeleconsultaExport({
      competencia: '2026-06',
      loteId: 'LOTE-TEST',
      entidadeNome: institution.responsavelNome,
      entidadeCnpj: institution.responsavelCnpjCpf,
      configFaturamentoSus: {
        cnesExecutante: institution.cnesExecutante,
        responsavelNome: institution.responsavelNome,
        responsavelSigla: institution.responsavelSigla,
        responsavelCnpjCpf: institution.responsavelCnpjCpf,
        destinatarioNome: institution.destinatarioNome,
        destinoIndicador: 'M',
        versaoSistema: institution.versaoSistema,
      },
      sources: [
        {
          consultaId: 'uuid-1',
          codigoAtendimento: 'CNS-001',
          competencia: '2026-06',
          status: 'concluida',
          realizadoEm: '2026-06-15T14:30:00.000Z',
          excluded: false,
          profissionalFormacao: 'medicina',
          profissionalCns: '898001234567890',
          profissionalCbo: '225125',
          cboCompativel: true,
          procedimentoCodigo: TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
          pacienteNome: 'Maria da Silva Souza',
          pacienteNascimento: '1990-03-12',
          pacienteSexo: 'feminino',
          pacienteRacaCor: 'parda',
          pacienteNacionalidade: 'brasileira',
          pacienteCns: null,
          pacienteCnsPendente: true,
          pacienteCpf: '39053344705',
          pacienteEndereco: { ibge: '3550308' },
          pacienteTelefone: null,
          pacienteEmail: null,
          situacaoRua: 'N',
          clinicalCid: null,
          duplicateConsultaId: null,
        },
      ],
    })

    assert.equal(exportResult.includedCount, 1)
    assert.match(exportResult.txtBody, /\r\n/)
    assert.equal(measureBpaFileBytes(exportResult.txtBody), 484)
    assertBpaFileStructure(exportResult.txtBody, 1)
  })

  it('posiciona procedimento 0301010307 nas posições 50-59', () => {
    const line = buildBpaRecordLine(baseRecord)
    assert.equal(extractProcedureCodeFromRecordLine(line), '0301010307')
  })

  it('mantém CPF e CNS mutuamente exclusivos', () => {
    const withCns = buildBpaRecordLine(baseRecord)
    assert.equal(extractPatientCnsFromRecordLine(withCns).trim(), '706001234567890')
    assert.equal(extractPatientCpfFromRecordLine(withCns).trim(), '')

    const withCpf = buildBpaRecordLine({
      ...baseRecord,
      pacienteCns: null,
      pacienteCpf: '39053344705',
    })
    assert.equal(extractPatientCnsFromRecordLine(withCpf).trim(), '')
    assert.equal(extractPatientCpfFromRecordLine(withCpf).trim(), '39053344705')
  })

  it('fixa quantidade em 000001', () => {
    const line = buildBpaRecordLine(baseRecord)
    assert.equal(extractQuantityFromRecordLine(line), '000001')
  })

  it('bloqueia registros inválidos e não os inclui no TXT', () => {
    const exportResult = buildBpaTeleconsultaExport({
      competencia: '2026-06',
      loteId: null,
      entidadeNome: institution.responsavelNome,
      entidadeCnpj: institution.responsavelCnpjCpf,
      configFaturamentoSus: {
        cnesExecutante: institution.cnesExecutante,
        responsavelNome: institution.responsavelNome,
        responsavelSigla: institution.responsavelSigla,
        responsavelCnpjCpf: institution.responsavelCnpjCpf,
        destinatarioNome: institution.destinatarioNome,
        destinoIndicador: 'M',
      },
      sources: [
        {
          consultaId: 'uuid-bloqueado',
          codigoAtendimento: 'CNS-002',
          competencia: '2026-06',
          status: 'concluida',
          realizadoEm: '2026-06-15T14:30:00.000Z',
          excluded: false,
          profissionalFormacao: 'medicina',
          profissionalCns: null,
          profissionalCbo: '225125',
          cboCompativel: true,
          procedimentoCodigo: TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
          pacienteNome: 'Joao',
          pacienteNascimento: '1990-03-12',
          pacienteSexo: 'masculino',
          pacienteRacaCor: 'branca',
          pacienteNacionalidade: 'brasileira',
          pacienteCns: null,
          pacienteCnsPendente: true,
          pacienteCpf: null,
          pacienteEndereco: { ibge: '3550308' },
          pacienteTelefone: null,
          pacienteEmail: null,
          situacaoRua: ' ',
          clinicalCid: null,
          duplicateConsultaId: null,
        },
      ],
    })

    assert.equal(exportResult.includedCount, 0)
    assert.equal(exportResult.txtBody, '')
    assert.ok(exportResult.blocked.length === 1)
  })

  it('valida bloqueio por CPF e CNS simultâneos', () => {
    const validation = validateTeleconsultaForBpa(
      {
        consultaId: 'uuid-3',
        codigoAtendimento: 'CNS-003',
        competencia: '2026-06',
        status: 'concluida',
        realizadoEm: '2026-06-15T14:30:00.000Z',
        excluded: false,
        profissionalFormacao: 'medicina',
        profissionalCns: '898001234567890',
        profissionalCbo: '225125',
        cboCompativel: true,
        procedimentoCodigo: TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
        pacienteNome: 'Maria da Silva Souza',
        pacienteNascimento: '1990-03-12',
        pacienteSexo: 'feminino',
        pacienteRacaCor: 'parda',
        pacienteNacionalidade: 'brasileira',
        pacienteCns: '898001234567800',
        pacienteCnsPendente: false,
        pacienteCpf: '39053344705',
        pacienteEndereco: { ibge: '3550308' },
        pacienteTelefone: null,
        pacienteEmail: null,
        situacaoRua: 'N',
        clinicalCid: null,
        duplicateConsultaId: null,
      },
      institution,
    )

    assert.equal(validation.ok, false)
    if (!validation.ok) {
      assert.ok(validation.reasons.includes('paciente_cpf_e_cns_simultaneos'))
    }
  })

  it('usa CRLF entre linhas', () => {
    const exportResult = buildBpaTeleconsultaExport({
      competencia: '2026-06',
      loteId: 'LOTE-CRLF',
      entidadeNome: institution.responsavelNome,
      entidadeCnpj: institution.responsavelCnpjCpf,
      configFaturamentoSus: {
        cnesExecutante: institution.cnesExecutante,
        responsavelNome: institution.responsavelNome,
        responsavelSigla: institution.responsavelSigla,
        responsavelCnpjCpf: institution.responsavelCnpjCpf,
        destinatarioNome: institution.destinatarioNome,
        destinoIndicador: 'M',
      },
      sources: [
        {
          consultaId: 'uuid-1',
          codigoAtendimento: 'CNS-001',
          competencia: '2026-06',
          status: 'concluida',
          realizadoEm: '2026-06-15T14:30:00.000Z',
          excluded: false,
          profissionalFormacao: 'medicina',
          profissionalCns: '898001234567890',
          profissionalCbo: '225125',
          cboCompativel: true,
          procedimentoCodigo: TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
          pacienteNome: 'Maria da Silva Souza',
          pacienteNascimento: '1990-03-12',
          pacienteSexo: 'feminino',
          pacienteRacaCor: 'parda',
          pacienteNacionalidade: 'brasileira',
          pacienteCns: null,
          pacienteCnsPendente: true,
          pacienteCpf: '39053344705',
          pacienteEndereco: { ibge: '3550308' },
          pacienteTelefone: null,
          pacienteEmail: null,
          situacaoRua: 'N',
          clinicalCid: null,
          duplicateConsultaId: null,
        },
      ],
    })

    const parts = exportResult.txtBody.split(BPA_LINEBREAK).filter(Boolean)
    assert.equal(parts.length, 2)
  })
})
