import { motion, AnimatePresence } from 'motion/react';
import { useAppSelector } from '../../store';

export default function CommitDetails() {
  const selectedId = useAppSelector((s) => s.ui.selectedCommitId);
  const commit = useAppSelector((s) =>
    selectedId ? s.git.commits[selectedId] : null,
  );
  const branches = useAppSelector((s) => s.git.branches);
  const tags = useAppSelector((s) => s.git.tags);

  const commitBranches = commit
    ? Object.values(branches).filter(
        (b) => b.headCommitId === commit.id,
      )
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
          className="p-4 space-y-4"
        >
          <h3 className="text-sm font-semibold text-text-primary">
            Commit Details
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-text-secondary block mb-1">
                Hash
              </span>
              <code className="text-xs text-accent-blue bg-bg-tertiary px-2 py-1 rounded">
                {commit.hash}
              </code>
            </div>

            <div>
              <span className="text-xs text-text-secondary block mb-1">
                Message
              </span>
              <p className="text-sm text-text-primary">{commit.message}</p>
            </div>

            <div>
              <span className="text-xs text-text-secondary block mb-1">
                Branch
              </span>
              <span
                className="text-xs px-2 py-1 rounded"
                style={{
                  color: branches[commit.branch]?.color || '#8b949e',
                  backgroundColor:
                    (branches[commit.branch]?.color || '#8b949e') + '20',
                }}
              >
                {commit.branch}
              </span>
            </div>

            <div>
              <span className="text-xs text-text-secondary block mb-1">
                Parents
              </span>
              <div className="flex gap-1 flex-wrap">
                {commit.parentIds.length === 0 ? (
                  <span className="text-xs text-text-secondary">
                    (root commit)
                  </span>
                ) : (
                  commit.parentIds.map((pid) => (
                    <code
                      key={pid}
                      className="text-xs text-accent-purple bg-bg-tertiary px-2 py-1 rounded"
                    >
                      {pid.slice(0, 7)}
                    </code>
                  ))
                )}
              </div>
            </div>

            {commitBranches.length > 0 && (
              <div>
                <span className="text-xs text-text-secondary block mb-1">
                  Branch Heads
                </span>
                <div className="flex gap-1 flex-wrap">
                  {commitBranches.map((b) => (
                    <span
                      key={b.name}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        color: b.color,
                        backgroundColor: b.color + '20',
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
                <span className="text-xs text-text-secondary block mb-1">
                  Tags
                </span>
                <div className="flex gap-1 flex-wrap">
                  {commitTags.map((t) => (
                    <span
                      key={t.name}
                      className="text-xs text-accent-orange bg-accent-orange/20 px-2 py-1 rounded"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 text-sm text-text-secondary"
        >
          Click a commit node to see details
        </motion.div>
      )}
    </AnimatePresence>
  );
}
