import { demoCollections } from './collections.js';
const aliases: Record<string, string> = {
  '/knowledge': 'knowledgeDocuments',
  '/templatePrint/templates': 'printTemplates',
  '/announcements': 'announcements',
  '/workItems': 'workItems',
};
export function ownershipForScenario(path: string): string | undefined {
  const name = aliases[path] ?? path.slice(1);
  return (demoCollections as readonly string[]).includes(name)
    ? name
    : undefined;
}
