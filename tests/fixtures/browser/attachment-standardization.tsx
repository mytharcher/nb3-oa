import { resolveLocalesContribution } from '@nocobase/i18n';
import { createRoot } from 'react-dom/client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import filePlugin from '@nocobase/app-plugin-file/client';
import { BusinessAttachmentList } from '../../../client/components/business-attachment-list.js';
import { Checkbox } from '../../../client/components/ui/checkbox.js';
import {
  RadioGroup,
  RadioGroupItem,
} from '../../../client/components/ui/radio-group.js';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';
import '../../../client/styles.css';

// Isolated presentation fixture: synthetic files, no session or business API.
const locale =
  new URLSearchParams(location.search).get('locale') === 'zh-CN'
    ? 'zh-CN'
    : 'en-US';
const runtime = await createTestI18nRuntime({
  locale,
  application: {
    namespace: 'nb3-oa',
    resources: locale === 'zh-CN' ? zhCN : enUS,
  },
  namespaces: {
    '@nocobase/app-plugin-file': await resolveLocalesContribution(
      filePlugin().locales!,
    ),
  },
});
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <main className='mx-auto flex max-w-2xl flex-col gap-6 p-4'>
      <h1 className='text-xl font-semibold'>Attachments · 附件</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          document.body.dataset.submitted = 'true';
        }}
      >
        <BusinessAttachmentList
          files={[
            {
              id: 'text',
              filename: '说明与说明附件-attachment-notes',
              ext: 'txt',
              mimeType: 'text/plain',
              size: 100,
              contentUrl: '/proof.txt',
            },
            {
              id: 'image',
              filename: 'receipt.png',
              ext: 'png',
              mimeType: 'image/png',
              size: 2048,
              contentUrl: '/proof.png',
            },
          ]}
        />
      </form>
      <label className='flex items-center gap-2'>
        <Checkbox defaultChecked />
        Enabled · 启用
      </label>
      <RadioGroup defaultValue='allow' aria-label='Permission'>
        <label className='flex items-center gap-2'>
          <RadioGroupItem value='deny' />
          Not granted · 未授权
        </label>
        <label className='flex items-center gap-2'>
          <RadioGroupItem value='allow' />
          Granted · 授权
        </label>
      </RadioGroup>
    </main>
  </TestI18nProvider>,
);
