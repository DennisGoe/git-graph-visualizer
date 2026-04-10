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

  return (
    <motion.path
      d={pathD}
      fill="none"
      stroke={color}
      strokeWidth={edge.type === 'merge' ? 2 : 2.5}
      strokeDasharray={edge.type === 'merge' ? '6 3' : undefined}
      opacity={edge.type === 'merge' ? 0.6 : 0.8}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: edge.type === 'merge' ? 0.6 : 0.8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    />
  );
}
