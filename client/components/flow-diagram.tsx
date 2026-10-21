import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  BaseEdge,
  Controls,
  ControlButton,
  MiniMap,
  Panel,
  type MiniMapNodeProps,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { Expand, Shrink, X } from 'lucide-react';
import { Button } from '#components/ui/button';
import '@xyflow/react/dist/style.css';

import {
  layoutFlowDiagram,
  flowLabelLines,
  revealRoute,
  type FlowDiagramDirection,
  type FlowDiagramEdge,
  type FlowDiagramGraph,
  type FlowDiagramLayout,
  type FlowDiagramNode,
  type FlowDiagramPoint,
} from './flow-layout.js';

type DiagramNode = Node<{
  item: FlowDiagramNode;
  direction: FlowDiagramDirection;
  content: ReactNode;
}>;
type DiagramEdge = Edge<{
  points: readonly FlowDiagramPoint[];
  labelPosition?: FlowDiagramPoint;
  labelAnchor?: 'end' | 'middle';
  title?: string;
}>;

function DiagramMiniMapNode(props: MiniMapNodeProps): ReactElement {
  return (
    <rect
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      rx={props.className.includes('minimap-pill') ? props.height / 2 : 8}
      fill={props.color}
      stroke={props.strokeColor}
      strokeWidth={props.strokeWidth}
      onClick={
        props.onClick ? (event) => props.onClick?.(event, props.id) : undefined
      }
    />
  );
}

function DiagramState({ data }: NodeProps<DiagramNode>): ReactElement {
  const inPosition = data.direction === 'RIGHT' ? Position.Left : Position.Top;
  const outPosition =
    data.direction === 'RIGHT' ? Position.Right : Position.Bottom;
  if (data.item.bare)
    return (
      <div className={cn('h-full w-full', data.item.className)}>
        <Handle
          id='in'
          type='target'
          position={inPosition}
          className='invisible'
        />
        {data.content}
        <Handle
          id='out'
          type='source'
          position={outPosition}
          className='invisible'
        />
      </div>
    );
  return (
    <div
      data-execution-state={
        data.item.highlighted
          ? 'current'
          : data.item.visited
            ? 'visited'
            : 'pending'
      }
      style={
        data.item.highlighted || data.item.visited
          ? {
              borderColor: `color-mix(in srgb, var(--primary) ${data.item.highlighted ? 100 : 50}%, var(--border))`,
              background: `color-mix(in srgb, var(--primary) ${data.item.highlighted ? 22 : 8}%, var(--card))`,
            }
          : undefined
      }
      className={cn(
        'flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-card px-3 text-sm text-card-foreground shadow-sm',
        data.item.highlighted && 'font-semibold ring-2 ring-primary/30',
        data.item.className,
      )}
    >
      <Handle
        id='in'
        type='target'
        position={data.direction === 'RIGHT' ? Position.Left : Position.Top}
        className='invisible'
      />
      <div className='w-full text-center leading-snug'>{data.content}</div>
      <Handle
        id='out'
        type='source'
        position={data.direction === 'RIGHT' ? Position.Right : Position.Bottom}
        className='invisible'
      />
    </div>
  );
}

/** Keep ELK's routes while rounding their right-angle bends. */
function routePath(points: readonly FlowDiagramPoint[]): string {
  if (!points.length) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const before = points[index - 1];
    const point = points[index];
    const after = points[index + 1];
    const incoming = Math.hypot(point.x - before.x, point.y - before.y);
    const outgoing = Math.hypot(after.x - point.x, after.y - point.y);
    if (!incoming || !outgoing) continue;
    const radius = Math.min(8, incoming / 2, outgoing / 2);
    const start = {
      x: point.x + ((before.x - point.x) / incoming) * radius,
      y: point.y + ((before.y - point.y) / incoming) * radius,
    };
    const end = {
      x: point.x + ((after.x - point.x) / outgoing) * radius,
      y: point.y + ((after.y - point.y) / outgoing) * radius,
    };
    path += ` L ${start.x} ${start.y} Q ${point.x} ${point.y} ${end.x} ${end.y}`;
  }
  const last = points.at(-1)!;
  return `${path} L ${last.x} ${last.y}`;
}

/** Measure the actual SVG bounds so multiline labels have equal chip padding. */
function TransitionLabel({
  x,
  y,
  label,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  label: ReactNode;
  anchor?: 'end' | 'middle';
}) {
  const ref = useRef<SVGTextElement>(null);
  const [bounds, setBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  useLayoutEffect(() => {
    const box = ref.current?.getBBox();
    if (box)
      setBounds({ x: box.x, y: box.y, width: box.width, height: box.height });
  }, [label, anchor]);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={bounds.x - 6}
        y={bounds.y - 3}
        width={bounds.width + 12}
        height={bounds.height + 6}
        rx={6}
        fill='var(--muted)'
      />
      <text
        ref={ref}
        textAnchor={anchor}
        dominantBaseline='central'
        fill='var(--muted-foreground)'
        fontSize='var(--text-xs)'
      >
        {typeof label === 'string'
          ? flowLabelLines(label).map((line, index, lines) => (
              <tspan
                // Label lines have no state; duplicate text needs a position key.
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={`${index}:${line}`}
                x={0}
                y={(index - (lines.length - 1) / 2) * 16}
              >
                {line}
              </tspan>
            ))
          : label}
      </text>
    </g>
  );
}

function DiagramConnection(props: EdgeProps<DiagramEdge>): ReactElement {
  const points = props.data?.points ?? [];
  const path = routePath(points);
  const label = props.data?.labelPosition;
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        style={props.style}
      />
      {props.data?.title ? (
        // A wide transparent stroke so the hover text is easy to reach.
        <path d={path} fill='none' stroke='transparent' strokeWidth={12}>
          <title>{props.data.title}</title>
        </path>
      ) : null}
      {label && props.label ? (
        <g
          style={{ opacity: props.style?.opacity, transition: 'opacity 150ms' }}
        >
          <TransitionLabel
            x={label.x}
            y={label.y}
            label={props.label}
            anchor={props.data?.labelAnchor}
          />
        </g>
      ) : null}
    </>
  );
}

const nodeTypes = { diagram: DiagramState };
const edgeTypes = { diagram: DiagramConnection };

export interface FlowDiagramProps extends FlowDiagramGraph {
  readonly direction?: FlowDiagramDirection;
  /** OA extension: reduce layer spacing while retaining room for multiline conditions. */
  readonly compact?: boolean;
  readonly controls?: boolean;
  /** Expand vertically to show the entire graph at the available width. */
  readonly autoHeight?: boolean;
  /** Limit automatic fitting to this scale; manual zoom remains available. */
  readonly initialZoomLimit?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly ariaLabel: string;
  /** OA extension: transitions left out of the layout. Hovering or focusing a node draws
   * the ones touching it in lanes beside the graph and dims unrelated states. */
  readonly revealEdges?: readonly FlowDiagramEdge[];
  readonly renderNode?: (
    node: FlowDiagramNode,
    state: { active: boolean },
  ) => ReactNode;
  readonly onNodeClick?: (node: FlowDiagramNode) => void;
  readonly onEdgeClick?: (edge: FlowDiagramEdge) => void;
  readonly onLayoutError?: (error: unknown) => void;
}

/** A read-only graph canvas. The parent controls its data, selection details and dimensions. */
export function FlowDiagram({
  nodes,
  edges,
  direction = 'RIGHT',
  compact = false,
  controls = false,
  autoHeight = false,
  initialZoomLimit = 1,
  className,
  style,
  ariaLabel,
  revealEdges,
  renderNode,
  onNodeClick,
  onEdgeClick,
  onLayoutError,
}: FlowDiagramProps): ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!autoHeight || !containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoHeight]);
  // Layout only structural changes; polling a record or highlighting a node preserves the viewport.
  const structure = JSON.stringify({
    nodes: nodes.map(({ id, width, height }) => ({
      id,
      label: '',
      width,
      height,
    })),
    edges: edges.map(({ id, source, target, label }) => ({
      id,
      source,
      target,
      label,
    })),
    direction,
    compact,
  });
  const [result, setResult] = useState<{
    key: string;
    layout?: FlowDiagramLayout;
    error?: unknown;
  }>();
  useEffect(() => {
    let active = true;
    const input = JSON.parse(structure) as FlowDiagramGraph & {
      direction: FlowDiagramDirection;
      compact: boolean;
    };
    void layoutFlowDiagram(input, input.direction, input.compact).then(
      (layout) => {
        if (active) setResult({ key: structure, layout });
      },
      (error: unknown) => {
        if (active) setResult({ key: structure, error });
      },
    );
    return () => {
      active = false;
    };
  }, [structure]);
  useEffect(() => {
    if (result?.key === structure && result.error)
      onLayoutError?.(result.error);
  }, [result, structure, onLayoutError]);
  const layout = result?.key === structure ? result.layout : undefined;
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const active = revealEdges ? (hovered ?? focused) : undefined;
  const revealed = useMemo(
    () =>
      active
        ? (revealEdges ?? []).filter(
            (edge) => edge.source === active || edge.target === active,
          )
        : [],
    [active, revealEdges],
  );
  // The active state and every state one transition away stay at full strength.
  const related = useMemo(
    () =>
      active
        ? new Set(
            [...edges, ...revealed]
              .filter(
                (edge) => edge.source === active || edge.target === active,
              )
              .flatMap((edge) => [edge.source, edge.target])
              .concat(active),
          )
        : undefined,
    [active, edges, revealed],
  );
  const placedNodes = useMemo<DiagramNode[]>(
    () =>
      (layout?.nodes ?? []).map((placed) => {
        const item = nodes.find((node) => node.id === placed.id)!;
        return {
          id: item.id,
          type: 'diagram',
          focusable: !item.decorative,
          selectable: !item.decorative,
          position: { x: placed.x, y: placed.y },
          // Raised so content the active node draws outside its box stays on top.
          zIndex: item.id === active ? 1 : 0,
          style: {
            width: placed.width,
            height: placed.height,
            opacity: related && !related.has(item.id) ? 0.35 : undefined,
            transition: 'opacity 150ms',
          },
          // ELK owns fixed geometry. Recreated controlled nodes must not clear
          // React Flow's measurements and briefly remove every connected edge.
          width: placed.width,
          height: placed.height,
          measured: { width: placed.width, height: placed.height },
          handles: [
            {
              id: 'in',
              type: 'target',
              position: direction === 'RIGHT' ? Position.Left : Position.Top,
              x: direction === 'RIGHT' ? 0 : placed.width / 2,
              y: direction === 'RIGHT' ? placed.height / 2 : 0,
              width: 0,
              height: 0,
            },
            {
              id: 'out',
              type: 'source',
              position:
                direction === 'RIGHT' ? Position.Right : Position.Bottom,
              x: direction === 'RIGHT' ? placed.width : placed.width / 2,
              y: direction === 'RIGHT' ? placed.height / 2 : placed.height,
              width: 0,
              height: 0,
            },
          ],
          ariaLabel: item.label,
          data: {
            item,
            direction,
            content: renderNode
              ? renderNode(item, { active: item.id === active })
              : item.label,
          },
        };
      }),
    [layout, nodes, direction, renderNode, active, related],
  );
  const placedEdges = useMemo<DiagramEdge[]>(
    () =>
      (layout?.edges ?? []).map((placed) => {
        const item = edges.find((edge) => edge.id === placed.id)!;
        const color = item.visited
          ? 'color-mix(in srgb, var(--primary) 80%, var(--foreground))'
          : item.highlighted
            ? 'var(--primary)'
            : item.faint
              ? 'color-mix(in srgb, var(--muted-foreground) 25%, transparent)'
              : 'color-mix(in srgb, var(--muted-foreground) 45%, transparent)';
        return {
          ...item,
          type: 'diagram',
          focusable: !item.decorative,
          selectable: !item.decorative,
          sourceHandle: 'out',
          targetHandle: 'in',
          ariaLabel:
            item.label ?? item.title ?? `${item.source} → ${item.target}`,
          markerEnd: { type: MarkerType.ArrowClosed, color },
          style: {
            stroke: color,
            strokeWidth:
              item.visited || item.highlighted ? 2.5 : item.faint ? 1 : 1.5,
            strokeDasharray: item.dashed ? '5 4' : undefined,
            opacity:
              active && item.source !== active && item.target !== active
                ? 0.25
                : undefined,
            transition: 'opacity 150ms',
          },
          data: {
            points: placed.points,
            labelPosition: placed.labelPosition,
            title: item.title,
          },
        };
      }),
    [layout, edges, active],
  );
  const revealedEdges = useMemo<DiagramEdge[]>(() => {
    if (!layout) return [];
    const placed = new Map(layout.nodes.map((node) => [node.id, node]));
    const routes = revealed.flatMap((item) => {
      const source = placed.get(item.source),
        target = placed.get(item.target);
      return source && target ? [{ item, source, target }] : [];
    });
    // Shorter spans take the inner lanes, so nested routes never cross.
    const span = ({ source, target }: (typeof routes)[number]) =>
      Math.abs(
        direction === 'DOWN' ? source.y - target.y : source.x - target.x,
      );
    routes.sort((a, b) => span(a) - span(b));
    const color = 'var(--primary)';
    return routes.map(({ item, source, target }, lane) => {
      const route = revealRoute(layout.nodes, source, target, direction, lane);
      return {
        ...item,
        id: `reveal:${item.id}`,
        type: 'diagram',
        focusable: false,
        selectable: false,
        sourceHandle: 'out',
        targetHandle: 'in',
        ariaLabel:
          item.label ?? item.title ?? `${item.source} → ${item.target}`,
        markerEnd: { type: MarkerType.ArrowClosed, color },
        style: { stroke: color, strokeWidth: 1.5, strokeDasharray: '5 4' },
        data: { ...route, title: item.title },
      };
    });
  }, [layout, revealed, direction]);
  const zoom =
    layout && width
      ? Math.max(
          0.1,
          Math.min(initialZoomLimit, (width - 48) / Math.max(1, layout.width)),
        )
      : 1;
  const height = layout ? Math.max(240, layout.height * zoom + 48) : 240;
  const canvas = (
    <div
      ref={containerRef}
      onFocus={(event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('react-flow__node'))
          setFocused(target.dataset.id);
      }}
      onBlur={() => setFocused(undefined)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = event.target as HTMLElement | SVGElement;
        const nodeElement = target.closest<HTMLElement>('.react-flow__node');
        const edgeElement = target.closest<HTMLElement>('.react-flow__edge');
        if (target !== nodeElement && target !== edgeElement) return;
        const id = target.dataset.id;
        const node = nodes.find((item) => item.id === id);
        const edge = edges.find((item) => item.id === id);
        if (nodeElement && node) {
          event.preventDefault();
          onNodeClick?.(node);
        }
        if (edgeElement && edge) {
          event.preventDefault();
          onEdgeClick?.(edge);
        }
      }}
      aria-label={ariaLabel}
      className={cn(
        'relative h-96 w-full rounded-lg border border-border bg-muted/20 text-foreground',
        className,
        expanded &&
          'fixed inset-0 z-[100] h-dvh! w-screen rounded-none bg-background',
      )}
      style={{ ...(autoHeight ? { height } : {}), ...style }}
    >
      {!nodes.length ? (
        <p role='status' className='p-4 text-sm text-muted-foreground'>
          {t('flowDiagram.empty', { defaultValue: 'No states to display.' })}
        </p>
      ) : result?.key === structure && result.error ? (
        <p role='alert' className='p-4 text-sm text-destructive'>
          {t('flowDiagram.failed', {
            defaultValue: 'Unable to lay out this diagram.',
          })}
        </p>
      ) : !layout ? (
        <p role='status' className='p-4 text-sm text-muted-foreground'>
          {t('flowDiagram.loading', { defaultValue: 'Laying out diagram…' })}
        </p>
      ) : (
        <ReactFlow<DiagramNode, DiagramEdge>
          key={autoHeight ? `${structure}:${width}:${zoom}` : structure}
          proOptions={controls ? { hideAttribution: true } : undefined}
          nodes={placedNodes}
          edges={
            revealedEdges.length
              ? [...placedEdges, ...revealedEdges]
              : placedEdges
          }
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={!autoHeight}
          fitViewOptions={{ padding: 0.08, maxZoom: initialZoomLimit }}
          defaultViewport={
            autoHeight
              ? {
                  x: (width - layout.width * zoom) / 2,
                  y: (height - layout.height * zoom) / 2,
                  zoom,
                }
              : undefined
          }
          minZoom={0.1}
          maxZoom={2}
          zoomOnScroll={false}
          preventScrolling={false}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          deleteKeyCode={null}
          onNodeClick={(_, node) => onNodeClick?.(node.data.item)}
          onNodeMouseEnter={(_, node) => setHovered(node.id)}
          onNodeMouseLeave={() => setHovered(undefined)}
          onEdgeClick={(_, edge) => {
            const item = edges.find((candidate) => candidate.id === edge.id);
            if (item) onEdgeClick?.(item);
          }}
          ariaLabelConfig={{
            'controls.zoomIn.ariaLabel': t('flowDiagram.zoomIn'),
            'controls.zoomOut.ariaLabel': t('flowDiagram.zoomOut'),
            'controls.fitView.ariaLabel': t('flowDiagram.fitView'),
            'node.a11yDescription.keyboardDisabled': t('flowDiagram.nodeHelp', {
              defaultValue: 'Press Enter or Space to select a state.',
            }),
            'node.a11yDescription.default': t('flowDiagram.nodeHelp', {
              defaultValue: 'Press Enter or Space to select a state.',
            }),
            'edge.a11yDescription.default': t('flowDiagram.edgeHelp', {
              defaultValue: 'Press Enter or Space to select a transition.',
            }),
          }}
        >
          {controls && (
            <>
              <Controls
                fitViewOptions={{ padding: 0.08, maxZoom: initialZoomLimit }}
                showInteractive={false}
                aria-label={t('flowDiagram.controls')}
              >
                <ControlButton
                  type='button'
                  onClick={() => setExpanded((value) => !value)}
                  aria-label={t(
                    expanded
                      ? 'flowDiagram.exitFullscreen'
                      : 'flowDiagram.fullscreen',
                  )}
                  title={t(
                    expanded
                      ? 'flowDiagram.exitFullscreen'
                      : 'flowDiagram.fullscreen',
                  )}
                >
                  {expanded ? <Shrink /> : <Expand />}
                </ControlButton>
              </Controls>
              {expanded && (
                <Panel position='top-right'>
                  <div className='flex items-center gap-3 rounded-lg border bg-card p-2 text-card-foreground shadow-sm'>
                    <span className='text-xs text-muted-foreground'>
                      {t('flowDiagram.escapeHint')}
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setExpanded(false)}
                    >
                      <X />
                      {t('flowDiagram.exitFullscreen')}
                    </Button>
                  </div>
                </Panel>
              )}
              {expanded && (
                <MiniMap<DiagramNode>
                  pannable
                  zoomable
                  ariaLabel={t('flowDiagram.minimap')}
                  style={{ background: 'var(--card)' }}
                  nodeComponent={DiagramMiniMapNode}
                  nodeClassName={(node) =>
                    node.data.item.minimapShape === 'pill' ? 'minimap-pill' : ''
                  }
                  nodeColor={(node) =>
                    `color-mix(in srgb, ${node.data.item.minimapColor ?? 'var(--muted-foreground)'} 18%, var(--card))`
                  }
                  nodeStrokeColor={(node) =>
                    `color-mix(in srgb, ${node.data.item.minimapColor ?? 'var(--muted-foreground)'} 35%, var(--card))`
                  }
                  nodeStrokeWidth={2}
                  maskColor='color-mix(in srgb, var(--muted) 70%, transparent)'
                  className='max-w-[35%]'
                />
              )}
            </>
          )}
        </ReactFlow>
      )}
    </div>
  );
  return expanded ? createPortal(canvas, document.body) : canvas;
}
