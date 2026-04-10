import { useAppSelector } from '../../store';

export default function BranchList() {
  const branches = useAppSelector((s) => s.git.branches);
  const currentBranch = useAppSelector((s) => s.git.currentBranch);
  const commits = useAppSelector((s) => s.git.commits);

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">Branches</h3>

      <div className="space-y-1">
        {Object.values(branches).map((branch) => {
          const headCommit = commits[branch.headCommitId];
          const isCurrent = branch.name === currentBranch;

          return (
            <div
              key={branch.name}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                isCurrent
                  ? 'bg-bg-tertiary'
                  : 'hover:bg-bg-tertiary/50'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: branch.color }}
              />
              <span
                className="truncate"
                style={{
                  color: isCurrent ? branch.color : '#8b949e',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {branch.name}
              </span>
              {isCurrent && (
                <span className="text-[10px] text-accent-green ml-auto shrink-0">
                  HEAD
                </span>
              )}
              {headCommit && (
                <code className="text-[10px] text-text-secondary ml-auto shrink-0">
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
