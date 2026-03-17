import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ResearchReport, CompetitorEntry } from './types';

/* ─── Types ───────────────────────────────────────────── */
type EntityType = 'company' | 'product' | 'market' | 'technology' | 'person' | 'metric' | 'event';

interface KGNode {
  id: string;
  label: string;
  type: EntityType;
  color: string;
  size: number;
}

interface KGLink {
  source: string;
  target: string;
  label?: string;
  color: string;
}

/* ─── Color Palette ───────────────────────────────────── */
const typeColors: Record<EntityType, string> = {
  company: '#818cf8',
  product: '#34d399',
  market: '#60a5fa',
  technology: '#f472b6',
  person: '#fbbf24',
  metric: '#fb923c',
  event: '#a78bfa',
};

const typeSizes: Record<EntityType, number> = {
  company: 12,
  product: 8,
  market: 10,
  technology: 8,
  person: 7,
  metric: 6,
  event: 7,
};

/* ─── Extract entities from report ────────────────────── */
function extractEntities(report: ResearchReport) {
  const nodes: KGNode[] = [];
  const links: KGLink[] = [];
  const nodeIds = new Set<string>();

  const addNode = (id: string, label: string, type: EntityType) => {
    if (nodeIds.has(id)) return;
    nodeIds.add(id);
    nodes.push({ id, label, type, color: typeColors[type], size: typeSizes[type] });
  };

  const addLink = (source: string, target: string, label?: string) => {
    if (!nodeIds.has(source) || !nodeIds.has(target)) return;
    links.push({ source, target, label, color: `${typeColors.company}40` });
  };

  // Company profile as central node
  if (report.company_profile?.name) {
    const cp = report.company_profile;
    const companyId = `company-${cp.name}`;
    addNode(companyId, cp.name, 'company');

    if (cp.ceo) {
      const ceoId = `person-${cp.ceo}`;
      addNode(ceoId, cp.ceo, 'person');
      addLink(companyId, ceoId, 'CEO');
    }
    if (cp.industry) {
      const indId = `market-${cp.industry}`;
      addNode(indId, cp.industry, 'market');
      addLink(companyId, indId, 'industry');
    }
    if (cp.market_cap) {
      const mcId = `metric-mcap-${cp.name}`;
      addNode(mcId, `MCap: ${cp.market_cap}`, 'metric');
      addLink(companyId, mcId);
    }

    // Competitors
    report.competitors?.forEach((comp: CompetitorEntry) => {
      const compId = `company-${comp.name}`;
      addNode(compId, comp.name, 'company');
      addLink(companyId, compId, 'competes with');

      if (comp.market_share) {
        const msId = `metric-ms-${comp.name}`;
        addNode(msId, `Share: ${comp.market_share}`, 'metric');
        addLink(compId, msId);
      }
    });

    // Timeline events
    report.timeline?.slice(0, 8).forEach((ev, i) => {
      const evId = `event-${i}`;
      addNode(evId, `${ev.year}: ${ev.title.slice(0, 25)}`, 'event');
      addLink(companyId, evId, ev.category || 'event');
    });
  }

  // Extract technology mentions from key findings
  const techKeywords = ['AI', 'GPU', 'cloud', 'ML', 'API', 'SaaS', 'IoT', 'blockchain', 'quantum', 'LLM', '5G', 'edge'];
  const foundTech = new Set<string>();

  report.key_findings?.forEach((finding) => {
    techKeywords.forEach((kw) => {
      if (finding.toLowerCase().includes(kw.toLowerCase()) && !foundTech.has(kw)) {
        foundTech.add(kw);
        const techId = `tech-${kw}`;
        addNode(techId, kw, 'technology');
        // Link to first company if exists
        const firstCompany = nodes.find((n) => n.type === 'company');
        if (firstCompany) addLink(firstCompany.id, techId, 'uses');
      }
    });
  });

  // Financial metrics as nodes
  report.financial_data?.slice(0, 5).forEach((fm, i) => {
    const fmId = `metric-fin-${i}`;
    addNode(fmId, `${fm.label}: ${fm.value}${fm.unit}`, 'metric');
    const firstCompany = nodes.find((n) => n.type === 'company');
    if (firstCompany) addLink(firstCompany.id, fmId);
  });

  // If no company profile, use the report title as central node
  if (!report.company_profile?.name && nodes.length === 0) {
    addNode('topic', report.title.slice(0, 30), 'market');

    report.key_findings?.slice(0, 6).forEach((finding, i) => {
      const fId = `finding-${i}`;
      addNode(fId, finding.slice(0, 35) + (finding.length > 35 ? '...' : ''), 'product');
      addLink('topic', fId);
    });

    report.agent_results?.forEach((ar) => {
      const arId = `agent-${ar.agent_id}`;
      addNode(arId, ar.agent_name.replace(' Agent', ''), 'technology');
      addLink('topic', arId);
    });
  }

  return { nodes, links };
}

/* ─── Component ───────────────────────────────────────── */
interface Props {
  report: ResearchReport;
}

export const KnowledgeGraph: React.FC<Props> = ({ report }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<{ d3ReheatSimulation?: () => void }>(null);

  const graphData = useMemo(() => extractEntities(report), [report]);

  // Theme-aware label color for canvas rendering
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const labelColor = isDark ? '#e2e8f0' : '#374151';
  const edgeLabelColor = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    const t = setTimeout(() => fgRef.current?.d3ReheatSimulation?.(), 300);
    return () => clearTimeout(t);
  }, [graphData]);

  const nodeCanvasObject = useCallback(
    (node: KGNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const r = node.size;

      // Glow for company nodes
      if (node.type === 'company') {
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, 2 * Math.PI);
        ctx.fillStyle = `${node.color}20`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (node.type === 'company') {
        ctx.strokeStyle = isDark ? '#e0e7ff' : '#6366f1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label — scale by DPI for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      const fontSize = (node.type === 'company' ? 10 : 8) / Math.max(dpr * 0.5, 1);
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = labelColor;
      ctx.fillText(node.label, x, y + r + 3);
    },
    [labelColor, isDark],
  );

  // Edge labels
  const linkCanvasObject = useCallback(
    (link: KGLink & { source: { x?: number; y?: number }; target: { x?: number; y?: number } }, ctx: CanvasRenderingContext2D) => {
      if (!link.label) return;
      const sx = link.source.x ?? 0;
      const sy = link.source.y ?? 0;
      const tx = link.target.x ?? 0;
      const ty = link.target.y ?? 0;
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;

      ctx.font = '5px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = edgeLabelColor;
      ctx.fillText(link.label, mx, my - 4);
    },
    [edgeLabelColor],
  );

  const legendItems: { type: EntityType; label: string }[] = [
    { type: 'company', label: 'Company' },
    { type: 'product', label: 'Product' },
    { type: 'market', label: 'Market' },
    { type: 'technology', label: 'Technology' },
    { type: 'person', label: 'Person' },
    { type: 'metric', label: 'Metric' },
    { type: 'event', label: 'Event' },
  ];

  // Only show legend items for types present in graph
  const presentTypes = new Set(graphData.nodes.map((n) => n.type));
  const visibleLegend = legendItems.filter((l) => presentTypes.has(l.type));

  return (
    <div ref={containerRef} className="w-full h-[420px] rounded-xl overflow-hidden bg-graph-container border border-medium-contrast/30 relative">
      <ForceGraph2D
        ref={fgRef as React.MutableRefObject<never>}
        graphData={graphData}
        width={containerRef.current?.clientWidth || 600}
        height={420}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject as never}
        nodePointerAreaPaint={(node: KGNode & { x?: number; y?: number }, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, node.size + 4, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={linkCanvasObject as never}
        linkColor={(link: KGLink) => link.color}
        linkWidth={1.2}
        d3AlphaDecay={0.035}
        d3VelocityDecay={0.35}
        warmupTicks={100}
        cooldownTicks={100}
        minZoom={0.5}
        maxZoom={5}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-3 px-2 py-1.5 bg-white/80 dark:bg-gray-900/80 rounded-lg text-[10px] text-medium-contrast backdrop-blur-sm">
        {visibleLegend.map((item) => (
          <span key={item.type} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors[item.type] }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};
