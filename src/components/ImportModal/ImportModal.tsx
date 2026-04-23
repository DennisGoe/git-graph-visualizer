import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch } from '../../store';
import { importRepo } from '../../store/gitSlice';
import { parseGitLog, GIT_LOG_COMMAND } from '../../utils/gitLogParser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(GIT_LOG_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
      const el = document.querySelector('[data-command]') as HTMLElement;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  const handleImport = () => {
    setError(null);

    const result = parseGitLog(input);

    if ('error' in result) {
      setError(result.error);
      return;
    }

    dispatch(importRepo(result));

    setInput('');
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) setInput(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
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
                  Import Git Repository
                </h2>
                <p className="text-xs text-text-secondary" style={{ marginTop: 6 }}>
                  Visualize a real git history
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                style={{ padding: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Step 1 */}
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
                      Run this command in your repository
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2 rounded-xl border"
                    style={{
                      backgroundColor: '#1b1b1b',
                      borderColor: '#3d3d3d',
                      padding: '14px 18px',
                      marginLeft: 36,
                    }}
                  >
                    <code
                      data-command
                      className="flex-1 text-sm text-accent-cyan font-mono select-all"
                    >
                      {GIT_LOG_COMMAND}
                    </code>
                    <button
                      onClick={handleCopyCommand}
                      className="shrink-0 px-2.5 py-1 rounded-lg text-xs bg-bg-tertiary hover:bg-border text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
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
                      Paste the output here
                    </span>
                  </div>
                  <div style={{ marginLeft: 36 }}>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setError(null);
                      }}
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      placeholder="Paste git log output here..."
                      className="w-full h-48 rounded-xl text-sm font-mono text-text-primary placeholder:text-text-secondary/40 resize-none focus:outline-none transition-colors"
                      style={{
                        backgroundColor: '#1b1b1b',
                        border: '1px solid #3d3d3d',
                        padding: '12px 16px',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#ff6d5a80')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#3d3d3d')}
                      spellCheck={false}
                    />

                    {/* Preview stats */}
                    {input && !error && (
                      <p className="text-[11px] text-text-secondary opacity-50" style={{ marginTop: 5 }}>
                        {input.trim().split('\n').filter(Boolean).length} lines detected
                      </p>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{ marginLeft: 36 }}>
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
                        {error}
                      </pre>
                    </motion.div>
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
                onClick={onClose}
                className="header-btn-ghost rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!input.trim()}
                className="header-btn-primary rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: '10px 24px' }}
              >
                Import & Visualize
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
