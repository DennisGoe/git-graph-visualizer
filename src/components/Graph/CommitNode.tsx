import { motion } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../../store';
import { selectCommit, hoverCommit } from '../../store/uiSlice';
import type { GitCommit, LayoutNode } from '../../types/git';

interface Props {
  commit: GitCommit;
  node: LayoutNode;
  color: string;
  isHead: boolean;
}

export default function CommitNode({ commit, node, color, isHead }: Props) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.ui.selectedCommitId);
  const hoveredId = useAppSelector((s) => s.ui.hoveredCommitId);
  const isSelected = selectedId === commit.id;
  const isHovered = hoveredId === commit.id;

  const tags = useAppSelector((s) =>
    Object.values(s.git.tags).filter((t) => t.commitId === commit.id),
  );
  const branchHeads = useAppSelector((s) =>
    Object.values(s.git.branches).filter(
      (b) => b.headCommitId === commit.id,
    ),
  );

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ cursor: 'pointer' }}
      onClick={() =>
        dispatch(selectCommit(isSelected ? null : commit.id))
      }
      onMouseEnter={() => dispatch(hoverCommit(commit.id))}
      onMouseLeave={() => dispatch(hoverCommit(null))}
    >
      {/* Glow effect on hover/select */}
      {(isHovered || isSelected) && (
        <circle
          cx={node.x}
          cy={node.y}
          r={18}
          fill={color}
          opacity={0.15}
        />
      )}

      {/* HEAD indicator */}
      {isHead && (
        <circle
          cx={node.x}
          cy={node.y}
          r={16}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.6}
        />
      )}

      {/* Main commit circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={10}
        fill={commit.parentIds.length > 1 ? color : '#0d1117'}
        stroke={color}
        strokeWidth={3}
      />

      {/* Hash label */}
      <text
        x={node.x + 20}
        y={node.y - 8}
        fill="#8b949e"
        fontSize={11}
        fontFamily="monospace"
      >
        {commit.hash}
      </text>

      {/* Commit message */}
      <text
        x={node.x + 20}
        y={node.y + 8}
        fill="#e6edf3"
        fontSize={12}
        fontFamily="monospace"
        fontWeight={isHead ? 600 : 400}
      >
        {commit.message.length > 40
          ? commit.message.slice(0, 40) + '...'
          : commit.message}
      </text>

      {/* Branch labels */}
      {branchHeads.map((branch, i) => (
        <g key={branch.name}>
          <rect
            x={node.x + 20 + i * 90}
            y={node.y + 14}
            width={branch.name.length * 8 + 12}
            height={18}
            rx={4}
            fill={branch.color}
            opacity={0.2}
          />
          <text
            x={node.x + 26 + i * 90}
            y={node.y + 27}
            fill={branch.color}
            fontSize={10}
            fontFamily="monospace"
            fontWeight={600}
          >
            {branch.name}
          </text>
        </g>
      ))}

      {/* Tag labels */}
      {tags.map((t, i) => (
        <g key={t.name}>
          <rect
            x={node.x + 20 + branchHeads.length * 90 + i * 80}
            y={node.y + 14}
            width={t.name.length * 8 + 16}
            height={18}
            rx={4}
            fill="#d29922"
            opacity={0.2}
          />
          <text
            x={node.x + 28 + branchHeads.length * 90 + i * 80}
            y={node.y + 27}
            fill="#d29922"
            fontSize={10}
            fontFamily="monospace"
          >
            {'#' + t.name}
          </text>
        </g>
      ))}
    </motion.g>
  );
}
