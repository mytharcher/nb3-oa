export default {
  invoiceRecognition: {
    currentValues: 'Valores atuais não salvos',
    reload: 'Atualizar resultado salvo',
    receivedAt: 'Resultado recebido: {{time}}',
    notConfigured:
      'O gateway de notas fiscais não está conectado. Você pode continuar informando os detalhes manualmente.',
    title: 'Reconhecimento e verificação de notas fiscais',
    readPermission: 'Ler resultados de notas fiscais',
    recognizePermission: 'Reconhecer anexos de notas fiscais editáveis',
    verifyPermission: 'Verificar linhas autorizadas de notas fiscais',
    recognizeAttachment: 'Reconhecer anexo {{index}}',
    verifyAttachment: 'Verificar nota fiscal · anexo {{index}}',
    processing: 'Processando a nota fiscal…',
    failed:
      'Não foi possível concluir esta operação. Verifique seu acesso e a configuração do gateway e tente novamente. Seus valores informados permanecem inalterados.',
    changed:
      'Esta linha mudou. Execute a operação novamente antes de aplicar ou confiar neste resultado.',
    unconfirmed: 'O resultado não foi confirmado.',
    recover: 'Verificar resultado externo',
    reference: 'Referência de verificação: {{reference}}',
    confirmTitle: 'Revisar nota fiscal reconhecida',
    confirmDescription:
      'Compare estas sugestões com o anexo original. Aplicá-las altera somente esta linha não salva; não salva, envia nem verifica a nota fiscal.',
    number: 'Número da nota fiscal',
    date: 'Data da nota fiscal',
    amount: 'Total com impostos',
    cancel: 'Cancelar',
    apply: 'Aplicar a esta linha',
    states: {
      not_checked: 'Não verificado',
      pending: 'Aguardando processamento',
      running: 'Processando',
      recognized: 'Reconhecido; revise antes de aplicar',
      multiple:
        'Várias notas fiscais encontradas. Divida o anexo ou informe esta linha manualmente.',
      unreadable:
        'Não foi possível reconhecer esta nota fiscal. Informe seus detalhes manualmente.',
      rejected: 'O serviço externo não conseguiu processar esta nota fiscal.',
      valid:
        'A verificação externa corresponde aos dados atuais da nota fiscal.',
      mismatch:
        'Os dados da nota fiscal não correspondem à verificação externa.',
      not_found:
        'Nenhuma nota fiscal correspondente encontrada. Peça ao financeiro que revise.',
      unknown:
        'Resultado não confirmado. Consulte o resultado externo antes de tentar novamente.',
    },
  },
};
