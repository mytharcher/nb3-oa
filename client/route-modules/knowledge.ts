import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { BookOpen } from 'lucide-react';
const policy = (action: 'view' | 'manage', folder = false) => ({
  resource: {
    type: 'composite' as const,
    id: folder ? 'oa.knowledgeFolders' : 'oa.knowledgeDocuments',
  },
  action,
});
export default defineAppRoutes([
  {
    name: 'oa-knowledge',
    parent: 'oa-office',
    path: '/knowledge',
    auth: 'required',
    authz: policy('view'),
    navigation: { title: 'knowledge.title', icon: BookOpen, order: 40 },
    componentLoader: () => import('../pages/knowledge/index.js'),
    children: [
      {
        name: 'oa-knowledge-new',
        path: 'new',
        authz: policy('manage'),
        componentLoader: () => import('../pages/knowledge/form.js'),
      },
      {
        name: 'oa-knowledge-folders',
        path: 'folders',
        authz: policy('view', true),
        componentLoader: () => import('../pages/knowledge/folders.js'),
        children: [
          {
            name: 'oa-knowledge-folder-new',
            path: 'new',
            authz: policy('manage', true),
            componentLoader: () => import('../pages/knowledge/folder-form.js'),
          },
          {
            name: 'oa-knowledge-folder-edit',
            path: ':folderId/edit',
            authz: policy('manage', true),
            componentLoader: () => import('../pages/knowledge/folder-form.js'),
          },
        ],
      },
      {
        name: 'oa-knowledge-detail',
        path: ':documentId',
        authz: policy('view'),
        componentLoader: () => import('../pages/knowledge/detail.js'),
        children: [
          {
            name: 'oa-knowledge-edit',
            path: 'edit',
            authz: policy('manage'),
            componentLoader: () => import('../pages/knowledge/form.js'),
          },
          {
            name: 'oa-knowledge-preview',
            path: 'versions/:versionId/preview',
            authz: policy('view'),
            componentLoader: () => import('../pages/knowledge/preview.js'),
          },
        ],
      },
    ],
  },
]);
