import { memo, useRef } from 'react';
import { motion } from 'motion/react';
import type { LayoutNode, LayoutEdge } from '../../types/git';
import { buildEdgePath } from '../../utils/graphLayout';

interface Props {
  edge: LayoutEdge;
  sourceNode: LayoutNode;
  targetNode: LayoutNode;
  color: string;
  shouldAnimate: boolean;
  dimmed: boolean;
}

const EdgeLine = memo(function EdgeLine({ edge, sourceNode, targetNode, color, shouldAnimate, dimmed }: Props) {
  const pathD = buildEdgePath(sourceNode, targetNode);
  const isMerge = edge.type === 'merge';
  const baseOpacity = isMerge ? 0.6 : 0.85;
  const opacity = dimmed ? 0.08 : baseOpacity;

  // Capture initial value so an in-flight animation isn't cut short
  // when shouldAnimate flips to false on the next render.
  const animateOnMount = useRef(shouldAnimate);

  const markerEnd = isMerge ? 'url(#merge-arrow)' : undefined;

  return (
    <g>
      {animateOnMount.current ? (
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={isMerge ? '6 3' : undefined}
          markerEnd={markerEnd}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      ) : (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={isMerge ? '6 3' : undefined}
          markerEnd={markerEnd}
          opacity={opacity}
        />
      )}
    </g>
  );
});

export default EdgeLine;
