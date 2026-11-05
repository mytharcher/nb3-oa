import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { FileUploadInput } from '../../../client/components/file-upload-input.js';
import { Button } from '../../../client/components/ui/button.js';
import {
  Field,
  FieldLabel,
  FieldDescription,
} from '../../../client/components/ui/field.js';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';
import '../../../client/styles.css';
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
});
export function Fixture() {
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <main className='mx-auto flex max-w-2xl flex-col gap-6 p-4'>
      <h1 className='text-xl font-semibold'>Upload verification · 上传验证</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          document.body.dataset.submitted = 'true';
        }}
      >
        <Field>
          <FieldLabel htmlFor='proof'>
            {locale === 'zh-CN' ? '附件' : 'Attachments'}
          </FieldLabel>
          <FileUploadInput
            id='proof'
            ref={ref}
            selectedFile={file}
            disabled={disabled}
            required
            accept='.pdf,.txt'
            aria-describedby='hint'
            onFileChange={(file) => {
              setFile(file);
              setCount((count) => count + 1);
            }}
          />
          <FieldDescription id='hint'>
            {locale === 'zh-CN'
              ? 'PDF 或文本文件；每次选择一个文件。'
              : 'PDF or text; choose one file at a time.'}
          </FieldDescription>
        </Field>
        <div className='mt-4 flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setDisabled(!disabled)}
          >
            Toggle disabled
          </Button>
          <Button type='button' variant='outline' onClick={() => setFile(null)}>
            Reset
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => ref.current?.focus()}
          >
            Focus file
          </Button>
          <Button type='submit'>Submit</Button>
        </div>
      </form>
      <output data-testid='selection-count'>{count}</output>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <Fixture />
  </TestI18nProvider>,
);
