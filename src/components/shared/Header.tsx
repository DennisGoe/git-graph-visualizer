import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar } from '../../store/uiSlice';

interface Props {
  onImportClick: () => void;
}

export default function Header({ onImportClick }: Props) {
  const dispatch = useAppDispatch();
  const currentBranch = useAppSelector((s) => s.git.currentBranch);
  const branchCount = useAppSelector(
    (s) => Object.keys(s.git.branches).length,
  );
  const commitCount = useAppSelector((s) => s.git.commitOrder.length);
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-bg-secondary border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-blue"
          >
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="3" x2="12" y2="9" />
            <line x1="12" y1="15" x2="12" y2="21" />
            <path d="M5.6 5.6l4.3 4.3" />
            <path d="M14.1 14.1l4.3 4.3" />
          </svg>
          <h1 className="text-sm font-semibold text-text-primary tracking-wide">
            Git Graph Visualizer
          </h1>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span>
            <span className="text-accent-green">{currentBranch}</span>
          </span>
          <span>{branchCount} branches</span>
          <span>{commitCount} commits</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onImportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border border-accent-blue/20 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.5 1.75a.75.75 0 011.5 0V8.94l2.22-2.22a.75.75 0 011.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 011.06-1.06L7.5 8.94V1.75z" />
            <path d="M2.5 11.25a.75.75 0 011.5 0v1.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 0111.75 15h-7.5A1.75 1.75 0 012.5 13.25v-1.5z" />
          </svg>
          Import Repo
        </button>

        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M2 3h12v1H2V3zm0 4h12v1H2V7zm0 4h12v1H2v-1z" />
        </svg>
        </button>
      </div>
    </header>
  );
}
