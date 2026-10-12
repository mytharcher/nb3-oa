import { defineSeed } from '@nocobase/db';
export default defineSeed({
  name: '202610104201_knowledge_tree_lock',
  async run(context) {
    const r = context.repository('knowledgeTreeLock');
    if (!(await r.exists({ filter: { id: 'tree' } })))
      await r.createOne({ values: { id: 'tree', version: 1 } });
  },
});
