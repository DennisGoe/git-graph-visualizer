import { useAppSelector } from '../../store';

export default function BranchList() {
  const branches = useAppSelector((s) => s.git.branches);
  const currentBranch = useAppSelector((s) => s.git.currentBranch);
  const commits = useAppSelector((s) => s.git.commits);

  return (
    <div style={{ padding: '20px 24px' }}>
      <h3
        className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
        style={{ marginBottom: 14 }}
      >
        Branches
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.values(branches).map((branch) => {
          const headCommit = commits[branch.headCommitId];
          const isCurrent = branch.name === currentBranch;

          return (
            <div
              key={branch.name}
              className="flex items-center gap-3 rounded-xl text-sm transition-colors"
              style={{
                padding: '10px 14px',
                backgroundColor: isCurrent ? '#2d2d2d' : 'transparent',
                border: isCurrent ? '1px solid #3d3d3d' : '1px solid transparent',
              }}
            >
              <div
                className="shrink-0 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: branch.color,
                  boxShadow: isCurrent ? `0 0 6px ${branch.color}40` : 'none',
                }}
              />
              <span
                className="truncate"
                style={{
                  color: isCurrent ? branch.color : '#8b8b8b',
                  fontWeight: isCurrent ? 600 : 400,
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
