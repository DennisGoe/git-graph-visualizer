import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar } from '../../store/uiSlice';

interface Props {
  onImportClick: () => void;
  onConnectClick: () => void;
}

export default function Header({ onImportClick, onConnectClick }: Props) {
  const dispatch = useAppDispatch();
  const currentBranch = useAppSelector((s) => s.git.currentBranch);
  const branchCount = useAppSelector(
    (s) => Object.keys(s.git.branches).length,
  );
  const commitCount = useAppSelector((s) => s.git.commitOrder.length);
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <header
      className="flex items-center justify-between px-4 bg-bg-secondary border-b border-border shrink-0"
      style={{ height: 48 }}
    >
      {/* Left: icon + title */}
      <div className="flex items-center gap-2.5">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-orange"
        >
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="3" x2="12" y2="9" />
          <line x1="12" y1="15" x2="12" y2="21" />
          <path d="M5.6 5.6l4.3 4.3" />
          <path d="M14.1 14.1l4.3 4.3" />
        </svg>
        <span className="text-sm font-semibold text-text-primary tracking-wide">
          Git Graph
        </span>
      </div>

      {/* Center: branch pill + stats */}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)' }}
          />
          <span className="text-[13px] font-semibold text-accent-green">
            {currentBranch}
          </span>
        </div>
        <span className="w-px h-3.5 bg-border" />
        <span>{commitCount} commits</span>
        <span className="w-px h-3.5 bg-border" />
        <span>{branchCount} branches</span>
      </div>

      {/* Right: connect + import buttons + sidebar toggle */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onConnectClick}
          className="header-btn-ghost flex items-center gap-2 rounded-xl text-[13px] font-semibold text-text-secondary"
          style={{ padding: '6px 12px' }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Connect GitHub
        </button>

        <button
          onClick={onImportClick}
          className="header-btn-primary flex items-center gap-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ padding: '6px 12px' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v8m0 0l-3-3m3 3l3-3" />
            <path d="M3 11v2.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V11" />
          </svg>
          Import Repo
        </button>

        <button
          onClick={() => dispatch(toggleSidebar())}
          className="header-btn-ghost flex items-center justify-center rounded-lg text-text-secondary"
          style={{ width: 34, height: 34 }}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <svg
            width="15"
            height="15"
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
