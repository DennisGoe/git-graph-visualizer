import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { selectBranch } from '../../store/uiSlice';

const STALE_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

type Filter = 'active' | 'stale';

export default function BranchList() {
  const branches = useAppSelector((s) => s.git.branches);
  const currentBranch = useAppSelector((s) => s.git.currentBranch);
  const commits = useAppSelector((s) => s.git.commits);
  const selectedBranch = useAppSelector((s) => s.ui.selectedBranchName);
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<Filter>('active');

  // Classify branches as active or stale based on head commit age
  const { activeBranches, staleBranches } = useMemo(() => {
    const allBranches = Object.values(branches);
    const newestTs = Math.max(
      ...allBranches.map((b) => commits[b.headCommitId]?.timestamp ?? 0),
    );

    const active: typeof allBranches = [];
    const stale: typeof allBranches = [];

    for (const branch of allBranches) {
      const ts = commits[branch.headCommitId]?.timestamp ?? 0;
      if (newestTs - ts > STALE_THRESHOLD_MS) {
        stale.push(branch);
      } else {
        active.push(branch);
      }
    }

    return { activeBranches: active, staleBranches: stale };
  }, [branches, commits]);

  const filteredBranches = filter === 'active' ? activeBranches : staleBranches;

  return (
    <div style={{ padding: '20px 24px' }}>
      <h3
        className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
        style={{ marginBottom: 14 }}
      >
        Branches
      </h3>

      {/* Filter tabs */}
      <div
        className="flex rounded-lg"
        style={{
          backgroundColor: '#1b1b1b',
          border: '1px solid #3d3d3d',
          padding: 3,
          marginBottom: 12,
        }}
      >
        {(['active', 'stale'] as const).map((f) => {
          const count = f === 'active' ? activeBranches.length : staleBranches.length;
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-colors"
              style={{
                padding: '5px 8px',
                backgroundColor: isActive ? '#2d2d2d' : 'transparent',
                color: isActive ? '#e0e0e0' : '#8b8b8b',
                border: isActive ? '1px solid #3d3d3d' : '1px solid transparent',
              }}
            >
              <span style={{ textTransform: 'capitalize' }}>{f}</span>
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: isActive ? '#aaa' : '#666',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredBranches.length === 0 && (
          <p className="text-xs text-text-secondary" style={{ padding: '10px 14px', opacity: 0.6 }}>
            No {filter} branches
          </p>
        )}
        {filteredBranches.map((branch) => {
          const headCommit = commits[branch.headCommitId];
          const isCurrent = branch.name === currentBranch;
          const isSelected = branch.name === selectedBranch;

          return (
            <div
              key={branch.name}
              className="flex items-center gap-3 rounded-xl text-sm transition-colors"
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? branch.color + '12'
                  : isCurrent
                    ? '#2d2d2d'
                    : 'transparent',
                border: isSelected
                  ? `1px solid ${branch.color}40`
                  : isCurrent
                    ? '1px solid #3d3d3d'
                    : '1px solid transparent',
              }}
              onClick={() => dispatch(selectBranch(branch.name))}
            >
              <div
                className="shrink-0 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: branch.color,
                  boxShadow:
                    isSelected || isCurrent
                      ? `0 0 6px ${branch.color}40`
                      : 'none',
                }}
              />
              <span
                className="truncate"
                style={{
                  color: isSelected || isCurrent ? branch.color : '#8b8b8b',
                  fontWeight: isSelected || isCurrent ? 600 : 400,
                  flex: 1,
                }}
              >
                {branch.name}
              </span>
              {isCurrent && (
                <span
                  className="shrink-0 text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    color: '#10b981',
                    backgroundColor: '#10b98118',
                    padding: '2px 7px',
                    borderRadius: 6,
                  }}
                >
                  HEAD
                </span>
              )}
              {headCommit && (
                <code className="shrink-0 text-[10px] text-text-secondary font-mono">
                  {headCommit.hash}
                </code>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
