-- Tipos de anexo para documentos clínicos além dos originais (médico e multiprofissional).

ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'relatorio';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'laudo';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'avaliacao_presencial';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'internacao';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'atestado_psicologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'relatorio_psicologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'relatorio_multiprofissional';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'laudo_psicologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'parecer_psicologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'encaminhamento_psicologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'prescricao_dietetica';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'prescricao_suplementos';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'pedido_exame_nutricional';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'relatorio_nutricional';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'parecer_nutricional';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'laudo_nutricional';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'declaracao_comparecimento_nutricional';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'declaracao_comparecimento_fonoaudiologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'relatorio_fonoaudiologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'laudo_fonoaudiologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'parecer_fonoaudiologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'atestado_fonoaudiologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'plano_terapeutico_fonoaudiologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'resultado_avaliacao_fonoaudiologico';
ALTER TYPE consulta_anexo_tipo ADD VALUE IF NOT EXISTS 'encaminhamento_fonoaudiologico';
