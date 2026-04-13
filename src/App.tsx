import { useState } from 'react';
import Header from './components/shared/Header';
import GraphCanvas from './components/Graph/GraphCanvas';
import Sidebar from './components/Sidebar/Sidebar';
import ImportModal from './components/ImportModal/ImportModal';
import ConnectModal from './components/ConnectModal/ConnectModal';
import ConnectGitLabModal from './components/ConnectGitLabModal/ConnectGitLabModal';

export default function App() {
  const [importOpen, setImportOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectGitLabOpen, setConnectGitLabOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        onImportClick={() => setImportOpen(true)}
        onConnectClick={() => setConnectOpen(true)}
        onConnectGitLabClick={() => setConnectGitLabOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <GraphCanvas />
        </div>
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

      <ConnectGitLabModal
        isOpen={connectGitLabOpen}
        onClose={() => setConnectGitLabOpen(false)}
      />
    </div>
  );
}
