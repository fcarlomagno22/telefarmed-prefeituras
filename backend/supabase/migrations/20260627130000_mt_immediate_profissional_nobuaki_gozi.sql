-- Executante padrão da teleconsulta imediata MT (Pediatria / Clínica Geral).

UPDATE usuarios_profissionais
SET
  nome = 'Nobuaki Gozi',
  conselho_sigla = 'CRM',
  conselho_numero = '12989',
  conselho_uf = 'SP',
  atualizado_em = now()
WHERE id = '032ea05d-a847-494c-8381-3824a295dbc5'
   OR (
     conselho_sigla = 'CRM'
     AND conselho_uf = 'SP'
     AND conselho_numero IN ('102030', '12989')
     AND nome ILIKE 'Nobuaki Gozi'
   );
