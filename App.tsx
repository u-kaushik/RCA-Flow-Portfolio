import React, { useState, useEffect, useRef } from 'react';
import { useStore } from './store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WizardPage from './pages/WizardPage';
import ExternalsWizardPage from './pages/ExternalsWizardPage';
import ProjectMasterPage from './pages/ProjectMasterPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import Sidebar from './components/Sidebar';
import { Development, Block, ExternalsAssessment } from './types';
import { X, MapPin, ArrowRight, AlertTriangle, Hash, FileBox } from 'lucide-react';

const App: React.FC = () => {
  const store = useStore();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'wizard' | 'externals' | 'settings' | 'reports' | 'development'>('dashboard');
  const [activeDevelopment, setActiveDevelopment] = useState<Development | null>(null);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<Development[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<Development | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('rca_user');
    if (savedUser) {
      store.setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (!activeDevelopment) return;
    
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      store.updateDevelopment(activeDevelopment);
      setIsSaving(false);
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [activeDevelopment]);

  if (!store.user) {
    return <LoginPage onLogin={(u) => {
      store.login(u);
      localStorage.setItem('rca_user', JSON.stringify(u));
    }} />;
  }

  const navigateToProjectMaster = (dev: Development) => {
    setActiveDevelopment(dev);
    setActiveBlock(null);
    setCurrentPage('development');
    setHistory([dev]);
  };

  const navigateToWizard = (dev: Development, block: Block) => {
    setActiveDevelopment(dev);
    setActiveBlock(block);
    setCurrentPage('wizard');
    if (history.length === 0) setHistory([dev]);
  };

  const navigateToExternalsWizard = (dev: Development) => {
    setActiveDevelopment(dev);
    setActiveBlock(null);
    setCurrentPage('externals');
    if (history.length === 0) setHistory([dev]);
  };

  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
    setActiveDevelopment(null);
    setActiveBlock(null);
    setHistory([]);
  };

  const handleUpdateDevelopment = (updated: Development) => {
    setHistory(prev => {
      const last = prev[prev.length - 1];
      if (JSON.stringify(last) === JSON.stringify(updated)) return prev;
      return [...prev.slice(-10), updated];
    });
    setActiveDevelopment(updated);
    
    if (activeBlock) {
      const freshBlock = updated.blocks.find(b => b.id === activeBlock.id);
      if (freshBlock) setActiveBlock(freshBlock);
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevState = newHistory[newHistory.length - 1];
      setActiveDevelopment(prevState);
      setHistory(newHistory);
      
      if (activeBlock) {
        const freshBlock = prevState.blocks.find(b => b.id === activeBlock.id);
        if (freshBlock) setActiveBlock(freshBlock);
      }
    }
  };

  const handleEditDev = (dev: Development) => {
    setEditingDev({ ...dev });
    setIsEditModalOpen(true);
  };

  const saveEditedProject = () => {
    if (editingDev) {
      const updatedBlocks = (editingDev.blocks || []).map(b => ({
        ...b,
        addressLine: editingDev.addressLine,
        town: editingDev.town,
        postcode: editingDev.postcode
      }));

      const finalDev = { 
        ...editingDev, 
        blocks: updatedBlocks,
        updatedAt: new Date().toISOString()
      };

      store.updateDevelopment(finalDev);
      if (activeDevelopment?.id === finalDev.id) {
        setActiveDevelopment(finalDev);
      }
      setIsEditModalOpen(false);
      setEditingDev(null);
    }
  };

  const handleToggleFavourite = (id: string) => {
    store.toggleFavourite(id);
    if (activeDevelopment?.id === id) {
      setActiveDevelopment(prev => prev ? { ...prev, isFavourite: !prev.isFavourite } : null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        activePage={currentPage} 
        activeDevelopment={activeDevelopment}
        activeBlock={activeBlock}
        developments={store.developments}
        onNavigate={(p) => {
          setCurrentPage(p);
          if (p === 'dashboard' || p === 'reports') {
            setActiveDevelopment(null);
            setActiveBlock(null);
          }
        }} 
        onSelectDevelopment={navigateToProjectMaster}
        onSelectBlock={navigateToWizard}
        onSelectExternals={navigateToExternalsWizard}
        onEditDevelopment={handleEditDev}
        onArchiveDevelopment={(id) => store.toggleArchive(id)}
        onDeleteDevelopment={(id) => setDeleteConfirmationId(id)}
        onToggleFavourite={handleToggleFavourite}
        user={store.user}
        onLogout={() => {
          store.logout();
          localStorage.removeItem('rca_user');
        }}
      />
      
      <main className="flex-1 overflow-auto h-screen relative">
        {currentPage === 'dashboard' && (
          <DashboardPage 
            store={store} 
            onSelectDevelopment={navigateToProjectMaster} 
            onEditDevelopment={handleEditDev}
          />
        )}
        {currentPage === 'development' && activeDevelopment && (
          <ProjectMasterPage 
            development={activeDevelopment}
            onSelectBlock={(b) => navigateToWizard(activeDevelopment, b)}
            onSelectExternals={() => navigateToExternalsWizard(activeDevelopment)}
            onUpdateDevelopment={handleUpdateDevelopment}
            onEditDevelopment={handleEditDev}
            onArchiveDevelopment={(id) => store.toggleArchive(id)}
            onDeleteDevelopment={(id) => setDeleteConfirmationId(id)}
            onToggleFavourite={handleToggleFavourite}
            onBack={navigateToDashboard}
            onNavigateReports={() => setCurrentPage('reports')}
            store={store}
          />
        )}
        {currentPage === 'wizard' && activeDevelopment && (
          <WizardPage 
            development={activeDevelopment}
            activeBlock={activeBlock}
            isSaving={isSaving}
            onBack={() => setCurrentPage('development')}
            onUpdateDevelopment={handleUpdateDevelopment}
            onUndo={handleUndo}
            canUndo={history.length > 1}
            onExport={() => setCurrentPage('reports')}
            onSelectBlock={navigateToWizard}
          />
        )}
        {currentPage === 'externals' && activeDevelopment && (
          <ExternalsWizardPage 
            development={activeDevelopment}
            isSaving={isSaving}
            onBack={() => setCurrentPage('development')}
            onUpdateDevelopment={handleUpdateDevelopment}
            onUndo={handleUndo}
            canUndo={history.length > 1}
            onExport={() => setCurrentPage('reports')}
          />
        )}
        {currentPage === 'reports' && (
          <ReportsPage store={store} />
        )}
        {currentPage === 'settings' && (
          <SettingsPage 
            user={store.user} 
            onUpdate={(u) => {
              store.setUser(u);
              localStorage.setItem('rca_user', JSON.stringify(u));
            }}
          />
        )}
      </main>

      {/* Edit Development Modal */}
      {isEditModalOpen && editingDev && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Project Overview</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="p-10 space-y-10 overflow-auto max-h-[70vh] custom-scrollbar">
              
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">Development Data</h4>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Development Name</label>
                  <input type="text" value={editingDev.name} onChange={e => setEditingDev({ ...editingDev, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Hash size={10} /> Case Number</label>
                    <input type="text" value={editingDev.caseNumber || ''} onChange={e => setEditingDev({ ...editingDev, caseNumber: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><FileBox size={10} /> Property Ref</label>
                    <input type="text" value={editingDev.propertyReference || ''} onChange={e => setEditingDev({ ...editingDev, propertyReference: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={12} className="text-blue-500" /> Property Location</h4>
                   <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded italic">Syncs to all building blocks</span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Property Address</label>
                  <input type="text" value={editingDev.addressLine || ''} onChange={e => setEditingDev({ ...editingDev, addressLine: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Enter street address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Town/City</label>
                    <input type="text" value={editingDev.town || ''} onChange={e => setEditingDev({ ...editingDev, town: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Postcode</label>
                    <input type="text" value={editingDev.postcode || ''} onChange={e => setEditingDev({ ...editingDev, postcode: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>
              </div>

            </div>
            <div className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase text-slate-500 tracking-widest hover:bg-white border border-transparent transition-colors">Cancel</button>
              <button onClick={saveEditedProject} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">Save Project Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Development?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">This will remove the project forever. It cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmationId(null)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-xl border border-slate-200 transition-all">Cancel</button>
              <button onClick={() => { store.deleteDevelopment(deleteConfirmationId); setDeleteConfirmationId(null); if (activeDevelopment?.id === deleteConfirmationId) navigateToDashboard(); }} className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all">Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;