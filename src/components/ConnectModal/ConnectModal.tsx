import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch } from '../../store';
import { importRepo } from '../../store/gitSlice';
import { fetchGitHubRepo } from '../../utils/githubApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

interface RepoStats {
  commits: number;
  branches: number;
  tags: number;
}

/** Parse "owner/repo" from a plain slug or a full GitHub URL. */
function parseRepoInput(value: string): { owner: string; repo: string } | null {
  const trimmed = value.trim().replace(/\/+$/, '');

  // Full URL: https://github.com/owner/repo
  const urlMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/,
  );
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };

  // Slug: owner/repo
  const slugMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (slugMatch) return { owner: slugMatch[1], repo: slugMatch[2] };

  return null;
}

export default function ConnectModal({ isOpen, onClose }: Props) {
  const [repoInput, setRepoInput] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState<RepoStats | null>(null);
  const dispatch = useAppDispatch();

  const resetState = useCallback(() => {
    setStatus('idle');
    setProgressMsg('');
    setErrorMsg('');
    setStats(null);
  }, []);

  const handleClose = () => {
    if (status !== 'loading') {
      setRepoInput('');
      setToken('');
      setShowToken(false);
      resetState();
      onClose();
    }
  };

  const handleConnect = async () => {
    const parsed = parseRepoInput(repoInput);
    if (!parsed) {
      setStatus('error');
      setErrorMsg(
        'Invalid repository format. Use "owner/repo" or "https://github.com/owner/repo".',
      );
      return;
    }

    if (!token.trim()) {
      setStatus('error');
      setErrorMsg('A Personal Access Token is required.');
      return;
    }

    setStatus('loading');
    setProgressMsg('Starting...');
    setErrorMsg('');
    setStats(null);

    const result = await fetchGitHubRepo(
      parsed.owner,
      parsed.repo,
      token.trim(),
      (msg) => setProgressMsg(msg),
    );

    if ('error' in result) {
      setStatus('error');
      setErrorMsg(result.error);
      return;
    }

    const data = result.data;
    const repoStats: RepoStats = {
      commits: Object.keys(data.commits).length,
      branches: Object.keys(data.branches).length,
      tags: Object.keys(data.tags).length,
    };

    setStats(repoStats);
    setStatus('success');

    // Import into Redux
    dispatch(importRepo(data));

    // Auto-close after a short delay
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  const canConnect =
    repoInput.trim().length > 0 &&
    token.trim().length > 0 &&
    status !== 'loading';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="border rounded-2xl w-full mx-4 overflow-hidden shadow-2xl"
            style={{
              maxWidth: 620,
              backgroundColor: '#232323',
              borderColor: '#3d3d3d',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-border"
              style={{ padding: '20px 28px' }}
            >
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Connect GitHub Repository
                </h2>
                <p className="text-xs text-text-secondary" style={{ marginTop: 6 }}>
                  Visualize any repository's branch history
                </p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                style={{ padding: 8 }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Step 1: Generate PAT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        width: 24,
                        height: 24,
                        backgroundColor: '#ff6d5a20',
                        color: '#ff6d5a',
                      }}
                    >
                      1
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      Generate a Personal Access Token
                    </span>
                  </div>
                  <div
                    className="rounded-xl border"
                    style={{
                      backgroundColor: '#1b1b1b',
                      borderColor: '#3d3d3d',
                      padding: '16px 18px',
                      marginLeft: 36,
                    }}
                  >
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Create a GitHub Personal Access Token (classic) to
                      authenticate API requests.
                    </p>
                    <a
                      href="https://github.com/settings/tokens/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                      style={{ color: '#ff6d5a', marginTop: 10 }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = '#ff8070')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = '#ff6d5a')
                      }
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M3.75 2h3.5a.75.75 0 010 1.5h-3.5a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25v-3.5a.75.75 0 011.5 0v3.5A1.75 1.75 0 0112.25 14h-8.5A1.75 1.75 0 012 12.25v-8.5C2 2.784 2.784 2 3.75 2zm6.854-.22a.75.75 0 011.176-.98l2 2.4a.75.75 0 01-.026 1.03l-2 1.85a.75.75 0 11-1.018-1.1L11.586 4H10.25A3.25 3.25 0 007 7.25v1a.75.75 0 01-1.5 0v-1A4.75 4.75 0 0110.25 2.5h1.336l-.982-.72z" />
                      </svg>
                      Open GitHub Token Settings
                    </a>
                    <p className="text-[11px] text-text-secondary opacity-60" style={{ marginTop: 8 }}>
                      Select <strong>repo</strong> scope for private repos, or no
                      scope needed for public repos.
                    </p>
                  </div>
                </div>

                {/* Step 2: Enter details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        width: 24,
                        height: 24,
                        backgroundColor: '#ff6d5a20',
                        color: '#ff6d5a',
                      }}
                    >
                      2
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      Enter repository details
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginLeft: 36 }}>
                    {/* Repo input */}
                    <div>
                      <label className="block text-[11px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 6 }}>
                        Repository
                      </label>
                      <input
                        type="text"
                        value={repoInput}
                        onChange={(e) => {
                          setRepoInput(e.target.value);
                          if (status === 'error') resetState();
                        }}
                        placeholder="owner/repo or https://github.com/owner/repo"
                        className="w-full rounded-xl text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none transition-colors"
                        style={{
                          backgroundColor: '#1b1b1b',
                          border: '1px solid #3d3d3d',
                          padding: '12px 16px',
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = '#ff6d5a80')
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = '#3d3d3d')
                        }
                        disabled={status === 'loading'}
                      />
                    </div>

                    {/* Token input */}
                    <div>
                      <label className="block text-[11px] text-text-secondary uppercase tracking-wider" style={{ marginBottom: 6 }}>
                        Access Token
                      </label>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={token}
                          onChange={(e) => {
                            setToken(e.target.value);
                            if (status === 'error') resetState();
                          }}
                          placeholder="ghp_xxxxxxxxxxxx"
                          className="w-full rounded-xl text-sm font-mono text-text-primary placeholder:text-text-secondary/40 focus:outline-none transition-colors"
                          style={{
                            backgroundColor: '#1b1b1b',
                            border: '1px solid #3d3d3d',
                            padding: '12px 44px 12px 16px',
                          }}
                          onFocus={(e) =>
                            (e.currentTarget.style.borderColor = '#ff6d5a80')
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.borderColor = '#3d3d3d')
                          }
                          disabled={status === 'loading'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                          style={{ padding: 4 }}
                          tabIndex={-1}
                        >
                          {showToken ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                              <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Status */}
                {status !== 'idle' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: '#ff6d5a20',
                          color: '#ff6d5a',
                        }}
                      >
                        3
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        Connection status
                      </span>
                    </div>

                    <div style={{ marginLeft: 36 }}>
                      {/* Loading */}
                      {status === 'loading' && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 rounded-xl border"
                          style={{
                            backgroundColor: '#1b1b1b',
                            borderColor: '#3d3d3d',
                            padding: '14px 18px',
                          }}
                        >
                          <svg
                            className="animate-spin shrink-0"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ff6d5a"
                            strokeWidth="2.5"
                          >
                            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
                          </svg>
                          <span className="text-xs text-text-secondary">
                            {progressMsg}
                          </span>
                        </motion.div>
                      )}

                      {/* Success */}
                      {status === 'success' && stats && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                            padding: '14px 18px',
                          }}
                        >
                          <div className="flex items-center gap-2 text-xs font-medium text-accent-green">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                            </svg>
                            Repository connected successfully!
                          </div>
                          <div className="flex items-center gap-4 text-xs text-text-secondary" style={{ marginTop: 10 }}>
                            <span>{stats.commits} commits</span>
                            <span className="w-px h-3 bg-border" />
                            <span>{stats.branches} branches</span>
                            <span className="w-px h-3 bg-border" />
                            <span>{stats.tags} tags</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Error */}
                      {status === 'error' && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            padding: '14px 18px',
                          }}
                        >
                          <pre className="text-xs text-accent-red font-mono whitespace-pre-wrap">
                            {errorMsg}
                          </pre>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end border-t border-border"
              style={{ padding: '16px 28px', backgroundColor: '#2d2d2d20', gap: 12 }}
            >
              <button
                onClick={handleClose}
                className="header-btn-ghost rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!canConnect}
                className="header-btn-primary rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: '10px 24px' }}
              >
                {status === 'loading' ? 'Connecting...' : 'Connect & Visualize'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
