import { useState } from 'react';
import Header from './components/shared/Header';
import GraphCanvas from './components/Graph/GraphCanvas';
// import Terminal from './components/Terminal/Terminal';
import Sidebar from './components/Sidebar/Sidebar';
import ImportModal from './components/ImportModal/ImportModal';
import ConnectModal from './components/ConnectModal/ConnectModal';

export default function App() {
  const [importOpen, setImportOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        onImportClick={() => setImportOpen(true)}
        onConnectClick={() => setConnectOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main area: graph */}
        <div className="flex-1 overflow-hidden">
          <GraphCanvas />
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <ConnectModal
        isOpen={connectOpen}
        onClose={() => setConnectOpen(false)}
      />
    </div>
  );
}
