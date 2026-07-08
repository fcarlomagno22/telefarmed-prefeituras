import { assertEntityContractActive } from '../../lib/entidadeContrato.js'
import {
  addressMatchesEntityTerritory,
  buildTerritoryMismatchMessage,
  normalizeUf,
} from '../../lib/municipalityTerritory.js'
import {
  shouldEnforceVdAppCadastroTerritory,
  VD_APP_TERRITORY_MISMATCH_SUBJECT,
} from '../../lib/patientTerritoryPolicy.js'
import {
  fetchAddressByCep,
  normalizeCepDigits,
  type ViaCepAddress,
} from '../../lib/viacep.js'
import { getEntityPatientTerritoryPolicy } from '../admin-pacientes/pacientes.service.js'
import type { VdCadastroEntidadeScope, VdCepElegibilidadeDto } from './types.js'

type ResolvedAddress = {
  city: string
  state: string
  viaCep?: ViaCepAddress
}

function resolveAddressFromInput(input: {
  cep: string
  cidade?: string
  uf?: string
}): Promise<ResolvedAddress | null> {
  return fetchAddressByCep(input.cep).then((viaCep) => {
    if (viaCep) {
      return {
        city: viaCep.city,
        state: viaCep.state,
        viaCep,
      }
    }

    const city = input.cidade?.trim()
    const state = input.uf?.trim()
    if (!city || !state) return null

    return { city, state }
  })
}

function buildEnderecoDto(viaCep: ViaCepAddress): VdCepElegibilidadeDto['endereco'] {
  return {
    cep: viaCep.cep,
    logradouro: viaCep.street,
    bairro: viaCep.neighborhood,
    cidade: viaCep.city,
    uf: normalizeUf(viaCep.state),
    complemento: viaCep.complement,
    ...(viaCep.ibgeMunicipalityCode
      ? { codigoIbgeMunicipio: viaCep.ibgeMunicipalityCode }
      : {}),
  }
}

export async function checkVdCadastroElegibilidadeCep(
  scope: VdCadastroEntidadeScope,
  input: { cep: string; cidade?: string; uf?: string },
): Promise<VdCepElegibilidadeDto> {
  await assertEntityContractActive(
    scope.entidadeId,
    'Esta entidade ainda não possui contrato ativo. O cadastro pelo app não está disponível.',
  )

  const cepDigits = normalizeCepDigits(input.cep)
  const resolvedAddress = await resolveAddressFromInput({
    cep: cepDigits,
    cidade: input.cidade,
    uf: input.uf,
  })

  if (!resolvedAddress) {
    return {
      elegivel: false,
      municipio: input.cidade?.trim() ?? '',
      uf: input.uf?.trim() ? normalizeUf(input.uf) : '',
      contratoAtivo: true,
      motivo: 'CEP não encontrado. Verifique os dígitos ou informe cidade e UF.',
    }
  }

  const policy = await getEntityPatientTerritoryPolicy(scope.entidadeId)
  const enforceTerritory = shouldEnforceVdAppCadastroTerritory(
    policy.contratoAceitaPacientesOutrosMunicipios,
  )

  const municipio = resolvedAddress.city
  const uf = normalizeUf(resolvedAddress.state)

  if (
    enforceTerritory &&
    !addressMatchesEntityTerritory(municipio, uf, policy.municipio, policy.uf)
  ) {
    return {
      elegivel: false,
      municipio,
      uf,
      contratoAtivo: true,
      motivo: buildTerritoryMismatchMessage(
        policy.municipio,
        policy.uf,
        municipio,
        uf,
        { subject: VD_APP_TERRITORY_MISMATCH_SUBJECT },
      ),
    }
  }

  return {
    elegivel: true,
    municipio,
    uf,
    contratoAtivo: true,
    ...(resolvedAddress.viaCep ? { endereco: buildEnderecoDto(resolvedAddress.viaCep) } : {}),
  }
}
