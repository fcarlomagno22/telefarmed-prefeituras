import { verifyAdminAuthorizationPin } from '../admin-auth/service.js'
import { consultarCnpjEmpresa } from '../profissional-cadastro/cnpj.service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCnpj } from '../../lib/cnpj.js'
import { formatFornecedor } from './formatters.js'
import { FinanceiroError } from './errors.js'
import type { CnpjLookupDto, FornecedorDto } from './types.js'

export async function listFornecedores(): Promise<FornecedorDto[]> {
  const { data, error } = await supabaseAdmin
    .from('financeiro_fornecedores')
    .select('*')
    .order('razao_social')

  if (error) throw error
  return (data ?? []).map(formatFornecedor)
}

export async function createFornecedor(
  payload: Omit<FornecedorDto, 'id'>,
): Promise<FornecedorDto> {
  const cnpj = normalizeCnpj(payload.cnpj)

  const { data, error } = await supabaseAdmin
    .from('financeiro_fornecedores')
    .insert({
      cnpj,
      razao_social: payload.razaoSocial.trim(),
      situacao: payload.situacao,
      contato_email: payload.contatoEmail,
      contato_telefone: payload.contatoTelefone,
      pessoa_contato: payload.pessoaContato,
      observacoes: payload.observacoes ?? '',
    })
    .select('*')
    .single()

  if (error) throw error
  if (!data) throw new FinanceiroError('Não foi possível criar fornecedor.', 'INVALID_DATA', 500)
  return formatFornecedor(data)
}

export async function updateFornecedor(payload: FornecedorDto): Promise<FornecedorDto> {
  const cnpj = normalizeCnpj(payload.cnpj)

  const { data, error } = await supabaseAdmin
    .from('financeiro_fornecedores')
    .update({
      cnpj,
      razao_social: payload.razaoSocial.trim(),
      situacao: payload.situacao,
      contato_email: payload.contatoEmail,
      contato_telefone: payload.contatoTelefone,
      pessoa_contato: payload.pessoaContato,
      observacoes: payload.observacoes ?? '',
    })
    .eq('id', payload.id)
    .select('*')
    .single()

  if (error) throw error
  if (!data) throw new FinanceiroError('Fornecedor não encontrado.', 'NOT_FOUND', 404)
  return formatFornecedor(data)
}

export async function deleteFornecedor(
  adminId: string,
  fornecedorId: string,
  pin: string,
): Promise<void> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { count, error: countError } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .select('id', { count: 'exact', head: true })
    .eq('fornecedor_id', fornecedorId)

  if (countError) throw countError
  if ((count ?? 0) > 0) {
    throw new FinanceiroError(
      'Não é possível excluir fornecedor com contas a pagar vinculadas.',
      'CONFLICT',
      409,
    )
  }

  const { error } = await supabaseAdmin
    .from('financeiro_fornecedores')
    .delete()
    .eq('id', fornecedorId)

  if (error) throw error
}

export async function lookupFornecedorCnpj(cnpjInput: string): Promise<CnpjLookupDto> {
  const digits = cnpjInput.replace(/\D/g, '')

  const { data: existing } = await supabaseAdmin
    .from('financeiro_fornecedores')
    .select('*')
    .eq('cnpj', digits)
    .maybeSingle()

  if (existing) {
    const f = formatFornecedor(existing)
    return {
      razaoSocial: f.razaoSocial,
      situacao: f.situacao,
      contatoEmail: f.contatoEmail,
      contatoTelefone: f.contatoTelefone,
      pessoaContato: f.pessoaContato,
    }
  }

  try {
    const empresa = await consultarCnpjEmpresa(cnpjInput)
    return {
      razaoSocial: empresa.razaoSocial,
      situacao: 'ativa',
    }
  } catch {
    return {}
  }
}

export async function findOrCreateFornecedorByCnpj(
  cnpjInput: string,
  razaoSocial: string,
): Promise<string> {
  const cnpj = normalizeCnpj(cnpjInput)

  const { data: existing } = await supabaseAdmin
    .from('financeiro_fornecedores')
    .select('id')
    .eq('cnpj', cnpj)
    .maybeSingle()

  if (existing?.id) return existing.id

  const created = await createFornecedor({
    cnpj,
    razaoSocial,
    situacao: 'ativa',
    contatoEmail: '',
    contatoTelefone: '',
    pessoaContato: '',
    observacoes: 'Gerado automaticamente via repasse profissional.',
  })

  return created.id
}
