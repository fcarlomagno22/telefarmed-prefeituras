-- Seed demo: financeiro admin (receber, pagar, repasse Nobuaki Gozi, balanço)
-- Idempotente via IDs fixos onde possível.

-- ── Fechamentos (Contas a receber = status fechado) ─────────────────────────
UPDATE fechamentos_competencia SET
  consumo_percentual = 78.5,
  excedeu_limite = false,
  valor_base_centavos = 18500000,
  valor_excedente_centavos = 0,
  ajustes_centavos = -150000,
  valor_final_centavos = 18350000,
  status = 'fechado',
  vencimento = '2026-04-10',
  status_vencimento = 'paga',
  fechado_em = '2026-04-08T14:00:00Z'
WHERE id = '246126af-0e2d-490a-a06e-b46a430c43e2';

UPDATE fechamentos_competencia SET
  consumo_percentual = 92.3,
  excedeu_limite = false,
  valor_base_centavos = 18500000,
  valor_excedente_centavos = 420000,
  ajustes_centavos = 0,
  valor_final_centavos = 18920000,
  status = 'fechado',
  vencimento = '2026-05-10',
  status_vencimento = 'a_vencer',
  fechado_em = '2026-05-09T11:30:00Z'
WHERE id = '18176dda-98d0-4768-9976-dcfa4e0b0c57';

UPDATE fechamentos_competencia SET
  consumo_percentual = 64.0,
  excedeu_limite = false,
  valor_base_centavos = 18500000,
  valor_excedente_centavos = 0,
  ajustes_centavos = 0,
  valor_final_centavos = 18500000,
  status = 'pre_fechado',
  vencimento = '2026-06-10',
  status_vencimento = 'a_vencer'
WHERE id = 'ff9248b3-f4d5-4492-ac67-f38c4624310b';

INSERT INTO notas_fiscais_fechamento (fechamento_id, numero, status, emitida_em, storage_path, mime_type, tamanho_bytes)
VALUES (
  '246126af-0e2d-490a-a06e-b46a430c43e2',
  'NF-SP-202604-001',
  'issued',
  '2026-04-09T10:00:00Z',
  '246126af-0e2d-4492-ac67-f38c4624310b/demo.pdf',
  'application/pdf',
  1024
)
ON CONFLICT (fechamento_id) DO UPDATE SET
  numero = EXCLUDED.numero,
  status = EXCLUDED.status,
  emitida_em = EXCLUDED.emitida_em;

-- ── Fornecedores ────────────────────────────────────────────────────────────
INSERT INTO financeiro_fornecedores (id, cnpj, razao_social, situacao, contato_email, contato_telefone, pessoa_contato, observacoes)
VALUES
  (
    'a1000001-0000-4000-8000-000000000001',
    '12345678000190',
    'Cloud Health Tecnologia Ltda',
    'ativa',
    'financeiro@cloudhealth.com.br',
    '(11) 3245-8899',
    'Fernanda Ribeiro',
    'Infraestrutura cloud e integrações.'
  ),
  (
    'a1000001-0000-4000-8000-000000000002',
    '98765432000110',
    'MediPlantões Serviços Médicos S/A',
    'ativa',
    'contas@mediplantoes.com.br',
    '(61) 98455-1032',
    'Carlos Nascimento',
    'Fornecimento de plantões médicos.'
  ),
  (
    'a1000001-0000-4000-8000-000000000003',
    '29682996000144',
    'AGROVITA - ASSOCIACAO DE APOIO E COMERCIO AGRICOLA',
    'ativa',
    'nobu@nobu.com',
    '(11) 99999-0000',
    'Nobuaki Gozi',
    'PJ do Dr. Nobuaki Gozi — repasse profissional.'
  )
ON CONFLICT (id) DO UPDATE SET
  razao_social = EXCLUDED.razao_social,
  situacao = EXCLUDED.situacao,
  observacoes = EXCLUDED.observacoes;

-- ── Contas a pagar ──────────────────────────────────────────────────────────
DELETE FROM financeiro_contas_pagar WHERE id IN (
  'b2000001-0000-4000-8000-000000000001',
  'b2000001-0000-4000-8000-000000000002',
  'b2000001-0000-4000-8000-000000000003',
  'b2000001-0000-4000-8000-000000000004',
  'b2000001-0000-4000-8000-000000000005'
);

INSERT INTO financeiro_contas_pagar (
  id, fornecedor_id, descricao, centro_custo_id, recorrencia, valor_centavos, vencimento, status, origem
) VALUES
  (
    'b2000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    'Infraestrutura cloud e streaming',
    'aab8ddd4-ef17-492b-a042-03c7807c5f37',
    'mensal',
    9400000,
    '2026-06-05',
    'pendente',
    'manual'
  ),
  (
    'b2000001-0000-4000-8000-000000000002',
    'a1000001-0000-4000-8000-000000000002',
    'Repasse plantões médicos — abril',
    '6deba6e8-318f-423e-93d8-d04d1ad48fba',
    'mensal',
    21200000,
    '2026-06-10',
    'pendente',
    'manual'
  ),
  (
    'b2000001-0000-4000-8000-000000000003',
    'a1000001-0000-4000-8000-000000000001',
    'Licenças de observabilidade',
    'ba49d076-4095-4778-856e-8feb9ab05e87',
    'mensal',
    1880000,
    '2026-05-20',
    'pago',
    'manual'
  ),
  (
    'b2000001-0000-4000-8000-000000000004',
    'a1000001-0000-4000-8000-000000000001',
    'Campanha onboarding municípios',
    'ef89751b-a902-4ddb-91d3-4bc45bab6ab1',
    'unica',
    3650000,
    '2026-05-25',
    'atrasado',
    'manual'
  ),
  (
    'b2000001-0000-4000-8000-000000000005',
    'a1000001-0000-4000-8000-000000000002',
    'Suporte operacional Q1',
    'ba49d076-4095-4778-856e-8feb9ab05e87',
    'unica',
    5200000,
    '2026-04-15',
    'pago',
    'manual'
  );

-- ── Ajuste balanço (centro operação) ────────────────────────────────────────
INSERT INTO financeiro_balanco_ajustes_centro (centro_custo_id, valor_ajuste_centavos)
VALUES ('ba49d076-4095-4778-856e-8feb9ab05e87', 250000)
ON CONFLICT (centro_custo_id) DO UPDATE SET valor_ajuste_centavos = EXCLUDED.valor_ajuste_centavos;

-- ── Plantões Nobuaki Gozi (repasse) ─────────────────────────────────────────
-- Slot maio (fixo)
INSERT INTO escala_slots (
  id, programacao_id, lote_id, data, hora_inicio, hora_fim, especialidade_id,
  modalidade, modo_atribuicao, vagas, valor_centavos, status, contrato_entidade_id,
  repasse_regra, unidade_nome, cidade, cidade_uf, publicado_em
) VALUES (
  'c3000001-0000-4000-8000-000000000001',
  'b5663ffa-5d21-4c96-821a-ba09af297f6c',
  'seed-financeiro-demo',
  '2026-05-10',
  '08:00',
  '14:00',
  'spec-1780354891941-1',
  'tele',
  'open',
  1,
  83500,
  'publicada',
  '57ea92c4-7555-4789-a643-fc76771611b9',
  '{"modalidade":"plantao_fixo","valorPlantaoCentavos":83500,"valorConsultaCentavos":8500,"criteriosPresenca":{"minPercentualOnline":80,"exigeEncerramentoFormal":true,"minConsultasConcluidas":1,"aceitaSemDemandaComprovada":true,"tratamentoInelegivel":"proporcional_consultas"}}'::jsonb,
  'Telemedicina',
  'São Paulo',
  'SP',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO escala_slots (
  id, programacao_id, lote_id, data, hora_inicio, hora_fim, especialidade_id,
  modalidade, modo_atribuicao, vagas, valor_centavos, status, contrato_entidade_id,
  repasse_regra, unidade_nome, cidade, cidade_uf, publicado_em
) VALUES (
  'c3000001-0000-4000-8000-000000000002',
  'b5663ffa-5d21-4c96-821a-ba09af297f6c',
  'seed-financeiro-demo',
  '2026-05-18',
  '08:00',
  '14:00',
  'spec-1780354891941-1',
  'tele',
  'open',
  1,
  83500,
  'publicada',
  '57ea92c4-7555-4789-a643-fc76771611b9',
  '{"modalidade":"hibrido","valorPlantaoCentavos":83500,"valorConsultaCentavos":7500,"percentualFixoHibrido":30,"criteriosPresenca":{"minPercentualOnline":80,"exigeEncerramentoFormal":true,"minConsultasConcluidas":2,"aceitaSemDemandaComprovada":false,"tratamentoInelegivel":"proporcional_consultas"}}'::jsonb,
  'Telemedicina',
  'São Paulo',
  'SP',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO escala_plantoes_confirmados (id, slot_id, profissional_id, status, confirmado_em)
VALUES
  ('d4000001-0000-4000-8000-000000000001', 'c3000001-0000-4000-8000-000000000001', '032ea05d-a847-494c-8381-3824a295dbc5', 'realizado', '2026-05-01T12:00:00Z'),
  ('d4000001-0000-4000-8000-000000000002', 'c3000001-0000-4000-8000-000000000002', '032ea05d-a847-494c-8381-3824a295dbc5', 'realizado', '2026-05-01T12:00:00Z')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

UPDATE escala_plantoes_confirmados SET status = 'realizado' WHERE id = 'a712db5a-7140-4016-95a0-920531a51d74';

INSERT INTO profissional_plantao_sessoes (id, plantao_id, profissional_id, slot_id, entered_at, ended_at, summary)
VALUES
  (
    'e5000001-0000-4000-8000-000000000001',
    'd4000001-0000-4000-8000-000000000001',
    '032ea05d-a847-494c-8381-3824a295dbc5',
    'c3000001-0000-4000-8000-000000000001',
    '2026-05-10T07:55:00Z',
    '2026-05-10T14:05:00Z',
    '{"consultasAgendadas":12,"encaixes":2,"atendidos":11,"naoCompareceu":1,"desistiu":0,"percentualOnline":91,"encerramentoFormal":true}'::jsonb
  ),
  (
    'e5000001-0000-4000-8000-000000000002',
    'd4000001-0000-4000-8000-000000000002',
    '032ea05d-a847-494c-8381-3824a295dbc5',
    'c3000001-0000-4000-8000-000000000002',
    '2026-05-18T07:58:00Z',
    '2026-05-18T14:02:00Z',
    '{"consultasAgendadas":8,"encaixes":1,"atendidos":7,"naoCompareceu":0,"desistiu":1,"percentualOnline":86,"encerramentoFormal":true}'::jsonb
  ),
  (
    'e5000001-0000-4000-8000-000000000003',
    'a712db5a-7140-4016-95a0-920531a51d74',
    '032ea05d-a847-494c-8381-3824a295dbc5',
    'ee5bdc11-30e9-44cd-9ed3-db87837de81f',
    '2026-06-15T07:55:00Z',
    '2026-06-15T14:05:00Z',
    '{"consultasAgendadas":6,"encaixes":0,"atendidos":5,"naoCompareceu":1,"desistiu":0,"percentualOnline":88,"encerramentoFormal":true}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET summary = EXCLUDED.summary, ended_at = EXCLUDED.ended_at;

-- ── Fechamento repasse profissional (Nobuaki) ───────────────────────────────
DELETE FROM profissional_fechamento_competencia
WHERE id IN (
  'f6000001-0000-4000-8000-000000000001',
  'f6000001-0000-4000-8000-000000000002'
);

INSERT INTO profissional_fechamento_competencia (
  id, profissional_id, repasse_id, competencia, status,
  invoice_file_name, invoice_storage_path, invoice_mime_type,
  pix_tipo, pix_chave, submitted_at,
  valor_calculado_centavos, valor_nf_centavos
) VALUES
  (
    'f6000001-0000-4000-8000-000000000001',
    '032ea05d-a847-494c-8381-3824a295dbc5',
    NULL,
    '2026-05',
    'em_analise',
    'NF-Nobuaki-Gozi-2026-05.pdf',
    '032ea05d-a847-494c-8381-3824a295dbc5/2026-05/demo-nf.pdf',
    'application/pdf',
    'cnpj',
    '29682996000144',
    '2026-06-02T09:15:00Z',
    175250,
    175000
  ),
  (
    'f6000001-0000-4000-8000-000000000002',
    '032ea05d-a847-494c-8381-3824a295dbc5',
    'fb01c164-5f4e-487a-90ca-ebc533a51a13',
    '2026-06',
    'em_analise',
    'NF-Nobuaki-Gozi-2026-06.pdf',
    '032ea05d-a847-494c-8381-3824a295dbc5/2026-06/demo-nf.pdf',
    'application/pdf',
    'cnpj',
    '29682996000144',
    '2026-06-10T16:40:00Z',
    83500,
    83500
  );

UPDATE profissional_repasse_competencia SET
  qtd_consultas = 5,
  valor_centavos = 83500,
  status = 'pendente'
WHERE id = 'fb01c164-5f4e-487a-90ca-ebc533a51a13';
