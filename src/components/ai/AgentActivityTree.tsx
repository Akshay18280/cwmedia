import React, { useMemo } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Position,
  MarkerType,
  Background,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { ResearchReport, AgentResult } from './types';
import { CheckCircle2, XCircle, Clock, Brain, Search, FileText, ShieldCheck, Sparkles } from 'lucide-react';

/* ─── Custom Node ─────────────────────────────────────── */
interface AgentNodeData {
  label: string;
  status: 'completed' | 'failed' | 'running' | 'idle';
  duration_ms?: number;
  sources?: number;
  facts?: number;
  icon: 'brain' | 'search' | 'file' | 'shield' | 'sparkles';
}

const iconMap = {
  brain: Brain,
  search: Search,
  file: FileText,
  shield: ShieldCheck,
  sparkles: Sparkles,
};

const statusColors: Record<string, string> = {
  completed: 'border-emerald-500/60 bg-emerald-500/5',
  failed: 'border-red-500/60 bg-red-500/5',
  running: 'border-amber-500/60 bg-amber-500/5',
  idle: 'border-gray-500/40 bg-gray-500/5',
};

const AgentNode: React.FC<{ data: AgentNodeData }> = ({ data }) => {
  const Icon = iconMap[data.icon] || Brain;
  const StatusIcon = data.status === 'completed' ? CheckCircle2 : data.status === 'failed' ? XCircle : Clock;
  const statusIconColor = data.status === 'completed' ? 'text-emerald-400' : data.status === 'failed' ? 'text-red-400' : 'text-amber-400';

  return (
    <div className={`rounded-lg border ${statusColors[data.status]} px-3 py-2 min-w-[160px] backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs font-semibold text-high-contrast">{data.label}</span>
        <StatusIcon className={`w-3.5 h-3.5 ml-auto ${statusIconColor}`} />
      </div>
      <div className="flex items-center gap-3 text-[10px] text-medium-contrast">
        {data.duration_ms !== undefined && (
          <span>{(data.duration_ms / 1000).toFixed(1)}s</span>
        )}
        {data.sources !== undefined && data.sources > 0 && (
          <span>{data.sources} sources</span>
        )}
        {data.facts !== undefined && data.facts > 0 && (
          <span>{data.facts} facts</span>
        )}
      </div>
    </div>
  );
};

const nodeTypes = { agentNode: AgentNode };

/* ─── Layout helpers ──────────────────────────────────── */
const agentIconMap: Record<string, AgentNodeData['icon']> = {
  overview: 'brain',
  market: 'search',
  technical: 'file',
  news: 'sparkles',
  competitor: 'search',
  risks: 'shield',
  strategic: 'shield',
  trends: 'sparkles',
};

function getAgentIcon(name: string): AgentNodeData['icon'] {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(agentIconMap)) {
    if (lower.includes(key)) return icon;
  }
  return 'brain';
}

/* ─── Build Flow Graph ────────────────────────────────── */
function buildFlowGraph(report: ResearchReport) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Root: Research Query
  nodes.push({
    id: 'root',
    type: 'agentNode',
    position: { x: 250, y: 0 },
    data: {
      label: 'Research Query',
      status: 'completed',
      duration_ms: report.metrics.total_ms,
      icon: 'sparkles',
    } satisfies AgentNodeData,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });

  // Planner node
  nodes.push({
    id: 'planner',
    type: 'agentNode',
    position: { x: 250, y: 90 },
    data: {
      label: 'Planner',
      status: 'completed',
      duration_ms: report.metrics.planning_ms,
      icon: 'brain',
    } satisfies AgentNodeData,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });
  edges.push({
    id: 'root-planner',
    source: 'root',
    target: 'planner',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
    style: { stroke: '#6366f180' },
  });

  // Agent nodes — spread horizontally
  const agents = report.agent_results;
  const totalWidth = Math.max(agents.length * 190, 400);
  const startX = 250 - totalWidth / 2 + 95;

  agents.forEach((ar: AgentResult, i: number) => {
    const agentId = `agent-${ar.agent_id}`;
    nodes.push({
      id: agentId,
      type: 'agentNode',
      position: { x: startX + i * 190, y: 200 },
      data: {
        label: ar.agent_name.replace(' Agent', ''),
        status: ar.status,
        duration_ms: ar.duration_ms,
        sources: ar.sources?.length,
        facts: ar.facts?.length,
        icon: getAgentIcon(ar.agent_name),
      } satisfies AgentNodeData,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });
    edges.push({
      id: `planner-${agentId}`,
      source: 'planner',
      target: agentId,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#34d399' },
      style: { stroke: '#34d39960' },
    });
  });

  // Verification node
  nodes.push({
    id: 'verification',
    type: 'agentNode',
    position: { x: 150, y: 320 },
    data: {
      label: 'Verification',
      status: report.verification ? 'completed' : 'idle',
      duration_ms: report.metrics.verification_ms,
      facts: report.verification?.verified_facts?.length,
      icon: 'shield',
    } satisfies AgentNodeData,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });

  // Synthesis node
  nodes.push({
    id: 'synthesis',
    type: 'agentNode',
    position: { x: 350, y: 320 },
    data: {
      label: 'Synthesis',
      status: 'completed',
      duration_ms: report.metrics.synthesis_ms,
      icon: 'sparkles',
    } satisfies AgentNodeData,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });

  // Connect each agent to verification and synthesis
  agents.forEach((ar: AgentResult) => {
    const agentId = `agent-${ar.agent_id}`;
    edges.push({
      id: `${agentId}-verification`,
      source: agentId,
      target: 'verification',
      style: { stroke: '#f59e0b40' },
    });
    edges.push({
      id: `${agentId}-synthesis`,
      source: agentId,
      target: 'synthesis',
      style: { stroke: '#818cf840' },
    });
  });

  // Final report
  nodes.push({
    id: 'report',
    type: 'agentNode',
    position: { x: 250, y: 430 },
    data: {
      label: 'Final Report',
      status: 'completed',
      icon: 'file',
    } satisfies AgentNodeData,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });
  edges.push({
    id: 'verification-report',
    source: 'verification',
    target: 'report',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
    style: { stroke: '#818cf860' },
  });
  edges.push({
    id: 'synthesis-report',
    source: 'synthesis',
    target: 'report',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
    style: { stroke: '#818cf860' },
  });

  return { nodes, edges };
}

/* ─── Component ───────────────────────────────────────── */

interface Props {
  report: ResearchReport;
}

export const AgentActivityTree: React.FC<Props> = ({ report }) => {
  const { nodes, edges } = useMemo(() => buildFlowGraph(report), [report]);

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-medium-contrast/30 bg-graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="var(--reactflow-bg-dots, #cbd5e1)" gap={20} size={1} className="dark:[--reactflow-bg-dots:#334155] [--reactflow-bg-dots:#cbd5e1]" />
        <Controls
          showInteractive={false}
          className="!bg-white/80 dark:!bg-gray-800/80 !border-gray-300 dark:!border-gray-700 !rounded-lg [&>button]:!bg-white dark:[&>button]:!bg-gray-800 [&>button]:!border-gray-300 dark:[&>button]:!border-gray-700 [&>button]:!text-gray-600 dark:[&>button]:!text-gray-300 [&>button:hover]:!bg-gray-100 dark:[&>button:hover]:!bg-gray-700"
        />
      </ReactFlow>
    </div>
  );
};
