import { memo } from 'react';
import { motion } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../../store';
import { selectCommit, hoverCommit } from '../../store/uiSlice';
import { CARD_H } from '../../utils/graphLayout';
import type { GitCommit, GitBranch, LayoutNode } from '../../types/git';

const CARD_W = 160;

interface Props {
  commit: GitCommit;
  node: LayoutNode;
  color: string;
  isHead: boolean;
  refBranches?: string[];
  refTags?: string[];
  branches: Record<string, GitBranch>;
  shouldAnimate: boolean;
}

const CommitNode = memo(function CommitNode({
  commit,
  node,
  color,
  isHead,
  refBranches,
  refTags,
  branches,
  shouldAnimate,
}: Props) {
  const dispatch = useAppDispatch();
  // Return booleans so only the affected node re-renders on hover/select
  const isSelected = useAppSelector((s) => s.ui.selectedCommitId === commit.id);
  const isHovered = useAppSelector((s) => s.ui.hoveredCommitId === commit.id);
  const dimmed = useAppSelector(
    (s) => s.ui.selectedBranchName !== null && commit.branch !== s.ui.selectedBranchName,
  );

  const isMerge = commit.parentIds.length > 1;

  const cardX = node.x - CARD_W / 2;
  const cardY = node.y - CARD_H / 2;

  const borderColor = isSelected
    ? '#ff6d5a'
    : isHovered
      ? '#555555'
      : isHead
        ? '#555555'
        : '#3d3d3d';

  const hasLabels = (refBranches && refBranches.length > 0) || (refTags && refTags.length > 0);

  return (
    <motion.g
      initial={shouldAnimate ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: dimmed ? 0.15 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{ cursor: 'pointer' }}
      onClick={() =>
        dispatch(selectCommit(isSelected ? null : commit.id))
      }
      onMouseEnter={() => dispatch(hoverCommit(commit.id))}
      onMouseLeave={() => dispatch(hoverCommit(null))}
    >
      {/* Labels (branch/tag pills) above the card */}
      {hasLabels && (
        <foreignObject
          x={cardX}
          y={cardY - 24}
          width={CARD_W}
          height={22}
          overflow="visible"
        >
          <div
            style={{
              display: 'flex',
              gap: '4px',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            {refBranches?.map((name) => (
              <span
                key={name}
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  padding: '2px 6px',
                  borderRadius: '8px',
                  color: branches[name]?.color || color,
                  backgroundColor: (branches[name]?.color || color) + '25',
                  whiteSpace: 'nowrap',
                  lineHeight: '14px',
                }}
              >
                {name}
              </span>
            ))}
            {refTags?.map((name) => (
              <span
                key={name}
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  padding: '2px 6px',
                  borderRadius: '8px',
                  color: '#ff6d5a',
                  backgroundColor: '#ff6d5a25',
                  whiteSpace: 'nowrap',
                  lineHeight: '14px',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </foreignObject>
      )}

      {/* Glow ring when selected */}
      {isSelected && (
        <rect
          x={cardX - 3}
          y={cardY - 3}
          width={CARD_W + 6}
          height={CARD_H + 6}
          rx={11}
          ry={11}
          fill="none"
          stroke="#ff6d5a"
          strokeWidth={1}
          opacity={0.35}
        />
      )}

      {/* HEAD glow ring */}
      {isHead && !isSelected && (
        <rect
          x={cardX - 2}
          y={cardY - 2}
          width={CARD_W + 4}
          height={CARD_H + 4}
          rx={10}
          ry={10}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.5}
        />
      )}

      {/* Card body via foreignObject */}
      <foreignObject x={cardX} y={cardY} width={CARD_W} height={CARD_H}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#2d2d2d',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 12px',
            boxShadow: isHovered || isSelected
              ? '0 4px 12px rgba(0,0,0,0.4)'
              : '0 2px 6px rgba(0,0,0,0.2)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            overflow: 'hidden',
          }}
        >
          {/* Branch color dot */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isMerge ? color : 'transparent',
              border: isMerge ? 'none' : `2px solid ${color}`,
              flexShrink: 0,
            }}
          />

          {/* Text content */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: '#8b8b8b',
                lineHeight: '14px',
              }}
            >
              {commit.hash}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: "'Inter', system-ui, sans-serif",
                color: '#ffffff',
                lineHeight: '16px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {commit.message}
            </span>
          </div>
        </div>
      </foreignObject>

      {/* Connector dot: top-center */}
      <circle
        cx={node.x}
        cy={cardY}
        r={4}
        fill="#2d2d2d"
        stroke={borderColor}
        strokeWidth={1.5}
      />

      {/* Connector dot: bottom-center */}
      <circle
        cx={node.x}
        cy={cardY + CARD_H}
        r={4}
        fill="#2d2d2d"
        stroke={borderColor}
        strokeWidth={1.5}
      />
    </motion.g>
  );
});

export default CommitNode;
