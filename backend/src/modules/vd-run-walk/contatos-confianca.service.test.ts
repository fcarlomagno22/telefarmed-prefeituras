import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { RunWalkContatoConfiancaRow } from './contatos-confianca.formatters.js'
import {
  activateRunWalkContatoConfiancaSos,
  createRunWalkContatoConfianca,
  deleteRunWalkContatoConfianca,
  getRunWalkContatosConfianca,
  updateRunWalkContatoConfianca,
  type ContatosConfiancaServiceDeps,
} from './contatos-confianca.service.js'
import { VdRunWalkError } from './errors.js'
import type { VdRunWalkPacienteScope } from './types.js'

const scope: VdRunWalkPacienteScope = {
  pacienteId: 'pac-1',
  entidadeContratanteId: 'ent-1',
  cpf: '12345678901',
}

function mockRow(overrides: Partial<RunWalkContatoConfiancaRow> = {}): RunWalkContatoConfiancaRow {
  return {
    id: 'contact-1',
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    client_contact_id: 'client-contact-1',
    name: 'Maria',
    phone: '11999998888',
    live_share_enabled: true,
    is_active_sos: true,
    sort_order: 0,
    deleted_at: null,
    criado_em: '2026-07-08T10:00:00.000Z',
    atualizado_em: '2026-07-08T10:00:00.000Z',
    ...overrides,
  }
}

function createDeps(initialRows: RunWalkContatoConfiancaRow[] = []): ContatosConfiancaServiceDeps {
  const rows = new Map(initialRows.map((row) => [row.id, { ...row }]))

  return {
    list: async () =>
      [...rows.values()]
        .filter((row) => row.deleted_at === null)
        .sort((a, b) => a.sort_order - b.sort_order),
    count: async () => [...rows.values()].filter((row) => row.deleted_at === null).length,
    findById: async (_scope, id) => {
      const row = rows.get(id)
      if (!row || row.deleted_at !== null) return null
      return row
    },
    findByClientId: async (_scope, clientContactId) =>
      [...rows.values()].find((row) => row.client_contact_id === clientContactId) ?? null,
    resolveNextSortOrder: async () => {
      const active = [...rows.values()].filter((row) => row.deleted_at === null)
      if (active.length === 0) return 0
      return Math.max(...active.map((row) => row.sort_order)) + 1
    },
    insert: async (_scope, input) => {
      const row = mockRow({
        id: `contact-${rows.size + 1}`,
        client_contact_id: input.clientContactId,
        name: input.name,
        phone: input.phoneDigits,
        live_share_enabled: input.liveShareEnabled,
        is_active_sos: input.isActiveSos,
        sort_order: input.sortOrder,
      })
      rows.set(row.id, row)
      return row
    },
    update: async (_scope, id, patch) => {
      const current = rows.get(id)
      if (!current) throw new Error('not found')
      const next = {
        ...current,
        name: patch.name ?? current.name,
        phone: patch.phoneDigits ?? current.phone,
        live_share_enabled: patch.liveShareEnabled ?? current.live_share_enabled,
        is_active_sos: patch.isActiveSos ?? current.is_active_sos,
        sort_order: patch.sortOrder ?? current.sort_order,
        deleted_at: patch.restore ? null : current.deleted_at,
      }
      rows.set(id, next)
      return next
    },
    clearActiveSos: async () => {
      for (const row of rows.values()) {
        if (row.deleted_at === null) {
          rows.set(row.id, { ...row, is_active_sos: false })
        }
      }
    },
    setActiveSos: async (_scope, id) => {
      for (const row of rows.values()) {
        if (row.deleted_at === null) {
          rows.set(row.id, { ...row, is_active_sos: row.id === id })
        }
      }
      const row = rows.get(id)
      if (!row) throw new Error('not found')
      return { ...row, is_active_sos: true }
    },
    softDelete: async (_scope, id) => {
      const current = rows.get(id)
      if (!current) throw new Error('not found')
      const next = {
        ...current,
        deleted_at: '2026-07-08T12:00:00.000Z',
        is_active_sos: false,
      }
      rows.set(id, next)
      return next
    },
  }
}

describe('getRunWalkContatosConfianca', () => {
  it('retorna lista vazia', async () => {
    const result = await getRunWalkContatosConfianca(scope, createDeps())
    assert.deepEqual(result.contacts, [])
    assert.equal(result.activeSosContactId, null)
  })

  it('garante contato ativo quando nenhum está marcado', async () => {
    const deps = createDeps([
      mockRow({ id: 'c1', is_active_sos: false }),
      mockRow({
        id: 'c2',
        client_contact_id: 'client-2',
        name: 'João',
        is_active_sos: false,
        sort_order: 1,
      }),
    ])

    const result = await getRunWalkContatosConfianca(scope, deps)
    assert.equal(result.activeSosContactId, 'c1')
    assert.equal(result.contacts[0].isActiveSos, true)
  })
})

describe('createRunWalkContatoConfianca', () => {
  it('cria primeiro contato já ativo para SOS', async () => {
    const deps = createDeps()
    const result = await createRunWalkContatoConfianca(
      scope,
      {
        clientContactId: 'client-new-1',
        name: 'Ana',
        phone: '(11) 98888-7777',
      },
      deps,
    )

    assert.equal(result.contacts.length, 1)
    assert.equal(result.activeSosContactId, result.contacts[0].id)
    assert.equal(result.contacts[0].phone, '(11) 98888-7777')
  })

  it('bloqueia criação acima do limite', async () => {
    const initial = Array.from({ length: 5 }, (_, index) =>
      mockRow({
        id: `c${index}`,
        client_contact_id: `client-${index}`,
        name: `Contato ${index}`,
        sort_order: index,
        is_active_sos: index === 0,
      }),
    )

    await assert.rejects(
      () =>
        createRunWalkContatoConfianca(
          scope,
          {
            clientContactId: 'client-overflow',
            name: 'Overflow',
            phone: '11999997777',
          },
          createDeps(initial),
        ),
      (error: unknown) =>
        error instanceof VdRunWalkError && error.code === 'CONFLICT' && error.statusCode === 409,
    )
  })

  it('atualiza contato existente por clientContactId', async () => {
    const deps = createDeps([mockRow()])
    const result = await createRunWalkContatoConfianca(
      scope,
      {
        clientContactId: 'client-contact-1',
        name: 'Maria Atualizada',
        phone: '(11) 97777-6666',
      },
      deps,
    )

    assert.equal(result.contacts.length, 1)
    assert.equal(result.contacts[0].name, 'Maria Atualizada')
    assert.equal(result.contacts[0].phone, '(11) 97777-6666')
  })
})

describe('updateRunWalkContatoConfianca', () => {
  it('atualiza campos e define SOS ativo', async () => {
    const deps = createDeps([
      mockRow({ id: 'c1', is_active_sos: true }),
      mockRow({
        id: 'c2',
        client_contact_id: 'client-2',
        name: 'João',
        is_active_sos: false,
        sort_order: 1,
      }),
    ])

    const result = await updateRunWalkContatoConfianca(
      scope,
      'c2',
      { isActiveSos: true, liveShareEnabled: false },
      deps,
    )

    const joao = result.contacts.find((contact) => contact.id === 'c2')
    assert.equal(result.activeSosContactId, 'c2')
    assert.equal(joao?.liveShareEnabled, false)
    assert.equal(result.contacts.find((contact) => contact.id === 'c1')?.isActiveSos, false)
  })

  it('retorna 404 para contato inexistente', async () => {
    await assert.rejects(
      () =>
        updateRunWalkContatoConfianca(
          scope,
          'missing',
          { name: 'Teste' },
          createDeps(),
        ),
      (error: unknown) =>
        error instanceof VdRunWalkError && error.code === 'NOT_FOUND',
    )
  })
})

describe('deleteRunWalkContatoConfianca', () => {
  it('remove contato e promove outro para SOS', async () => {
    const deps = createDeps([
      mockRow({ id: 'c1', is_active_sos: true }),
      mockRow({
        id: 'c2',
        client_contact_id: 'client-2',
        name: 'João',
        is_active_sos: false,
        sort_order: 1,
      }),
    ])

    const result = await deleteRunWalkContatoConfianca(scope, 'c1', deps)

    assert.equal(result.contacts.length, 1)
    assert.equal(result.activeSosContactId, 'c2')
  })
})

describe('activateRunWalkContatoConfiancaSos', () => {
  it('ativa contato para SOS', async () => {
    const deps = createDeps([
      mockRow({ id: 'c1', is_active_sos: true }),
      mockRow({
        id: 'c2',
        client_contact_id: 'client-2',
        name: 'João',
        is_active_sos: false,
        sort_order: 1,
      }),
    ])

    const contact = await activateRunWalkContatoConfiancaSos(scope, 'c2', deps)
    assert.equal(contact.id, 'c2')
    assert.equal(contact.isActiveSos, true)
  })
})
