export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED:
        'São necessários comprovantes reais de aplicação concluída de carimbo.',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        'Estes comprovantes de carimbo pertencem a outros dados de contrato.',
      CONTRACT_ACCESS_DENIED:
        'Este contrato está fora do seu acesso concedido.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Esta ação está indisponível para o contrato.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'O valor do contrato não pode ser inferior à soma dos pagamentos pagos e reservados.',
      CONTRACT_ATTACHMENT_DENIED:
        'O campo de anexos ou o registro do contrato está fora do seu acesso concedido.',
      CONTRACT_ATTACHMENT_INVALID:
        'Escolha anexos válidos pertencentes a esta solicitação de contrato.',
      CONTRACT_CANDIDATE_REMOVED:
        'Este contrato candidato não publicado foi removido. Crie uma nova solicitação.',
      CONTRACT_CATEGORY_INACTIVE: 'Escolha um tipo de contrato ativo.',
      CONTRACT_CORRUPT_BALANCE:
        'Os totais de pagamento do contrato são inconsistentes. Entre em contato com um administrador.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'É necessário um colaborador ativo com departamento principal.',
      CONTRACT_FIELDS_RESTRICTED:
        'Os campos obrigatórios do contrato estão fora do seu acesso concedido.',
      CONTRACT_FILE_SIZE:
        'Escolha um arquivo de contrato não vazio de até 5 MiB.',
      CONTRACT_FILE_TYPE:
        'O texto do contrato deve ser PDF; os comprovantes podem ser PDF, JPEG, PNG ou WebP, com conteúdo correspondente.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Esta chave de requisição já foi usada com outros detalhes. Atualize antes de enviar novamente.',
      CONTRACT_INACTIVE_SOURCE:
        'Escolha uma origem de contrato aprovado vigente.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Preencha o motivo do contrato, as condições de pagamento e a versão imutável do texto.',
      CONTRACT_INPUT_INVALID:
        'Verifique os campos de entrada declarados do contrato.',
      CONTRACT_INVALID_AMOUNT:
        'Informe um valor não negativo em centavos inteiros exatos dentro do intervalo suportado.',
      CONTRACT_INVALID_ID:
        'É necessária uma identidade válida de tamanho limitado.',
      CONTRACT_INVALID_TIME: 'A marca de tempo do contrato é inválida.',
      CONTRACT_LIMIT_EXCEEDED:
        'Os valores pendentes e pagos excedem o limite do contrato.',
      CONTRACT_NOT_CANDIDATE:
        'Somente o contrato candidato não publicado desta solicitação pode ser removido.',
      CONTRACT_NOT_FOUND: 'A origem do contrato não foi encontrada.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Libere os pagamentos pendentes antes de rescindir o contrato.',
      CONTRACT_REASON_REQUIRED:
        'Informe um motivo dentro do tamanho suportado.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Somente o solicitante pode atualizar explicitamente a versão base de uma alteração devolvida.',
      CONTRACT_REQUEST_KEY_REQUIRED:
        'É necessária uma chave de requisição estável.',
      CONTRACT_RESERVATION_CLOSED: 'A reserva de pagamento já foi encerrada.',
      CONTRACT_RULE_INVALID:
        'A política de aprovação de contratos não existe ou é inválida. Entre em contato com um administrador.',
      CONTRACT_SLA_UNSUPPORTED:
        'O adaptador de aprovação instalado suporta somente o relógio configurado de 24/48 horas.',
      CONTRACT_SOURCE_CONFLICT:
        'Esta referência pertence a outra origem de contrato.',
      CONTRACT_STORED_ID_INVALID:
        'Uma identidade de contrato armazenada é inválida. Entre em contato com um administrador.',
      CONTRACT_SUPPLIER_INVALID:
        'O fornecedor deve estar ativo e ter qualificação aprovada. Atualize sua qualificação antes da aprovação.',
      CONTRACT_TARGET_MISMATCH:
        'O destino de aprovação pertence a outra solicitação de contrato.',
      CONTRACT_TEXT_INVALID:
        'Escolha uma versão imutável do texto PDF pertencente a esta solicitação.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Versões do texto do contrato só podem ser adicionadas a um rascunho próprio ou a uma revisão devolvida.',
      CONTRACT_TEXT_REQUIRED:
        'Selecione uma versão imutável válida do texto do contrato.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Use a operação protegida específica de contratos.',
      CONTRACT_VERSION_CONFLICT:
        'O contrato aprovado mudou. Devolva a solicitação, atualize explicitamente sua versão base e envie para revisão novamente.',
    },
    authz: {
      resource: 'Contratos e alterações',
      view: 'Visualizar solicitações de contrato',
      submit: 'Criar e editar próprias solicitações de contrato',
      ledger: 'Ler cadastro de contratos aprovados e versões imutáveis',
      historicalEntry:
        'Registrar um contrato histórico com registro jurídico auditado',
    },
  },
};
