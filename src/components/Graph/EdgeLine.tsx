import { motion } from 'motion/react';
import type { LayoutNode, LayoutEdge } from '../../types/git';
import { buildEdgePath } from '../../utils/graphLayout';

interface Props {
  edge: LayoutEdge;
  sourceNode: LayoutNode;
  targetNode: LayoutNode;
  color: string;
}

export default function EdgeLine({ edge, sourceNode, targetNode, color }: Props) {
  const pathD = buildEdgePath(sourceNode, targetNode);
  const isMerge = edge.type === 'merge';

  return (
    <g>
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={isMerge ? '6 3' : undefined}
        opacity={isMerge ? 0.5 : 0.7}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: isMerge ? 0.5 : 0.7 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      {/* Connector dot at source */}
      <circle
        cx={sourceNode.x}
        cy={sourceNode.y}
        r={3.5}
        fill={color}
        opacity={isMerge ? 0.5 : 0.7}
      />
      {/* Connector dot at target */}
      <circle
        cx={targetNode.x}
        cy={targetNode.y}
        r={3.5}
        fill={color}
        opacity={isMerge ? 0.5 : 0.7}
      />
    </g>
  );
}
