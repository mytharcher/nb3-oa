import {
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type Ref,
} from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { UploadIcon } from 'lucide-react';
import { AttachmentPanel } from './attachment-list.js';
import { Alert, AlertDescription } from './ui/alert.js';
import { Button } from './ui/button.js';

type FileUploadInputProps = Omit<
  ComponentProps<'input'>,
  'type' | 'onChange' | 'multiple' | 'value' | 'defaultValue' | 'children'
> & {
  readonly onFileChange: (file: File) => void;
  readonly selectedFile?: File | null;
  readonly chooseLabel?: string;
  readonly emptyLabel?: string;
  readonly buttonRef?: Ref<HTMLButtonElement>;
};

/** The UI Library panel supplies presentation and drop/paste. Business callers
 * retain upload timing, draft ownership, validation and uncertain-write recovery. */
export function FileUploadInput({
  ref,
  buttonRef,
  onFileChange,
  selectedFile,
  chooseLabel,
  emptyLabel,
  disabled = false,
  required,
  onFocus,
  className,
  ...inputProps
}: FileUploadInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => inputRef.current!, []);
  useImperativeHandle(buttonRef, () => triggerRef.current!, []);
  const errorId = useId();
  const filenameId = useId();
  const [multipleError, setMultipleError] = useState(false);
  const choose = chooseLabel ?? t('attachmentList.chooseFile');
  const title = t('attachmentList.files');
  const describedBy =
    [
      inputProps['aria-describedby'],
      selectedFile || emptyLabel ? filenameId : '',
      multipleError ? errorId : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  function select(files: readonly File[]) {
    if (disabled || !files.length) return;
    setMultipleError(files.length > 1);
    if (files.length !== 1) return;
    onFileChange(files[0]);
  }
  return (
    <div
      className='flex min-w-0 flex-col gap-2'
      data-slot='file-upload-input'
      onDragOverCapture={(event) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault();
      }}
      onDropCapture={(event) => {
        if (disabled && event.dataTransfer.files.length) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onPasteCapture={(event) => {
        if (disabled && event.clipboardData.files.length) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <AttachmentPanel
        files={[]}
        labels={{ title, upload: choose }}
        className={className}
        onUpload={disabled ? undefined : select}
        uploadControl={
          <>
            <Button
              ref={triggerRef}
              type='button'
              variant='outline'
              size='sm'
              disabled={disabled}
              aria-invalid={multipleError || inputProps['aria-invalid']}
              aria-describedby={describedBy}
              aria-required={required || inputProps['aria-required']}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon data-icon='inline-start' />
              {choose}
            </Button>
            <input
              {...inputProps}
              ref={inputRef}
              type='file'
              className='sr-only'
              tabIndex={-1}
              multiple={false}
              disabled={disabled}
              aria-label={
                inputProps['aria-label'] ?? (inputProps.id ? undefined : choose)
              }
              aria-required={required || inputProps['aria-required']}
              aria-invalid={multipleError || inputProps['aria-invalid']}
              aria-describedby={describedBy}
              onFocus={(event) => {
                onFocus?.(event);
                triggerRef.current?.focus();
              }}
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                // Reset before calling business code, allowing a same-file retry.
                event.currentTarget.value = '';
                select(files);
              }}
            />
          </>
        }
      />
      {selectedFile || emptyLabel ? (
        <p id={filenameId} className='break-all text-sm text-muted-foreground'>
          {selectedFile?.name ?? emptyLabel}
        </p>
      ) : null}
      {multipleError ? (
        <Alert id={errorId} variant='destructive'>
          <AlertDescription>{t('attachmentList.singleFile')}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
