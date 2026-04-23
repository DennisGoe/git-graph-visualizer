import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppSelector } from '../../store';
import { useGitLabPipelines } from '../../hooks/useGitLabPipelines';
import OfficeScene from './OfficeScene';

const STALE_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function OfficeOverlay({ isOpen, onClose }: Props) {
  const branches = useAppSelector((s) => s.git.branches);
  const commits = useAppSelector((s) => s.git.commits);
  const project = useAppSelector((s) => s.project);
  const pipelines = useAppSelector((s) => s.pipelines);

  // Active branches = same definition as the sidebar (within 90 days of newest head)
  const activeBranches = useMemo(() => {
    const all = Object.values(branches);
    if (all.length === 0) return [];
    const newestTs = Math.max(
      ...all.map((b) => commits[b.headCommitId]?.timestamp ?? 0),
    );
    return all
      .filter((b) => {
        const ts = commits[b.headCommitId]?.timestamp ?? 0;
        return newestTs - ts <= STALE_THRESHOLD_MS;
      })
      .sort((a, b) => {
        if (a.name === 'main' || a.name === 'master') return -1;
        if (b.name === 'main' || b.name === 'master') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [branches, commits]);

  const activeNames = useMemo(
    () => activeBranches.map((b) => b.name),
    [activeBranches],
  );

  useGitLabPipelines(activeNames, isOpen);

  const working = Object.values(pipelines.byBranch).filter((p) => p.state === 'working').length;
  const failed = Object.values(pipelines.byBranch).filter((p) => p.state === 'failed').length;
  const waiting = Object.values(pipelines.byBranch).filter((p) => p.state === 'waiting').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between border-b"
            style={{
              height: 56,
              padding: '0 20px',
              backgroundColor: '#1b1612',
              borderColor: '#3a241a',
            }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 18 }}>🏢</span>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  The Office
                </h2>
                <p className="text-[11px] text-text-secondary">
                  {project.provider === 'gitlab'
                    ? `Live pipelines · ${project.projectPath}`
                    : 'Connect a GitLab project to see live pipelines'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-text-secondary">
              {project.provider === 'gitlab' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#3fb950', boxShadow: '0 0 6px #3fb95066' }} />
                    {working} building
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#d29922' }} />
                    {waiting} pending
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                    {failed} failed
                  </span>
                  <span className="w-px h-3.5" style={{ backgroundColor: '#3a241a' }} />
                  {pipelines.isFetching ? (
                    <span>syncing…</span>
                  ) : pipelines.lastFetched ? (
                    <span>
                      updated {Math.round((Date.now() - pipelines.lastFetched) / 1000)}s ago
                    </span>
                  ) : (
                    <span>waiting for first sync…</span>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                className="rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                style={{ padding: 8 }}
                title="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scene — fills available space, no scroll */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className="flex-1 overflow-hidden flex items-stretch justify-stretch"
            style={{ backgroundColor: '#0f0b08' }}
          >
            {activeBranches.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
                No active branches to show. Connect a GitLab project with recent activity.
              </div>
            ) : (
              <OfficeScene activeBranches={activeBranches} />
            )}
          </motion.div>

          {/* Legend */}
          <div
            className="flex items-center justify-center gap-5 border-t text-[11px] text-text-secondary"
            style={{
              height: 40,
              backgroundColor: '#1b1612',
              borderColor: '#3a241a',
            }}
          >
            <LegendItem color="#3fb950" label="working — pipeline running" />
            <LegendItem color="#d29922" label="waiting — pending / scheduled" />
            <LegendItem color="#8b8b8b" label="idle — coffee break" />
            <LegendItem color="#ef4444" label="failed — build broke" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
