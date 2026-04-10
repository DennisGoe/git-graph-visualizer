import { useMemo } from 'react';
import { useAppSelector } from '../../store';
import { computeGraphLayout } from '../../utils/graphLayout';
import CommitNode from './CommitNode';
import EdgeLine from './EdgeLine';

export default function GraphCanvas() {
  const commits = useAppSelector((s) => s.git.commits);
  const commitOrder = useAppSelector((s) => s.git.commitOrder);
  const branches = useAppSelector((s) => s.git.branches);
  const head = useAppSelector((s) => s.git.head);

  const layout = useMemo(
    () => computeGraphLayout(commits, commitOrder, branches),
    [commits, commitOrder, branches],
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, (typeof layout.nodes)[0]>();
    for (const node of layout.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [layout.nodes]);

  return (
    <div className="flex-1 overflow-auto bg-bg-primary">
      <svg
        width={Math.max(layout.width + 400, 800)}
        height={Math.max(layout.height, 400)}
        className="min-w-full"
      >
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width={70}
            height={70}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 70 0 L 0 0 0 70"
              fill="none"
              stroke="#21262d"
              strokeWidth={0.5}
              opacity={0.4}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Edges */}
        <g>
          {layout.edges.map((edge) => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            const commit = commits[edge.target];
            const branchColor =
              branches[commit?.branch]?.color || '#8b949e';

            return (
              <EdgeLine
                key={`${edge.source}-${edge.target}`}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                color={edge.type === 'merge' ? '#8b949e' : branchColor}
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
              branches[commit.branch]?.color || '#8b949e';

            return (
              <CommitNode
                key={node.id}
                commit={commit}
                node={node}
                color={branchColor}
                isHead={commit.id === head}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
