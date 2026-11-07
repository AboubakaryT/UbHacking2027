import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { Box, Braces, FileCode2, Globe, Package } from 'lucide-react'
import type { DependencyGraph as Graph, GraphNode } from '../data/types'

const typeIcon: Record<string, typeof Box> = {
  endpoint: Globe,
  file: FileCode2,
  function: Braces,
  component: Box,
  package: Package,
}

const issueColor: Record<string, string> = {
  critical: '#fb7185',
  high: '#fb923c',
  medium: '#fcd34d',
  low: '#38bdf8',
}

// Hand-placed positions for the mock graph. A real graph should use a layout
// library such as dagre or elkjs.
const positions: Record<string, { x: number; y: number }> = {
  'c-dashboard': { x: 0, y: 170 },
  'c-profile': { x: 260, y: 40 },
  'c-login': { x: 260, y: 300 },
  'f-format': { x: 260, y: 430 },
  'ep-users': { x: 540, y: 40 },
  'fn-verify': { x: 540, y: 300 },
  'pkg-datefns': { x: 540, y: 430 },
  'f-users-route': { x: 820, y: 0 },
  'f-user-svc': { x: 1080, y: 0 },
  'f-auth': { x: 820, y: 230 },
  'ep-verify': { x: 820, y: 360 },
}

type GNode = Node<{ node: GraphNode }, 'dep'>

function DepNode({ data, selected }: NodeProps<GNode>) {
  const { node } = data
  const Icon = typeIcon[node.nodeType] ?? Box
  const color = node.issueStatus ? issueColor[node.issueStatus] : undefined
  return (
    <div
      className={`bg-space-850/95 min-w-44 rounded-xl border px-3 py-2.5 text-left shadow-lg ${selected ? 'ring-nebula-400 ring-2' : ''}`}
      style={{
        borderColor: color ?? '#3b3185',
        boxShadow: color ? `0 0 18px -4px ${color}` : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-nebula-400 !border-0"
      />
      <div className="flex items-center gap-2">
        <Icon className="size-4" style={{ color: color ?? '#a78bfa' }} />
        <span className="font-mono text-xs text-white">{node.label}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[10px] tracking-wide text-slate-400 uppercase">
        {node.nodeType}
        {node.issueStatus && (
          <span style={{ color }} className="font-semibold">
            · {node.issueStatus}
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-nebula-400 !border-0"
      />
    </div>
  )
}

const nodeTypes = { dep: DepNode }

export function DependencyGraph({
  graph,
  onSelect,
  minimap = true,
}: {
  graph: Graph
  onSelect?: (node: GraphNode | null) => void
  minimap?: boolean
}) {
  const { nodes, edges } = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]))
    const nodes: GNode[] = graph.nodes.map((n, i) => ({
      id: n.id,
      type: 'dep',
      position: positions[n.id] ?? {
        x: (i % 4) * 260,
        y: Math.floor(i / 4) * 140,
      },
      data: { node: n },
    }))
    const edges: Edge[] = graph.edges.map((e) => {
      const hot =
        byId.get(e.sourceNode)?.issueStatus &&
        byId.get(e.targetNode)?.issueStatus
      const stroke = hot ? '#fb7185' : '#6d5bd0'
      return {
        id: e.id,
        source: e.sourceNode,
        target: e.targetNode,
        label: e.relationship,
        animated: !!hot,
        style: { stroke, strokeWidth: hot ? 2 : 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        labelStyle: { fill: '#a5a1c9', fontSize: 10 },
        labelBgStyle: { fill: '#0d0a26' },
      }
    })
    return { nodes, edges }
  }, [graph])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, n) => onSelect?.((n as GNode).data.node)}
      onPaneClick={() => onSelect?.(null)}
      colorMode="dark"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1}
        color="#3b318566"
      />
      <Controls showInteractive={false} />
      {minimap && (
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            const s = (n as GNode).data.node.issueStatus
            return s ? issueColor[s] : '#3b3185'
          }}
          maskColor="#07051acc"
        />
      )}
    </ReactFlow>
  )
}
