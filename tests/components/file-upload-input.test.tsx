import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { FileUploadInput } from '../../client/components/file-upload-input.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const chinese = await createTestI18nRuntime({
  locale: 'zh-CN',
  application: { namespace: 'nb3-oa', resources: zhCN },
});
const proof = new File(['proof'], 'proof.pdf', { type: 'application/pdf' });
function mount(
  props: Partial<React.ComponentProps<typeof FileUploadInput>> = {},
) {
  const onFileChange = vi.fn();
  const view = render(
    <TestI18nProvider runtime={runtime}>
      <label htmlFor='proof'>Evidence</label>
      <FileUploadInput id='proof' onFileChange={onFileChange} {...props} />
    </TestI18nProvider>,
  );
  return {
    ...view,
    onFileChange,
    input: screen.getByLabelText('Evidence') as HTMLInputElement,
    panel: view.container.querySelector('[data-slot=attachment-panel]')!,
  };
}

describe('standard business file input', () => {
  it('uses the library panel, opens a single-file picker and permits same-file retries', async () => {
    const { input, onFileChange, panel } = mount({ accept: '.pdf' });
    expect(panel).toBeInTheDocument();
    expect(input).not.toHaveAttribute('multiple');
    expect(input).toHaveClass('sr-only');
    const click = vi.spyOn(input, 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Choose file' }));
    expect(click).toHaveBeenCalledOnce();
    await userEvent.upload(input, proof);
    await userEvent.upload(input, proof);
    expect(onFileChange.mock.calls).toEqual([[proof], [proof]]);
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { files: [] } });
    fireEvent(input, new Event('cancel', { bubbles: true }));
    expect(onFileChange).toHaveBeenCalledTimes(2);
  });
  it('accepts drops and paste, rejects multiple files without silently losing data', () => {
    const { panel, onFileChange } = mount();
    fireEvent.drop(panel, {
      dataTransfer: { files: [proof], types: ['Files'] },
    });
    fireEvent.paste(panel, { clipboardData: { files: [proof] } });
    expect(onFileChange.mock.calls).toEqual([[proof], [proof]]);
    fireEvent.drop(panel, {
      dataTransfer: { files: [proof, proof], types: ['Files'] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      enUS.attachmentList.singleFile,
    );
    expect(onFileChange).toHaveBeenCalledTimes(2);
    fireEvent.paste(panel, { clipboardData: { files: [proof] } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onFileChange).toHaveBeenCalledTimes(3);
  });
  it('blocks picker, drop and paste when disabled, including synthetic input events', () => {
    const { panel, input, onFileChange } = mount({ disabled: true });
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeDisabled();
    expect(input).toBeDisabled();
    fireEvent.change(input, { target: { files: [proof] } });
    expect(
      fireEvent.drop(panel, {
        dataTransfer: { files: [proof], types: ['Files'] },
      }),
    ).toBe(false);
    expect(fireEvent.paste(panel, { clipboardData: { files: [proof] } })).toBe(
      false,
    );
    expect(onFileChange).not.toHaveBeenCalled();
  });
  it('forwards validation focus to the visible control and preserves field descriptions', () => {
    const ref = createRef<HTMLInputElement>();
    mount({
      ref,
      required: true,
      'aria-invalid': true,
      'aria-describedby': 'hint error',
    });
    ref.current?.focus();
    const button = screen.getByRole('button', { name: 'Choose file' });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(button).toHaveAttribute('aria-describedby', 'hint error');
    expect(button).toHaveAttribute('aria-required', 'true');
    // Native required would reject the deliberately reset hidden picker.
    expect(ref.current).not.toHaveAttribute('required');
  });
  it('preserves selected files on cancel and removes their display on a controlled reset', () => {
    const onFileChange = vi.fn();
    const view = render(
      <TestI18nProvider runtime={runtime}>
        <FileUploadInput selectedFile={proof} onFileChange={onFileChange} />
      </TestI18nProvider>,
    );
    fireEvent.change(view.container.querySelector('input')!, {
      target: { files: [] },
    });
    expect(screen.getByText(proof.name)).toBeInTheDocument();
    expect(onFileChange).not.toHaveBeenCalled();
    view.rerender(
      <TestI18nProvider runtime={runtime}>
        <FileUploadInput selectedFile={null} onFileChange={onFileChange} />
      </TestI18nProvider>,
    );
    expect(screen.queryByText(proof.name)).toBeNull();
  });
  it('never submits the enclosing form from the chooser', async () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <TestI18nProvider runtime={runtime}>
        <form onSubmit={submit}>
          <FileUploadInput onFileChange={vi.fn()} />
        </form>
      </TestI18nProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Choose file' }));
    expect(submit).not.toHaveBeenCalled();
  });
  it('localizes the chooser and multiple-file error in Chinese', () => {
    const view = render(
      <TestI18nProvider runtime={chinese}>
        <FileUploadInput onFileChange={vi.fn()} />
      </TestI18nProvider>,
    );
    expect(
      screen.getByRole('button', { name: '选择文件' }),
    ).toBeInTheDocument();
    fireEvent.paste(
      view.container.querySelector('[data-slot=attachment-panel]')!,
      { clipboardData: { files: [proof, proof] } },
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      zhCN.attachmentList.singleFile,
    );
  });
});
