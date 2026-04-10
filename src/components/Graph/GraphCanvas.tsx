import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '../../store';
import { computeGraphLayout } from '../../utils/graphLayout';
import CommitNode from './CommitNode';
import EdgeLine from './EdgeLine';

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

export default function GraphCanvas() {
  const commits = useAppSelector((s) => s.git.commits);
  const commitOrder = useAppSelector((s) => s.git.commitOrder);
  const branches = useAppSelector((s) => s.git.branches);
  const tags = useAppSelector((s) => s.git.tags);
  const head = useAppSelector((s) => s.git.head);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const layout = useMemo(
    () => computeGraphLayout(commits, commitOrder, branches),
    [commits, commitOrder, branches],
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, (typeof layout.nodes)[0]>();
    for (const node of layout.nodes) map.set(node.id, node);
    return map;
  }, [layout.nodes]);

  const commitRefs = useMemo(() => {
    const map: Record<string, { branches: string[]; tags: string[] }> = {};
    for (const id of commitOrder) {
      const branchLabels = Object.values(branches)
        .filter((b) => b.headCommitId === id)
        .map((b) => b.name);
      const tagLabels = Object.values(tags)
        .filter((t) => t.commitId === id)
        .map((t) => t.name);
      if (branchLabels.length || tagLabels.length) {
        map[id] = { branches: branchLabels, tags: tagLabels };
      }
    }
    return map;
  }, [commitOrder, branches, tags]);

  const svgWidth = Math.max(layout.width, 1200);
  const svgHeight = Math.max(layout.height, 600);

  // Center graph on mount and when layout changes
  const hasCentered = useRef(false);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Small delay to ensure container has its final dimensions
    requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      const centerX = (rect.width - layout.width) / 2;
      const centerY = (rect.height - layout.height) / 2;
      setPan({ x: Math.max(centerX, 40), y: Math.max(centerY, 40) });
      hasCentered.current = true;
    });
  }, [layout.width, layout.height]);

  // --- Mouse drag to pan ---
  const [cursorStyle, setCursorStyle] = useState<'grab' | 'grabbing'>('grab');

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { x: pan.x, y: pan.y };
      setCursorStyle('grabbing');
    },
    [pan],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setCursorStyle('grab');
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
    setCursorStyle('grab');
  }, []);

  // --- Scroll wheel to zoom ---
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      // Mouse position relative to container
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Point in SVG-space under the cursor before zoom
      const svgX = (mx - pan.x) / zoom;
      const svgY = (my - pan.y) / zoom;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));

      // Adjust pan so the point under cursor stays fixed
      const newPanX = mx - svgX * newZoom;
      const newPanY = my - svgY * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [pan, zoom],
  );

  // --- Reset view (centered) ---
  const handleResetView = useCallback(() => {
    const container = containerRef.current;
    if (!container) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    const rect = container.getBoundingClientRect();
    const centerX = (rect.width - layout.width) / 2;
    const centerY = (rect.height - layout.height) / 2;
    setPan({ x: Math.max(centerX, 40), y: Math.max(centerY, 40) });
    setZoom(1);
  }, [layout.width, layout.height]);

  // --- Fit to screen ---
  const handleFitView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padded = 60;
    const scaleX = (rect.width - padded) / svgWidth;
    const scaleY = (rect.height - padded) / svgHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_ZOOM), MAX_ZOOM);
    const newPanX = (rect.width - svgWidth * newZoom) / 2;
    const newPanY = (rect.height - svgHeight * newZoom) / 2;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [svgWidth, svgHeight]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-hidden bg-bg-primary relative"
      style={{ cursor: cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      {/* Fixed dot grid background that fills the entire viewport */}
      <svg
        className="absolute inset-0"
        width="100%"
        height="100%"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="dot-grid-bg" width={20} height={20} patternUnits="userSpaceOnUse">
            <circle cx={10} cy={10} r={1} fill="#333" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid-bg)" />
      </svg>

      {/* Graph SVG that moves with pan/zoom */}
      <svg
        width={svgWidth}
        height={svgHeight}
        className="block relative"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >

        {/* Edges */}
        <g>
          {layout.edges.map((edge) => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            const branchColor =
              edge.type === 'merge'
                ? branches[edge.sourceBranch]?.color || '#8b8b8b'
                : branches[commits[edge.target]?.branch]?.color || '#8b8b8b';

            return (
              <EdgeLine
                key={`${edge.source}-${edge.target}`}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                color={branchColor}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {layout.nodes.map((node) => {
            const commit = commits[node.id];
            if (!commit) return null;
            const branchColor =
              branches[commit.branch]?.color || '#8b8b8b';
            const refs = commitRefs[node.id];

            return (
              <CommitNode
                key={node.id}
                commit={commit}
                node={node}
                color={branchColor}
                isHead={commit.id === head}
                refBranches={refs?.branches}
                refTags={refs?.tags}
                branches={branches}
              />
            );
          })}
        </g>
      </svg>

      {/* Controls overlay — bottom left */}
      <div
        className="absolute flex items-center gap-1 rounded-xl border"
        style={{
          bottom: 16,
          left: 16,
          backgroundColor: '#232323ee',
          borderColor: '#3d3d3d',
          padding: '6px 8px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
          className="text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary"
          style={{ padding: '4px 8px', fontSize: 14 }}
          title="Zoom in"
        >
          +
        </button>

        <button
          onClick={handleResetView}
          className="text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary font-mono"
          style={{ padding: '4px 8px', fontSize: 11, minWidth: 44, textAlign: 'center' }}
          title="Reset zoom"
        >
          {zoomPercent}%
        </button>

        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
          className="text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary"
          style={{ padding: '4px 8px', fontSize: 14 }}
          title="Zoom out"
        >
          −
        </button>

        <div style={{ width: 1, height: 18, backgroundColor: '#3d3d3d', margin: '0 4px' }} />

        <button
          onClick={handleFitView}
          className="text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary"
          style={{ padding: '4px 8px' }}
          title="Fit to screen"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6V2h4" />
            <path d="M14 6V2h-4" />
            <path d="M2 10v4h4" />
            <path d="M14 10v4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
