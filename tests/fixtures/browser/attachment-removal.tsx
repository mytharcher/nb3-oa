import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { resolveLocalesContribution } from '@nocobase/i18n';
import filePlugin from '@nocobase/app-plugin-file/client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { BusinessAttachmentList } from '../../../client/components/business-attachment-list.js';
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
  const [files, setFiles] = useState([
    { id: 'pdf', filename: 'Proof.pdf', ext: 'pdf', contentUrl: '/proof.pdf' },
    {
      id: 'image',
      filename: 'Photo.png',
      mimeType: 'image/png',
      ext: 'png',
      contentUrl: '/photo.png',
    },
  ]);
  return (
    <main className='p-8'>
      <BusinessAttachmentList
        files={files}
        onRemove={(id) => setFiles(files.filter((file) => file.id !== id))}
      />
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <Fixture />
  </TestI18nProvider>,
);
