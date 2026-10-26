export default {
  reportsExpense: {
    firstPage: 'Ir para a primeira página',

    pageEmpty: 'Nenhum grupo de despesas nesta página',
    pageEmptyHint:
      'A origem atual tem menos grupos. Vá para a primeira página ou use Anterior para voltar a uma página disponível.',

    exportStarted: 'Download do Excel iniciado',
    reloading:
      'Atualizando… O resultado anterior permanece visível até que os filtros atuais terminem de carregar.',
    exportLock:
      'Exportando… Os filtros e a navegação ficam bloqueados até a conclusão do download.',

    title: 'Despesas liquidadas por mês',
    description:
      'Despesas brutas liquidadas por data original da despesa e categoria; este não é o dinheiro líquido pago.',
    month: 'Mês da despesa (1–12, opcional)',
    effectiveYear: 'Ano do calendário da empresa: {{year}}',
    sourceNotice:
      'Até 10.000 solicitações liquidadas autorizadas podem ser verificadas. Alterar ano ou mês não reduz esta varredura da origem.',
    precondition:
      'Não foi possível verificar os comprovantes de liquidação ou um limite do relatório foi excedido. Peça a um administrador que verifique os comprovantes de origem e o tamanho do relatório.',
    forbidden:
      'Você não tem acesso à origem atual de reembolsos. Peça a um administrador que verifique as permissões da origem.',
    empty: 'Nenhuma despesa liquidada neste ano ainda',
    emptyHint:
      'Somente solicitações autorizadas com comprovantes de liquidação verificados são incluídas. Verifique o ano e o mês ou peça a um administrador que verifique o acesso à origem.',
    fields: {
      year: 'Ano',
      month: 'Mês da despesa',
      category: 'Código da categoria',
      settledRequestCount: 'Solicitações liquidadas',
      settledExpenseCents: 'Despesa bruta liquidada (CNY, não dinheiro)',
    },
  },
};
