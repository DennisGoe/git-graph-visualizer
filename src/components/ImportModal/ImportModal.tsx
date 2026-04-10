import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch } from '../../store';
import { importRepo } from '../../store/gitSlice';
import { clearTerminal, addLine } from '../../store/terminalSlice';
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
    dispatch(clearTerminal());
    dispatch(
      addLine({
        type: 'output',
        content: `Imported repository: ${Object.keys(result.commits).length} commits, ${Object.keys(result.branches).length} branches, ${Object.keys(result.tags).length} tags`,
      }),
    );

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
            className="border rounded-xl w-full max-w-2xl mx-4 overflow-hidden shadow-2xl"
            style={{ backgroundColor: '#232323', borderColor: '#3d3d3d' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Import Git Repository
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Visualize a real git history
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Step 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#ff6d5a25', color: '#ff6d5a' }}
                  >
                    1
                  </span>
                  <span className="text-sm text-text-primary">
                    Run this command in your repository
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ backgroundColor: '#1b1b1b', borderColor: '#3d3d3d' }}>
                  <code
                    data-command
                    className="flex-1 text-sm text-accent-cyan font-mono select-all"
                  >
                    {GIT_LOG_COMMAND}
                  </code>
                  <button
                    onClick={handleCopyCommand}
                    className="shrink-0 px-2.5 py-1 rounded text-xs bg-bg-tertiary hover:bg-border text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#ff6d5a25', color: '#ff6d5a' }}
                  >
                    2
                  </span>
                  <span className="text-sm text-text-primary">
                    Paste the output here
                  </span>
                </div>
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
                  className="w-full h-48 rounded-lg px-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-secondary/40 resize-none focus:outline-none transition-colors"
                  style={{
                    backgroundColor: '#1b1b1b',
                    border: '1px solid #3d3d3d',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#ff6d5a80')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#3d3d3d')}
                  spellCheck={false}
                />
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-3 py-2.5"
                >
                  <pre className="text-xs text-accent-red font-mono whitespace-pre-wrap">
                    {error}
                  </pre>
                </motion.div>
              )}

              {/* Preview stats */}
              {input && !error && (
                <div className="text-xs text-text-secondary">
                  {input.trim().split('\n').filter(Boolean).length} lines detected
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border" style={{ backgroundColor: '#2d2d2d20' }}>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!input.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#ff6d5a' }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#e85d4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff6d5a';
                }}
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
