import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WizardPage from './pages/WizardPage';
import ExternalsWizardPage from './pages/ExternalsWizardPage';
import ProjectMasterPage from './pages/ProjectMasterPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Sidebar from './components/Sidebar';
import ProjectManagementModal from './components/ProjectManagementModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { Development, Block } from './types';

const App: React.FC = () => {
  const store = useStore();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'wizard' | 'externals' | 'settings' | 'reports' | 'development' | 'analytics'>('dashboard');
  const [activeDevId, setActiveDevId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Global Project Management State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingDevId, setEditingDevId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Global Menu Management to ensure only 1 is open
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
       if (activeMenuId) setActiveMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeMenuId]);

  if (!store.user) {
    return <LoginPage onLogin={(u) => store.login(u)} />;
  }

  const activeDevelopment = store.developments.find(d => d.id === activeDevId) || null;
  const activeBlock = activeDevelopment?.blocks.find(b => b.id === activeBlockId) || null;

  const navigateToDevelopment = (dev: Development) => {
    setActiveDevId(dev.id);
    setCurrentPage('development');
    setActiveMenuId(null);
  };

  const navigateToBlock = (dev: Development, block: Block) => {
    setActiveDevId(dev.id);
    setActiveBlockId(block.id);
    setCurrentPage('wizard');
    setActiveMenuId(null);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingDevId(null);
    setIsProjectModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenEditModal = (devId: string) => {
    setModalMode('edit');
    setEditingDevId(devId);
    setIsProjectModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDeleteModal = (devId: string) => {
    setDeleteConfirmationId(devId);
    setActiveMenuId(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        activePage={currentPage} 
        activeDevelopment={activeDevelopment}
        activeBlock={activeBlock}
        developments={store.developments}
        reports={store.reports}
        onNavigate={(p) => { setCurrentPage(p); setActiveMenuId(null); }} 
        onSelectDevelopment={navigateToDevelopment}
        onSelectBlock={navigateToBlock}
        onSelectExternals={(dev) => { setActiveDevId(dev.id); setCurrentPage('externals'); setActiveMenuId(null); }}
        onEditDevelopment={(dev) => handleOpenEditModal(dev.id)}
        onArchiveDevelopment={(id) => { store.toggleArchive(id); setActiveMenuId(null); }}
        onDeleteDevelopment={handleOpenDeleteModal}
        onToggleFavourite={(id) => { store.toggleFavourite(id); setActiveMenuId(null); }}
        onUpdateDevelopment={(dev) => store.updateDevelopment(dev)}
        user={store.user}
        onLogout={() => store.logout()}
        activeMenuId={activeMenuId}
        setActiveMenuId={setActiveMenuId}
        onDuplicateDevelopment={(id) => { store.duplicateDevelopment(id); setActiveMenuId(null); }}
      />
      
      <main className="flex-1 overflow-auto h-screen relative">
        {currentPage === 'dashboard' && (
          <DashboardPage 
            store={store} 
            onSelectDevelopment={navigateToDevelopment} 
            onOpenCreateModal={handleOpenCreateModal}
            onOpenEditModal={handleOpenEditModal}
            onOpenDeleteModal={handleOpenDeleteModal}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
          />
        )}
        {currentPage === 'analytics' && (
          <AnalyticsPage store={store} />
        )}
        {currentPage === 'development' && activeDevelopment && (
          <ProjectMasterPage 
            development={activeDevelopment}
            onSelectBlock={(b) => { setActiveBlockId(b.id); setCurrentPage('wizard'); }}
            onSelectExternals={() => setCurrentPage('externals')}
            onUpdateDevelopment={(u) => store.updateDevelopment(u)}
            onEditDevelopment={(dev) => handleOpenEditModal(dev.id)}
            onArchiveDevelopment={(id) => store.toggleArchive(id)}
            onDeleteDevelopment={handleOpenDeleteModal}
            onToggleFavourite={(id) => store.toggleFavourite(id)}
            onBack={() => setCurrentPage('dashboard')}
            onNavigateReports={() => setCurrentPage('reports')}
            store={store}
          />
        )}
        {currentPage === 'wizard' && activeDevelopment && activeBlock && (
          <WizardPage 
            development={activeDevelopment}
            activeBlock={activeBlock}
            isSaving={false}
            onBack={() => setCurrentPage('development')}
            onUpdateDevelopment={(u) => store.updateDevelopment(u)}
            onUndo={() => {}}
            canUndo={false}
            onExport={() => setCurrentPage('reports')}
          />
        )}
        {currentPage === 'externals' && activeDevelopment && (
          <ExternalsWizardPage 
            development={activeDevelopment}
            isSaving={false}
            onBack={() => setCurrentPage('development')}
            onUpdateDevelopment={(u) => store.updateDevelopment(u)}
            onUndo={() => {}}
            canUndo={false}
            onExport={() => setCurrentPage('reports')}
          />
        )}
        {currentPage === 'reports' && (
          <ReportsPage 
            store={store} 
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
          />
        )}
        {currentPage === 'settings' && (
          <SettingsPage user={store.user} onUpdate={(u) => store.setUser(u)} store={store} />
        )}
      </main>

      <ProjectManagementModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        mode={modalMode}
        editingDevId={editingDevId}
        store={store}
        onSuccess={(dev) => {
          if (modalMode === 'create' && dev) {
            navigateToDevelopment(dev);
          }
        }}
      />

      <DeleteConfirmationModal 
        id={deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={(id) => {
          store.deleteDevelopment(id);
          if (activeDevId === id) {
            setCurrentPage('dashboard');
            setActiveDevId(null);
          }
          setDeleteConfirmationId(null);
        }}
      />
    </div>
  );
};

export default App;