import type { AdminDoctor } from '../../../types/adminMedicos'

export function formatAdminDoctorContractingEntity(doctor: AdminDoctor) {
  if (doctor.allocation === 'nacional') {
    return {
      title: 'Entidade contratante',
      primary: 'Plataforma nacional',
      secondary: 'Profissional disponível para todas as entidades com contrato ativo',
    }
  }

  if (!doctor.contractingEntity) {
    return {
      title: 'Entidade contratante',
      primary: 'Não informada',
      secondary: 'Vínculo por contrato sem entidade vinculada no cadastro',
    }
  }

  return {
    title: 'Entidade contratante',
    primary: doctor.contractingEntity.razaoSocial,
    secondary: `${doctor.contractingEntity.municipality}/${doctor.contractingEntity.uf}`,
  }
}
