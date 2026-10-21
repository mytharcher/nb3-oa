import { Button } from '#components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import { useProcessText } from './text.js';
import { isProcessOverviewEdge } from './overview.js';
import { rulesForNode } from './node-settings.js';
import { ruleKeyId } from '../platform/approval-rules/rule-format.js';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { FlowDiagram } from '#components/flow-diagram';
import {
  Check,
  CircleCheck,
  CircleX,
  OctagonX,
  Play,
  RotateCcw,
  Settings2,
  TriangleAlert,
  UserCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { createElement, type ReactElement } from 'react';

type NodeType =
  'start' | 'approval' | 'work' | 'success' | 'negative' | 'exception';

const negativeStates = new Set([
  'rejected',
  'withdrawn',
  'terminated',
  'cancelled',
  'forcedClosed',
]);
const exceptionStates = new Set([
  'revision',
  'exception',
  'returnException',
  'paymentException',
  'blocked',
]);
// Reviewer stages across the registered lifecycles; anything else that is not an outcome is a work step.
const approvalStates = new Set([
  'manager',
  'head',
  'hr',
  'extra',
  'finance',
  'executive',
  'gm',
  'cfo',
  'legal',
  'financeManager',
  'hrbp',
  'hrDirector',
  'sourceHead',
  'targetHead',
  'committee',
  'cancellationReview',
  'removalReview',
  'legalFinance',
  'standardFinance',
]);

function nodeType(
  state: { name: string; final: boolean },
  initial: string | undefined,
): NodeType {
  if (state.name === initial || state.name === 'draft') return 'start';
  if (negativeStates.has(state.name)) return 'negative';
  if (exceptionStates.has(state.name)) return 'exception';
  if (state.final) return 'success';
  if (
    approvalStates.has(state.name) ||
    /^committee_v[1-9]\d*$/.test(state.name) ||
    /(Review|Head|Approval)$/.test(state.name)
  )
    return 'approval';
  return 'work';
}

const nodeIcons: Record<NodeType, LucideIcon> = {
  start: Play,
  approval: UserCheck,
  work: Wrench,
  success: CircleCheck,
  negative: CircleX,
  exception: TriangleAlert,
};

// Pills mark where a process begins and ends; cards are the steps people act on.
const pillTones: Record<Exclude<NodeType, 'approval' | 'work'>, string> = {
  start: 'border-border bg-card text-foreground',
  success:
    'border-(--status-success)/30 bg-(--status-success-background) text-(--status-success)',
  negative:
    'border-dashed border-destructive/40 bg-destructive/5 text-destructive',
  exception:
    'border-dashed border-(--status-warning)/35 bg-(--status-warning-background) text-(--status-warning)',
};
// A step's kind reads from its solid icon tile, not from the card outline.
const cardAccents = {
  approval: 'bg-primary text-primary-foreground',
  work: 'bg-area-administration text-background',
};

function iconFor(type: NodeType, name: string): LucideIcon {
  if (name === 'terminated') return OctagonX;
  if (name === 'revision') return RotateCcw;
  return nodeIcons[type];
}

/** Use the registry's React Flow/ELK renderer so cycles and return paths are routed
 * automatically. Parallel transitions share one visual edge; full rules remain below. */
export function ProcessGraph({
  states,
  edges,
  current,
  initial,
  definition = false,
  history,
  arrivals,
  kind = '',
  configurableNodes,
  onConfigure,
}: {
  states: { name: string; final: boolean }[];
  edges: {
    from: string;
    to: string;
    name: string;
    conditional?: boolean;
    condition?: string;
  }[];
  current?: string;
  initial?: string;
  definition?: boolean;
  history?: { from: string; to: string; name: string }[];
  /** Who moved the record into each state and when, already formatted; the latest arrival wins. */
  arrivals?: ReadonlyMap<string, string>;
  /** The process kind, for the rules bound to configurable nodes. */
  kind?: string;
  configurableNodes?: ReadonlySet<string>;
  onConfigure?: (node: string) => void;
}) {
  const { t } = useTranslation(),
    text = useProcessText();
  const historyKeys = new Set(
    history?.map((edge) => JSON.stringify([edge.name, edge.from, edge.to])),
  );
  const visitedStates = new Set(
    history?.flatMap((edge) => [edge.from, edge.to]),
  );
  if (history && initial) visitedStates.add(initial);
  const normal = edges.filter(isProcessOverviewEdge);
  const completeEdges = history ? [...normal] : [...edges];
  if (history) {
    const defined = new Set(
      completeEdges.map((edge) =>
        JSON.stringify([edge.name, edge.from, edge.to]),
      ),
    );
    completeEdges.push(
      ...history.filter(
        (edge) => !defined.has(JSON.stringify([edge.name, edge.from, edge.to])),
      ),
    );
  }
  // Definitions show the business path only; auxiliary operations are left out.
  // Actual execution history retains every recorded transition.
  const visible = definition ? normal : completeEdges;
  const names = new Set(visible.flatMap((edge) => [edge.from, edge.to]));
  const visibleStates =
    definition || history
      ? states.filter(
          (state) =>
            names.has(state.name) ||
            state.name === initial ||
            state.name === current,
        )
      : states;
  const types = new Map(
    visibleStates.map((state) => [state.name, nodeType(state, initial)]),
  );
  const groups = new Map<
    string,
    {
      from: string;
      to: string;
      key: string;
      actions: Set<string>;
      conditions: Set<string>;
      visited: boolean;
    }
  >();
  for (const edge of visible) {
    const key = JSON.stringify([edge.from, edge.to]);
    const group = groups.get(key) ?? {
      from: edge.from,
      to: edge.to,
      key,
      actions: new Set<string>(),
      conditions: new Set<string>(),
      visited: false,
    };
    group.visited ||= historyKeys.has(
      JSON.stringify([edge.name, edge.from, edge.to]),
    );
    group.actions.add(text.transition(edge.name));
    if (edge.condition)
      group.conditions.add(
        t(`processManagement.branchConditions.${edge.condition}`),
      );
    else if (edge.conditional)
      group.conditions.add(t('processManagement.conditionMissing'));
    groups.set(key, group);
  }
  // Definitions lay out the business path only. Hovering a state reveals its other
  // transitions between drawn states; ones to undrawn states stay hidden.
  const reveals = new Map<
    string,
    { from: string; to: string; key: string; actions: Set<string> }
  >();
  if (definition)
    for (const edge of edges) {
      const key = JSON.stringify([edge.from, edge.to]);
      if (
        isProcessOverviewEdge(edge) ||
        !types.has(edge.from) ||
        !types.has(edge.to) ||
        groups.has(key)
      )
        continue;
      const group = reveals.get(key) ?? {
        from: edge.from,
        to: edge.to,
        key,
        actions: new Set<string>(),
      };
      group.actions.add(text.transition(edge.name));
      reveals.set(key, group);
    }
  // Transitions to undrawn states (revision, rejection, termination…) appear beside
  // a hovered state; each explains where it leads and how the process continues.
  const exits = new Map<string, Set<string>>();
  if (definition)
    for (const edge of edges) {
      if (
        isProcessOverviewEdge(edge) ||
        !types.has(edge.from) ||
        types.has(edge.to)
      )
        continue;
      exits.set(
        edge.from,
        (exits.get(edge.from) ?? new Set<string>()).add(
          JSON.stringify([edge.name, edge.to]),
        ),
      );
    }
  const describeExit = (key: string) => {
    const [name, to] = JSON.parse(key) as [string, string];
    const state = states.find((item) => item.name === to);
    const type = state ? nodeType(state, initial) : 'start';
    const tone = type === 'approval' || type === 'work' ? 'start' : type;
    // Where the undrawn state leads next: back into the drawn flow, or nowhere.
    const next = new Map(
      edges
        .filter((edge) => edge.from === to && types.has(edge.to))
        .map((edge) => [
          JSON.stringify([edge.name, edge.to]),
          {
            action: text.transition(edge.name),
            state: text.state(edge.to),
          },
        ]),
    );
    return {
      key,
      action: text.transition(name),
      state: text.state(to),
      tone,
      icon: iconFor(tone, to),
      next: [...next.values()],
      final: state?.final ?? false,
    };
  };
  const graphEdges = [...groups.values()].map((edge) => {
    const target = types.get(edge.to);
    // Returns and side exits stay visible but recede behind the forward path.
    const secondary =
      edge.from === edge.to ||
      target === 'exception' ||
      target === 'negative' ||
      target === 'start';
    return { ...edge, secondary };
  });
  const forwardOut = new Map<string, number>();
  for (const edge of graphEdges)
    if (!edge.secondary)
      forwardOut.set(edge.from, (forwardOut.get(edge.from) ?? 0) + 1);
  const ruleLabels = (node: string) =>
    rulesForNode(kind, node).map((key) =>
      t(`platform.rules.keys.${ruleKeyId(key)}.label`),
    );
  const stateOf = (name: string) =>
    !history
      ? 'plan'
      : name === current
        ? 'current'
        : visitedStates.has(name)
          ? 'visited'
          : 'unreached';

  return (
    <div className='flex flex-col gap-3'>
      {definition && (
        <p className='text-sm text-muted-foreground'>
          {t('processManagement.normalDescription')}
          {reveals.size || exits.size
            ? ` ${t('processManagement.revealHint')}`
            : null}
        </p>
      )}
      <Legend history={Boolean(history)} />
      <FlowDiagram
        className='h-[600px] [&_.react-flow__node]:cursor-default'
        onNodeClick={(node) => {
          if (definition && configurableNodes?.has(node.id))
            onConfigure?.(node.id);
        }}
        ariaLabel={t('processManagement.graphView')}
        direction='DOWN'
        controls
        compact
        revealEdges={
          definition
            ? [...reveals.values()].map((edge) => {
                const actions = Array.from(edge.actions).join(' / ');
                return {
                  id: edge.key,
                  source: edge.from,
                  target: edge.to,
                  label: actions,
                  title: actions,
                };
              })
            : undefined
        }
        nodes={visibleStates.map((state) => {
          const type = types.get(state.name)!;
          const card = type === 'approval' || type === 'work';
          const twoLines = Boolean(
            arrivals?.get(state.name) ||
            (!history && state.name === 'terminated'),
          );
          return {
            id: state.name,
            label: text.state(state.name),
            bare: true,
            minimapShape: card ? 'card' : 'pill',
            minimapColor:
              type === 'success'
                ? 'var(--status-success)'
                : type === 'negative'
                  ? 'var(--destructive)'
                  : type === 'exception'
                    ? 'var(--status-warning)'
                    : 'var(--muted-foreground)',
            highlighted: state.name === current,
            visited: visitedStates.has(state.name),
            className:
              definition && configurableNodes?.has(state.name)
                ? 'cursor-pointer'
                : 'cursor-default',
            width: card ? 216 : 176,
            height: card ? 64 : twoLines ? 56 : 44,
          };
        })}
        edges={graphEdges.map((edge) => {
          const actions = Array.from(edge.actions).join(' / ');
          const conditions = Array.from(edge.conditions).join(' / ');
          const full = conditions ? `${actions} · ${conditions}` : actions;
          // Conditions always show; an action name only where a step has more than one way forward.
          const shown =
            !edge.secondary &&
            (conditions || ((forwardOut.get(edge.from) ?? 0) > 1 && actions));
          return {
            id: edge.key,
            source: edge.from,
            target: edge.to,
            label: shown || undefined,
            title: full,
            visited: edge.visited,
            faint: history ? !edge.visited : edge.secondary,
            dashed: edge.secondary && !edge.visited,
          };
        })}
        renderNode={(node, { active }) => {
          const type = types.get(node.id) ?? 'work';
          const exitList =
            active && exits.has(node.id) ? (
              <ExitList exits={[...exits.get(node.id)!].map(describeExit)} />
            ) : null;
          const progress = stateOf(node.id);
          const arrival = arrivals?.get(node.id);
          const configurable = definition && configurableNodes?.has(node.id);
          const icon = iconFor(type, node.id);
          if (type === 'approval' || type === 'work') {
            const rules = configurable ? ruleLabels(node.id) : [];
            return (
              <div
                className={cn(
                  'relative flex h-full items-center gap-3 rounded-lg border bg-card px-3 text-card-foreground shadow-xs transition-[border-color,box-shadow,opacity]',
                  progress === 'current' && 'border-primary',
                  progress === 'unreached' && 'border-dashed opacity-55',
                  configurable &&
                    'hover:border-primary hover:ring-2 hover:ring-primary/20',
                )}
              >
                {progress === 'current' ? (
                  <span
                    aria-hidden='true'
                    className='pointer-events-none absolute -inset-1 rounded-xl ring-2 ring-primary/40 motion-safe:animate-pulse'
                  />
                ) : null}
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-md shadow-xs',
                    cardAccents[type],
                  )}
                >
                  {createElement(icon, {
                    'aria-hidden': true,
                    className: 'size-4',
                  })}
                </span>
                <span className='flex min-w-0 flex-1 flex-col text-left'>
                  <span className='truncate text-sm font-medium'>
                    {node.label}
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {arrival ??
                      (progress === 'unreached'
                        ? t('processManagement.notReached')
                        : t(`processManagement.nodeTypes.${type}`))}
                  </span>
                </span>
                {configurable ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={<Button variant='outline' size='xs' />}
                      type='button'
                      className='nodrag nopan shrink-0'
                      aria-label={t(
                        'processManagement.nodeSettings.editNamed',
                        {
                          name: node.label,
                        },
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        onConfigure?.(node.id);
                      }}
                    >
                      <Settings2 aria-hidden='true' className='size-3.5' />
                      {rules.length
                        ? t('processManagement.rulesCount', {
                            count: rules.length,
                          })
                        : t('processManagement.nodeSettings.edit')}
                    </TooltipTrigger>
                    <TooltipContent>
                      {rules.join(' · ') ||
                        t('processManagement.nodeSettings.edit')}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
                <StatusChip progress={progress} terminal={false} />
                {exitList}
              </div>
            );
          }
          const subline =
            arrival ??
            (!history && node.id === 'terminated'
              ? t('processManagement.terminationOutcome')
              : null);
          return (
            <div
              className={cn(
                'relative flex h-full flex-col items-center justify-center border px-4 text-sm font-medium',
                subline ? 'rounded-2xl' : 'rounded-full',
                pillTones[type],
                progress === 'current' && 'ring-2 ring-primary/40',
                progress === 'unreached' && 'opacity-55',
              )}
            >
              <span className='flex max-w-full items-center gap-1.5'>
                {createElement(icon, {
                  'aria-hidden': true,
                  className: 'size-4 shrink-0',
                })}
                <span className='truncate'>{node.label}</span>
              </span>
              {subline ? (
                <span className='max-w-full truncate text-xs font-normal opacity-80'>
                  {subline}
                </span>
              ) : null}
              <StatusChip progress={progress} terminal />
              {exitList}
            </div>
          );
        }}
      />
    </div>
  );
}

interface ExitItem {
  key: string;
  action: string;
  state: string;
  tone: keyof typeof pillTones;
  icon: LucideIcon;
  next: { action: string; state: string }[];
  final: boolean;
}

/** A hovered state's exits to undrawn states; hovering an exit explains where it leads. */
function ExitList({ exits }: { exits: ExitItem[] }): ReactElement {
  const { t } = useTranslation();
  return (
    // Padding rather than margin, so moving onto an exit keeps the node hovered.
    <div className='absolute top-1/2 left-full -translate-y-1/2 pl-2'>
      <ul
        aria-label={t('processManagement.otherExits')}
        className='flex w-max flex-col items-start gap-1'
      >
        {exits.map((exit) => (
          <li key={exit.key} className='rounded-full bg-card'>
            <Tooltip>
              <TooltipTrigger
                render={<span />}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-normal shadow-xs',
                  pillTones[exit.tone],
                )}
              >
                {createElement(exit.icon, {
                  'aria-hidden': true,
                  className: 'size-3 shrink-0',
                })}
                {exit.action}
                <span className='sr-only'> → {exit.state}</span>
              </TooltipTrigger>
              <TooltipContent className='flex max-w-72 flex-col items-start gap-1'>
                <span>
                  {exit.action} → {exit.state}
                </span>
                {exit.next.length ? (
                  <>
                    <span className='opacity-80'>
                      {t('processManagement.exitNext')}
                    </span>
                    <ul className='flex flex-col gap-0.5'>
                      {exit.next.map((next) => (
                        <li key={`${next.action}:${next.state}`}>
                          {next.action} → {next.state}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : exit.final ? (
                  <span className='opacity-80'>
                    {t('processManagement.exitEnds')}
                  </span>
                ) : null}
              </TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A small corner chip: the current step stands out; finished steps get a quiet check. */
function StatusChip({
  progress,
  terminal,
}: {
  progress: 'plan' | 'current' | 'visited' | 'unreached';
  terminal: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  if (progress === 'current')
    return (
      <span className='absolute -top-2.5 right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-xs'>
        {t('processManagement.currentNode')}
      </span>
    );
  if (progress === 'visited' && !terminal)
    return (
      <span
        className='absolute -top-2 right-2 flex size-4 items-center justify-center rounded-full bg-(--status-success) text-primary-foreground shadow-xs'
        title={t('processManagement.visitedNode')}
      >
        <Check aria-hidden='true' className='size-3' strokeWidth={3} />
        <span className='sr-only'>{t('processManagement.visitedNode')}</span>
      </span>
    );
  return null;
}

/** The diagram's vocabulary, drawn with the same shapes the canvas uses. */
function Legend({ history }: { history: boolean }): ReactElement {
  const { t } = useTranslation();
  const pill = (type: keyof typeof pillTones) => (
    <span
      aria-hidden='true'
      className={cn('h-3 w-5 rounded-full border', pillTones[type])}
    />
  );
  const card = (type: 'approval' | 'work') => (
    <span
      aria-hidden='true'
      className={cn(
        'flex size-4 items-center justify-center rounded-sm',
        cardAccents[type],
      )}
    >
      {createElement(nodeIcons[type], { className: 'size-3' })}
    </span>
  );
  const items: [ReactElement, string][] = [
    [pill('start'), t('processManagement.nodeTypes.start')],
    [card('approval'), t('processManagement.nodeTypes.approval')],
    [card('work'), t('processManagement.nodeTypes.work')],
    [pill('success'), t('processManagement.nodeTypes.success')],
    [pill('negative'), t('processManagement.nodeTypes.negative')],
    [pill('exception'), t('processManagement.nodeTypes.exception')],
  ];
  if (history)
    items.push(
      [
        <span
          key='current'
          aria-hidden='true'
          className='h-3 w-5 rounded-sm border border-primary ring-2 ring-primary/30'
        />,
        t('processManagement.currentNode'),
      ],
      [
        <span
          key='unreached'
          aria-hidden='true'
          className='h-3 w-5 rounded-sm border border-dashed bg-card opacity-55'
        />,
        t('processManagement.unvisitedNode'),
      ],
    );
  return (
    <ul
      aria-label={t('processManagement.graphLegend')}
      className='flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground'
    >
      {items.map(([swatch, label]) => (
        <li key={label} className='flex items-center gap-1.5'>
          {swatch}
          {label}
        </li>
      ))}
    </ul>
  );
}
