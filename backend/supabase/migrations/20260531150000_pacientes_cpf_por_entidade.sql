-- CPF único por entidade contratante (Etapa 1.4)

ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_cpf_unico;

ALTER TABLE pacientes
  ADD CONSTRAINT pacientes_cpf_entidade_unico UNIQUE (entidade_contratante_id, cpf);
