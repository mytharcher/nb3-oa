import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';

import { RouteDialog } from '#components/route-dialog';
import { Alert, AlertDescription } from '#components/ui/alert';
import { useRouteOverlay } from '#components/use-route-overlay';

import {
  OverlayCloseButton,
  OverlayFormFooter,
} from '../shared/overlay-buttons.js';
import { FieldsSkeleton, LoadErrorAlert } from '../shared/states.js';
import type { DictionaryEntry, DictionaryType } from '../shared/types.js';
import { useListResource } from '../shared/use-resource.js';
import type { DictionariesOutletContext } from './constants.js';
import { EntryForm } from './entry-form.js';

const FORM_ID = 'platform-dictionary-entry';

/**
 * `new` creates an entry of the list's type; `edit/:entryId` edits one. There is no single-entry endpoint: editing
 * loads the type's entries fresh and takes the entry from them (guideline T3.8).
 */
export default function DictionaryEntryDialog(): ReactElement {
  const { entryId } = useParams();
  return <EntryDialog key={entryId ?? 'new'} entryId={entryId} />;
}

function EntryDialog({
  entryId,
}: {
  readonly entryId: string | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const { type, reload } = useOutletContext<DictionariesOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmitting = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  const [gone, setGone] = useState(false);
  const types = useListResource<DictionaryType>('dictionaryTypes');
  const entries = useListResource<DictionaryEntry>(
    entryId ? `dictionaryTypes/${encodeURIComponent(type)}/entries` : null,
    { includeInactive: 'true' },
  );
  const definition = types.data?.data.find((item) => item.type === type);
  const entry = entries.data?.data.find((item) => item.id === entryId);
  const editing = entryId !== undefined;
  const typeName = t(`platform.dictionaries.types.${type}`);

  const error = types.error ?? entries.error;
  let body: ReactElement;
  let footer: ReactElement;
  if (error) {
    body = (
      <LoadErrorAlert
        error={error}
        onRetry={() => {
          types.reload();
          entries.reload();
        }}
      />
    );
    footer = <OverlayCloseButton label={t('actions.close')} />;
  } else if (!definition || (editing && !entries.data)) {
    body = <FieldsSkeleton fields={4} />;
    footer = <OverlayCloseButton label={t('actions.cancel')} />;
  } else if (gone || (editing && !entry)) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {t('platform.dictionaries.notFound')}
        </AlertDescription>
      </Alert>
    );
    footer = <OverlayCloseButton label={t('actions.close')} />;
  } else {
    body = (
      <EntryBody
        definition={definition}
        entry={entry}
        onSubmittingChange={handleSubmitting}
        onNotFound={() => {
          setGone(true);
          reload();
        }}
      />
    );
    footer = (
      <OverlayFormFooter
        formId={FORM_ID}
        submitting={submitting}
        submitLabel={editing ? t('actions.save') : t('actions.create')}
      />
    );
  }

  return (
    <RouteDialog
      title={
        editing
          ? t('platform.dictionaries.edit.title')
          : t('platform.dictionaries.create.title', { type: typeName })
      }
      description={t('platform.dictionaries.form.description', {
        type: typeName,
      })}
      beforeClose={() => !submittingRef.current}
      footer={footer}
    >
      {body}
    </RouteDialog>
  );
}

function EntryBody({
  definition,
  entry,
  onSubmittingChange,
  onNotFound,
}: {
  readonly definition: DictionaryType;
  readonly entry: DictionaryEntry | undefined;
  readonly onSubmittingChange: (submitting: boolean) => void;
  readonly onNotFound: () => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<DictionariesOutletContext>();
  return (
    <EntryForm
      formId={FORM_ID}
      definition={definition}
      entry={entry}
      onSubmittingChange={onSubmittingChange}
      onNotFound={onNotFound}
      onSubmitted={() => {
        reload();
        void close();
      }}
    />
  );
}
