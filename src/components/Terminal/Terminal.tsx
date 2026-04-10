import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../../store';
import { setHistoryIndex } from '../../store/terminalSlice';
import { useCommandExecutor } from '../../hooks/useCommandExecutor';

export default function Terminal() {
  const [input, setInput] = useState('');
  const lines = useAppSelector((s) => s.terminal.lines);
  const history = useAppSelector((s) => s.terminal.history);
  const historyIndex = useAppSelector((s) => s.terminal.historyIndex);
  const currentBranch = useAppSelector((s) => s.git.currentBranch);
  const dispatch = useAppDispatch();
  const execute = useCommandExecutor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    execute(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const newIndex = Math.max(0, historyIndex - 1);
      dispatch(setHistoryIndex(newIndex));
      setInput(history[newIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.min(history.length, historyIndex + 1);
      dispatch(setHistoryIndex(newIndex));
      setInput(newIndex === history.length ? '' : history[newIndex] || '');
    }
  };

  const lineColor = (type: string) => {
    switch (type) {
      case 'input':
        return 'text-accent-cyan';
      case 'error':
        return 'text-accent-red';
      default:
        return 'text-text-secondary';
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-bg-secondary border-t border-border"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-bg-tertiary">
        <div className="w-3 h-3 rounded-full bg-accent-red" />
        <div className="w-3 h-3 rounded-full bg-accent-orange" />
        <div className="w-3 h-3 rounded-full bg-accent-green" />
        <span className="ml-2 text-xs text-text-secondary">terminal</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.pre
              key={line.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`text-sm whitespace-pre-wrap font-mono ${lineColor(line.type)}`}
            >
              {line.content}
            </motion.pre>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center px-4 py-3 border-t border-border">
        <span className="text-accent-green text-sm mr-1">
          {currentBranch}
        </span>
        <span className="text-text-secondary text-sm mr-2">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-sm text-text-primary font-mono placeholder:text-text-secondary/40"
          placeholder='Type a git command... (try "help")'
          spellCheck={false}
          autoFocus
        />
      </form>
    </div>
  );
}
