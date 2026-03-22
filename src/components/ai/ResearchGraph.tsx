import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ResearchReport, AgentResult } from './types';

interface GraphNode {
  id: string;
  label: string;
  type: 'query' | 'agent' | 'source' | 'finding';
  status?: 'completed' | 'failed';
  color: string;
  size: number;
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
  color: string;
}

interface Props {
  report: ResearchReport;
}

function buildGraph(report: ResearchReport) {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Central query node
  nodes.push({
    id: 'query',
    label: report.title.length > 40 ? report.title.slice(0, 37) + '...' : report.title,
    type: 'query',
    color: '#818cf8',
    size: 14,
  });

  // Agent nodes
  report.agent_results.forEach((ar: AgentResult) => {
    const agentId = `agent-${ar.agent_id}`;
    nodes.push({
      id: agentId,
      label: ar.agent_name.replace(' Agent', ''),
      type: 'agent',
      status: ar.status,
      color: ar.status === 'completed' ? '#34d399' : '#f87171',
      size: 10,
    });
    links.push({ source: 'query', target: agentId, color: '#6366f180' });

    // Source nodes (max 3 per agent)
    const sources = ar.sources?.slice(0, 3) || [];
    sources.forEach((src, i) => {
      const srcId = `${agentId}-src-${i}`;
      nodes.push({
        id: srcId,
        label: src.title.length > 30 ? src.title.slice(0, 27) + '...' : src.title,
        type: 'source',
        color: '#60a5fa',
        size: 6,
      });
      links.push({ source: agentId, target: srcId, color: '#3b82f640' });
    });

    // Fact nodes (max 2 per agent)
    const facts = ar.facts?.slice(0, 2) || [];
    facts.forEach((fact, i) => {
      const factId = `${agentId}-fact-${i}`;
      nodes.push({
        id: factId,
        label: fact.claim.length > 35 ? fact.claim.slice(0, 32) + '...' : fact.claim,
        type: 'finding',
        color: '#fbbf24',
        size: 5,
      });
      links.push({ source: agentId, target: factId, color: '#f59e0b40' });
    });
  });

  return { nodes, links };
}

export const ResearchGraph: React.FC<Props> = ({ report }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<{ d3ReheatSimulation?: () => void }>(null);

  const graphData = useMemo(() => buildGraph(report), [report]);

  // Theme-aware label color for canvas rendering
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const labelColor = isDark ? '#e2e8f0' : '#374151';

  useEffect(() => {
    // Let the simulation settle
    const t = setTimeout(() => fgRef.current?.d3ReheatSimulation?.(), 300);
    return () => clearTimeout(t);
  }, [graphData]);

  const nodeCanvasObject = useCallback(
    (node: GraphNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const r = node.size;

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (node.type === 'query') {
        ctx.strokeStyle = isDark ? '#c7d2fe' : '#6366f1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label — scale by DPI for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      const fontSize = (node.type === 'query' ? 11 : node.type === 'agent' ? 9 : 7) / Math.max(dpr * 0.5, 1);
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = labelColor;
      ctx.fillText(node.label, x, y + r + 3);
    },
    [labelColor, isDark],
  );

  return (
    <div ref={containerRef} className="w-full h-[400px] rounded-xl overflow-hidden bg-graph-container border border-medium-contrast/30">
      <ForceGraph2D
        ref={fgRef as React.MutableRefObject<never>}
        graphData={graphData}
        width={containerRef.current?.clientWidth || 600}
        height={400}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject as never}
        nodePointerAreaPaint={(node: GraphNode & { x?: number; y?: number }, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, node.size + 4, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={(link: GraphLink) => link.color}
        linkWidth={1.5}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={0.85}
        d3AlphaDecay={0.04}
        d3VelocityDecay={0.3}
        warmupTicks={80}
        cooldownTicks={80}
        minZoom={0.5}
        maxZoom={5}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2 text-[10px] text-medium-contrast -mt-10 relative z-10">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Query</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Agent</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Source</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Finding</span>
      </div>
    </div>
  );
};
