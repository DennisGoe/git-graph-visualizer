import { motion, AnimatePresence } from 'motion/react';
import { useAppSelector } from '../../store';

export default function CommitDetails() {
  const selectedId = useAppSelector((s) => s.ui.selectedCommitId);
  const commit = useAppSelector((s) =>
    selectedId ? s.git.commits[selectedId] : null,
  );
  const branches = useAppSelector((s) => s.git.branches);
  const tags = useAppSelector((s) => s.git.tags);
  const allCommits = useAppSelector((s) => s.git.commits);

  const commitBranches = commit
    ? Object.values(branches).filter((b) => b.headCommitId === commit.id)
    : [];
  const commitTags = commit
    ? Object.values(tags).filter((t) => t.commitId === commit.id)
    : [];

  return (
    <AnimatePresence mode="wait">
      {commit ? (
        <motion.div
          key={commit.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          style={{ padding: '20px 24px' }}
        >
          <h3
            className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
            style={{ marginBottom: 16 }}
          >
            Commit Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Main info card */}
            <div
              className="rounded-xl border"
              style={{
                backgroundColor: '#2d2d2d',
                borderColor: '#3d3d3d',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div>
                <span className="block text-[10px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 5 }}>
                  Hash
                </span>
                <code className="text-xs text-accent-blue font-mono">
                  {commit.hash}
                </code>
              </div>

              <div>
                <span className="block text-[10px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 5 }}>
                  Message
                </span>
                <p className="text-sm text-text-primary leading-relaxed">
                  {commit.message}
                </p>
              </div>

              {commit.author && (
                <div>
                  <span className="block text-[10px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 5 }}>
                    Author
                  </span>
                  <p className="text-sm text-text-primary">{commit.author}</p>
                </div>
              )}

              {commit.date && (
                <div>
                  <span className="block text-[10px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 5 }}>
                    Date
                  </span>
                  <p className="text-xs text-text-secondary font-mono">
                    {new Date(commit.date).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Branch & parents card */}
            <div
              className="rounded-xl border"
              style={{
                backgroundColor: '#2d2d2d',
                borderColor: '#3d3d3d',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div>
                <span className="block text-[10px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 6 }}>
                  Branch
                </span>
                <span
                  className="inline-block text-xs font-medium rounded-lg"
                  style={{
                    color: branches[commit.branch]?.color || '#8b8b8b',
                    backgroundColor:
                      (branches[commit.branch]?.color || '#8b8b8b') + '18',
                    padding: '4px 10px',
                  }}
                >
                  {commit.branch}
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 6 }}>
                  Parents
                </span>
                <div className="flex gap-2 flex-wrap">
                  {commit.parentIds.length === 0 ? (
                    <span className="text-xs text-text-secondary">(root commit)</span>
                  ) : (
                    commit.parentIds.map((pid) => {
                      const parent = allCommits[pid];
                      return (
                        <code
                          key={pid}
                          className="text-xs text-accent-purple font-mono rounded-lg"
                          title={parent?.message}
                          style={{
                            backgroundColor: '#1b1b1b',
                            padding: '4px 10px',
                          }}
                        >
                          {parent?.hash || pid.slice(0, 7)}
                        </code>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Refs card (only if there are any) */}
            {(commitBranches.length > 0 || commitTags.length > 0) && (
              <div
                className="rounded-xl border"
                style={{
                  backgroundColor: '#2d2d2d',
                  borderColor: '#3d3d3d',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {commitBranches.length > 0 && (
                  <div>
                    <span className="block text-[10px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 6 }}>
                      Branch Heads
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {commitBranches.map((b) => (
                        <span
                          key={b.name}
                          className="text-xs font-medium rounded-lg"
                          style={{
                            color: b.color,
                            backgroundColor: b.color + '18',
                            padding: '4px 10px',
                          }}
                        >
                          {b.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {commitTags.length > 0 && (
                  <div>
                    <span className="block text-[10px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 6 }}>
                      Tags
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {commitTags.map((t) => (
                        <span
                          key={t.name}
                          className="text-xs font-medium rounded-lg"
                          style={{
                            color: '#ff6d5a',
                            backgroundColor: '#ff6d5a18',
                            padding: '4px 10px',
                          }}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ padding: '20px 24px' }}
        >
          <h3
            className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
            style={{ marginBottom: 14 }}
          >
            Commit Details
          </h3>
          <div
            className="rounded-xl border text-center"
            style={{
              backgroundColor: '#2d2d2d',
              borderColor: '#3d3d3d',
              padding: '24px 18px',
            }}
          >
            <p className="text-xs text-text-secondary">
              Click a commit node to see details
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
