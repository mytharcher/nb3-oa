import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { resolveLocalesContribution } from '@nocobase/i18n';
import filePlugin from '@nocobase/app-plugin-file/client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { FilePreviewDialog } from '../../../client/extensions/nocobase-file-component-ui/index.js';
import enUS from '../../../client/locales/en-US.js';
import '../../../client/styles.css';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: {
    '@nocobase/app-plugin-file': await resolveLocalesContribution(
      filePlugin().locales!,
    ),
  },
});
export function Fixture() {
  const [open, setOpen] = useState(true);
  const files = [
    {
      id: 'first',
      filename: 'A-long-image-filename-for-checking-the-preview-header.png',
      ext: 'png',
      mimeType: 'image/png',
      contentUrl: '/assets/logo-mark.png',
      size: 1,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'second',
      filename: 'Second.png',
      ext: 'png',
      mimeType: 'image/png',
      contentUrl: '/assets/logo-mark.png',
      size: 1,
      createdAt: '',
      updatedAt: '',
    },
  ];
  return <FilePreviewDialog files={files} open={open} onOpenChange={setOpen} />;
}
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <Fixture />
  </TestI18nProvider>,
);
