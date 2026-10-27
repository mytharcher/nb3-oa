import { useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useChatApi,
  useChatModels,
  useConversation,
  useConversationMessages,
  useSendMessage,
  useConversationActions,
} from '@nocobase/app-plugin-agents/client/chat';
import { appUIMessageText } from '@nocobase/app-plugin-agents/shared/online-agent';
import { Button } from '#components/ui/button';
import { Dialog, DialogTitle, DialogDescription } from '#components/ui/dialog';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { Field, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import {
  AgentComposer,
  type AgentComposerLabels,
} from '#components/agent-composer';
import { MarkdownView } from '#components/markdown-view';
import { ApprovalAiError } from './error.js';
import { useApprovalAssistant } from './assistant-context.js';
export function ApprovalAssistantButton() {
  const context = useApprovalAssistant(),
    { t } = useTranslation();
  return context ? (
    <Button variant='outline' size='sm' onClick={() => context.setOpen(true)}>
      {t('approvalAi.assistant')}
    </Button>
  ) : null;
}
export function ApprovalAssistantPanel() {
  const context = useApprovalAssistant();
  if (!context) return null;
  return <Panel />;
}
function Panel() {
  const context = useApprovalAssistant()!,
    { t } = useTranslation(),
    api = useChatApi(),
    models = useChatModels(context.open);
  const [conversationId, setConversationId] = useState<string | null>(null),
    [model, setModel] = useState(''),
    [creating, setCreating] = useState(false),
    [error, setError] = useState<unknown>(),
    [copied, setCopied] = useState(false);
  const detail = useConversation(conversationId),
    running = detail.data?.execution?.status === 'running';
  const messages = useConversationMessages(conversationId),
    actions = useConversationActions();
  const send = useSendMessage({
    conversationId,
    agentId: 'online',
    source: 'panel',
    dispatch: messages.dispatch,
    onCreated: (conversation) => setConversationId(conversation.id),
  });
  const choices = (models.data ?? []).flatMap((service) =>
    service.models.map((option) => ({
      value: JSON.stringify([service.name, option.value]),
      label: service.title + ' / ' + option.label,
    })),
  );
  async function start() {
    setCreating(true);
    setError(undefined);
    try {
      const [modelService, chosenModel] = JSON.parse(model) as [string, string];
      const conversation = await api.createConversation({
        agentId: 'online',
        title: t('approvalAi.assistant'),
        selectedModel: { modelService, model: chosenModel },
        config: {
          scope: ['oa-approval-assistant'],
          context: {
            variable: context.recordId ? { recordId: context.recordId } : {},
          },
        },
      });
      setConversationId(conversation.id);
    } catch (e) {
      setError(e);
    } finally {
      setCreating(false);
    }
  }
  // The conversation is bound to its starting record. Page references are never authority for tools.
  const [boundRecord, setBoundRecord] = useState<string | null>(null);
  const [boundLabel, setBoundLabel] = useState<string | null>(null);
  const labels = Object.fromEntries(
    [
      'label',
      'placeholder',
      'hint',
      'runningHint',
      'tooLong',
      'send',
      'stop',
      'stopping',
      'contextLabel',
      'contextFilter',
      'contextSelection',
      'contextRemove',
      'attach',
      'attachmentsLabel',
      'attachmentRemove',
      'attachmentUploading',
      'attachmentTooLarge',
      'attachmentFailed',
      'attachmentsTooMany',
      'attachmentsBlocked',
      'attachmentsWaiting',
    ].map((key) => [key, t('approvalAi.composer.' + key)]),
  ) as unknown as AgentComposerLabels;
  return (
    <Dialog open={context.open} onOpenChange={context.setOpen}>
      <FormDrawerContent>
        <FormDrawerHeader>
          <DialogTitle>{t('approvalAi.assistant')}</DialogTitle>
          <DialogDescription>
            {t('approvalAi.assistantDescription')}
          </DialogDescription>
        </FormDrawerHeader>
        <FormDrawerBody>
          <p className='text-sm text-muted-foreground'>
            {(conversationId ? boundLabel : context.recordLabel)
              ? t('approvalAi.contextContract', {
                  name: conversationId ? boundLabel : context.recordLabel,
                })
              : t('approvalAi.noContextContract')}
          </p>
          {conversationId && boundRecord !== context.recordId && (
            <p role='status' className='text-sm'>
              {t('approvalAi.contextChanged')}
            </p>
          )}
          {!!(error || messages.error) && (
            <ApprovalAiError
              error={error ?? messages.error}
              retry={() => {
                setError(undefined);
                messages.fetchNewer();
              }}
            />
          )}
          {!conversationId ? (
            <>
              <Field>
                <FieldLabel htmlFor='assistant-model'>
                  {t('approvalAi.model')}
                </FieldLabel>
                <Select
                  items={choices}
                  value={model || null}
                  onValueChange={(value) => setModel(value ?? '')}
                >
                  <SelectTrigger id='assistant-model' className='w-full'>
                    <SelectValue placeholder={t('approvalAi.noModel')} />
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-(--available-width) min-w-(--anchor-width)'>
                    <SelectGroup>
                      {choices.map((choice) => (
                        <SelectItem
                          className='whitespace-normal wrap-anywhere'
                          key={choice.value}
                          value={choice.value}
                        >
                          {choice.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              {!choices.length && (
                <p className='text-sm text-muted-foreground'>
                  {t('approvalAi.modelHint')}
                </p>
              )}
              {!!models.error && (
                <ApprovalAiError
                  error={models.error}
                  retry={() => void models.refetch()}
                />
              )}
              <Button
                disabled={!model || creating}
                onClick={() => {
                  setBoundRecord(context.recordId);
                  setBoundLabel(context.recordLabel);
                  void start();
                }}
              >
                {t('approvalAi.startConversation')}
              </Button>
            </>
          ) : (
            <>
              {messages.items.map((message) => {
                const text = appUIMessageText(message);
                return text ? (
                  <Card key={message.id} className='min-w-0'>
                    <CardHeader>
                      <CardTitle>
                        {t(
                          message.role === 'user'
                            ? 'approvalAi.you'
                            : 'approvalAi.assistant',
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='min-w-0 wrap-anywhere'>
                      <MarkdownView content={text} />
                      {message.role === 'assistant' && boundRecord && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            context.setDraft(boundRecord, text);
                            setCopied(true);
                          }}
                        >
                          {t('approvalAi.useDraft')}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : null;
              })}
              {messages.pending.map((message) => (
                <Card key={message.clientId}>
                  <CardHeader>
                    <CardTitle>{t('approvalAi.you')}</CardTitle>
                  </CardHeader>
                  <CardContent className='wrap-anywhere'>
                    <p>{message.content}</p>
                    <p role='status'>
                      {t(
                        message.status === 'sending'
                          ? 'approvalAi.composer.runningHint'
                          : 'approvalAi.requestFailed',
                      )}
                    </p>
                    {message.status === 'failed' && (
                      <Button
                        variant='outline'
                        onClick={() =>
                          send({
                            content: message.content,
                            context: message.context,
                            clientId: message.clientId,
                          })
                        }
                      >
                        {t('approvalAi.retry')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {copied && (
                <p role='status' className='text-sm'>
                  {t('approvalAi.draftReady')}
                </p>
              )}
              <AgentComposer
                labels={labels}
                running={running}
                disabled={creating || running}
                onStop={() => {
                  if (conversationId) actions.stop.mutate(conversationId);
                }}
                onSend={async (content) => {
                  try {
                    return send({ content, context: undefined });
                  } catch (e) {
                    setError(e);
                    return false;
                  }
                }}
              />
            </>
          )}
        </FormDrawerBody>
        <FormDrawerFooter>
          <Button
            variant='outline'
            disabled={running}
            onClick={() => {
              setConversationId(null);
              setCopied(false);
            }}
          >
            {t('approvalAi.newConversation')}
          </Button>
          <Button variant='outline' onClick={() => context.setOpen(false)}>
            {t('approvalAi.close')}
          </Button>
        </FormDrawerFooter>
      </FormDrawerContent>
    </Dialog>
  );
}
