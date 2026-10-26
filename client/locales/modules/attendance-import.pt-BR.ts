export default {
  attendanceImport: {
    title: 'Importar comprovantes de ponto',
    description:
      'Visualize e importe comprovantes brutos imutáveis. Isto não avalia a frequência nem calcula a folha de pagamento.',
    template: 'Baixar modelo Excel',
    downloadStarted: 'Download do modelo Excel iniciado.',
    downloadFailed: 'Não foi possível baixar o modelo Excel. Tente novamente.',
    file: 'Arquivo Excel de comprovantes',
    empty: 'Escolha um arquivo .xlsx para iniciar a prévia.',
    help: 'Use o modelo com uma única planilha e células de texto. Colunas obrigatórias: userId, date, punchKind, source, sourceKey e sourceData (objeto JSON). punchedAt pode ficar vazio ou conter texto ISO UTC, como 2035-01-02T01:00:00Z. date é a data local da empresa. userId é o ID estável de um colaborador real, nunca um nome. Máximo de 4 MiB e 1.000 linhas. Fórmulas e datas numéricas são rejeitadas. As chaves dos objetos JSON devem ser únicas; números devem preservar seu valor decimal ao serem serializados e inteiros devem ser seguros. Represente IDs maiores ou decimais exatos como strings.',
    parsing: 'Analisando Excel',
    preview: 'Prévia: {{count}} linhas',
    confirm:
      'Revisei estes comprovantes e confirmo a importação do lote inteiro',
    submit: 'Confirmar importação do lote',
    submitting: 'Importando',
    success: '{{count}} linhas de comprovantes importadas.',
    evidence: 'Expandir comprovante original',
    denied: 'Você não tem permissão para importar comprovantes de ponto.',
    failed:
      'Não foi possível importar o lote. Revise o arquivo e tente novamente.',
    invalid:
      'O servidor rejeitou estes comprovantes. Verifique IDs de colaboradores, datas da empresa e dados de origem.',
    conflict:
      'Uma chave de origem já contém comprovantes diferentes. Nenhuma linha deste lote foi importada.',
    retry: 'Tentar importar novamente',
    discard: 'Descartar a prévia de comprovantes não enviada?',
    continue: 'Continuar revisão',
    discardConfirm: 'Descartar prévia',
    discardHelp:
      'Após descartar a prévia, clique novamente no destino para continuar a navegação.',
    columns: {
      userId: 'ID do usuário',
      date: 'Data da empresa',
      punchKind: 'Tipo de ponto',
      punchedAt: 'Instante UTC',
      source: 'Origem',
      sourceKey: 'Chave de origem',
      sourceData: 'Comprovante original',
    },
    errors: {
      file: 'Escolha um arquivo .xlsx de no máximo 4 MiB.',
      archive:
        'O arquivo Excel é inválido ou excede os limites seguros de extração.',
      template:
        'Use exatamente os cabeçalhos do modelo baixado e uma única planilha.',
      cell: 'Linha {{row}}: use células de texto sem fórmulas e somente as sete colunas do modelo.',
      rows: 'Use de 1 a 1.000 linhas consecutivas de comprovantes após o cabeçalho.',
      identity:
        'Linha {{row}}: forneça um ID de usuário estável e origem e chave de origem válidas.',
      date: 'Linha {{row}}: forneça uma data real da empresa, tipo in/out e um instante ISO UTC explícito ou vazio.',
      evidence:
        'Linha {{row}}: forneça um objeto JSON de tamanho limitado com chaves únicas, números com serialização reversível segura e uma chave de origem única.',
    },
  },
};
