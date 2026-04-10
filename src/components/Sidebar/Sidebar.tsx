import { motion, AnimatePresence } from 'motion/react';
import { useAppSelector } from '../../store';
import BranchList from './BranchList';
import CommitDetails from './CommitDetails';

export default function Sidebar() {
  const isOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="bg-bg-secondary border-l border-border overflow-hidden shrink-0 flex flex-col"
        >
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            <BranchList />
            <CommitDetails />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
