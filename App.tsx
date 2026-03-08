import React, { useState, useEffect } from 'react';
import { useStore, DEMO_MODE, DEMO_USERS } from './store';
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
import { Development, Block, UserRole } from './types';
import { Eye, ShieldCheck, Users, ChevronDown, Menu, PanelLeftOpen } from 'lucide-react';

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

  // Demo mode state
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleGlobalClick = () => {
       if (activeMenuId) setActiveMenuId(null);
       setRoleDropdownOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeMenuId]);

  if (!store.user && !DEMO_MODE) {
    return <LoginPage onLogin={(u) => store.login(u)} />;
  }

  if (!store.user) {
    return null;
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

  const handleSwitchRole = (roleKey: string) => {
    store.setUser(DEMO_USERS[roleKey]);
    setRoleDropdownOpen(false);
  };

  const currentRoleKey = store.user.roleType === UserRole.DEPT_HEAD ? 'DEPT_HEAD' : 'SURVEYOR';

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
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 overflow-auto h-screen relative min-w-0">
        {/* Demo Mode Banner - pinned at very top */}
        {DEMO_MODE && !demoBannerDismissed && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between z-50 relative shadow-lg sticky top-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center min-w-0">
              <Eye size={14} className="shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">Demo Mode</span>
              <span className="text-xs font-medium opacity-90 hidden md:inline">— You're viewing with sample data. All content is fictional.</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Role Switcher */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-3 py-1.5 transition-all border border-white/30"
                >
                  {currentRoleKey === 'DEPT_HEAD' ? <ShieldCheck size={14} /> : <Users size={14} />}
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                    {currentRoleKey === 'DEPT_HEAD' ? 'Dept Head' : 'Surveyor'}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {roleDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-64 z-[100]">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Switch Role</p>
                    </div>
                    <button
                      onClick={() => handleSwitchRole('DEPT_HEAD')}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-center gap-3 ${currentRoleKey === 'DEPT_HEAD' ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShieldCheck size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Department Head</p>
                        <p className="text-[10px] text-slate-500">Team management, full analytics, admin controls</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('SURVEYOR')}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-center gap-3 ${currentRoleKey === 'SURVEYOR' ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                    >
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Users size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Surveyor</p>
                        <p className="text-[10px] text-slate-500">Personal dashboard, own projects only</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setDemoBannerDismissed(true)}
                className="text-white/80 hover:text-white text-lg font-bold leading-none px-1"
                title="Dismiss banner"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {!mobileSidebarOpen && <div className={`lg:hidden sticky ${DEMO_MODE && !demoBannerDismissed ? 'top-[41px]' : 'top-0'} z-50 bg-slate-900 text-white px-4 py-3 flex items-center gap-3 shadow-lg`}>
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <Menu size={22} />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold italic text-sm shadow-lg shadow-blue-900/40">R</div>
          <span className="font-bold text-sm tracking-tight">RCA Wizard</span>
        </div>}

        {/* Desktop sidebar expand button (when collapsed) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed top-4 left-4 z-50 items-center gap-2 bg-slate-900 text-white px-3 py-2.5 rounded-xl shadow-xl hover:bg-slate-800 transition-all border border-slate-700"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
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