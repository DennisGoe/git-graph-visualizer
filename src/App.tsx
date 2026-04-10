import { useState } from 'react';
import Header from './components/shared/Header';
import GraphCanvas from './components/Graph/GraphCanvas';
import Terminal from './components/Terminal/Terminal';
import Sidebar from './components/Sidebar/Sidebar';
import ImportModal from './components/ImportModal/ImportModal';

export default function App() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onImportClick={() => setImportOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main area: graph + terminal */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Graph area */}
          <div className="flex-1 overflow-auto">
            <GraphCanvas />
          </div>

          {/* Terminal area */}
          <div className="h-[280px] shrink-0">
            <Terminal />
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
