import React, { useState, useRef } from 'react';
import { Search, Plus, Grid, List, Building2, MoreVertical, Trash2, Star, Archive, Filter, ChevronDown, Edit3, Copy, CheckCircle2, PoundSterling, Calendar } from 'lucide-react';
import { Development, Block, SortOption, ViewMode } from '../types';
import { getBlockEstimatedRCA, getBlockProfessionalFee } from '../store';

interface DashboardPageProps {
  store: any;
  onSelectDevelopment: (dev: Development) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (devId: string) => void;
  onOpenDeleteModal: (devId: string) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
}

type DashboardTab = 'active' | 'completed' | 'library';

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  store, 
  onSelectDevelopment, 
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDeleteModal,
  activeMenuId,
  setActiveMenuId
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('active');
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);

  const filteredProjects = (() => {
    let base = store.filteredDevelopments;
    if (showFavouritesOnly) base = base.filter((d: Development) => d.isFavourite);
    if (!store.showArchived) base = base.filter((d: Development) => !d.isArchived);
    
    return base.filter((dev: Development) => {
      const isComplete = dev.blocks.length > 0 && dev.blocks.every(b => b.status === 'Completed');
      if (activeTab === 'active') return !isComplete;
      if (activeTab === 'completed') return isComplete;
      return true;
    });
  })();

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleToggleMenu = (e: React.MouseEvent, devId: string) => {
    e.stopPropagation();
    const uniqueId = `content-${devId}`;
    setActiveMenuId(activeMenuId === uniqueId ? null : uniqueId);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto pb-32 font-inter">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Calculation Center</h1>
          <p className="text-slate-600 mt-1 font-medium text-xs sm:text-sm">Professional Reinstatement Cost Assessment Management.</p>
        </div>

        <div className="flex gap-2 sm:gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-fit shrink-0 overflow-x-auto">
          <button onClick={() => setActiveTab('active')} className={`px-3 sm:px-6 py-2 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>In Progress</button>
          <button onClick={() => setActiveTab('completed')} className={`px-3 sm:px-6 py-2 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Finalized</button>
          <button onClick={() => setActiveTab('library')} className={`px-3 sm:px-6 py-2 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'library' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Library</button>
        </div>
      </header>

      <div className="flex justify-end mb-4 px-2">
        <button 
          onClick={onOpenCreateModal}
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
        >
          <Plus size={18} /> New Development
        </button>
      </div>

      <div className="bg-white p-2.5 rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-100 mb-6 sm:mb-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 relative flex items-center px-4">
          <Search className="text-slate-300 mr-4 shrink-0" size={20} />
          <input
            type="text"
            placeholder="Search developments..."
            value={store.searchTerm}
            onChange={e => store.setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-900 font-bold text-sm placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pr-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
          <div className="relative hidden sm:block">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            <select
              value={store.sortBy}
              onChange={(e) => store.setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-slate-50/50 border border-slate-100/50 rounded-[2rem] py-3 pl-14 pr-12 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer transition-all min-w-[210px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="value">Highest Value</option>
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
          </div>

          <button
            onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl border transition-all ${showFavouritesOnly ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
          >
            <Star size={18} fill={showFavouritesOnly ? "currentColor" : "none"} />
          </button>

          <button
            onClick={() => store.setShowArchived(!store.showArchived)}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl border transition-all ${store.showArchived ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
          >
            <Archive size={18} />
          </button>

          <div className="hidden sm:block h-8 w-px bg-slate-100 mx-2" />

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-[1.5rem]">
            <button onClick={() => store.setViewMode('grid')} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${store.viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}><Grid size={20} /></button>
            <button onClick={() => store.setViewMode('list')} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${store.viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}><List size={20} /></button>
          </div>
        </div>
      </div>

      <div className={store.viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" : "flex flex-col gap-4"}>
        {filteredProjects.map((dev: Development) => {
          const devTotalRCA = dev.blocks.reduce((acc, b) => acc + getBlockEstimatedRCA(b), 0);
          const completedBlocks = dev.blocks.filter(b => b.status === 'Completed').length;
          const progressPct = Math.round((completedBlocks / (dev.blocks.length || 1)) * 100);
          const isFullComplete = progressPct === 100 && dev.blocks.length > 0;
          const uniqueMenuId = `content-${dev.id}`;

          if (store.viewMode === 'grid') {
            return (
              <div 
                key={dev.id}
                onClick={() => onSelectDevelopment(dev)}
                className="group bg-white border border-slate-200 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 hover:border-blue-500 hover:shadow-2xl transition-all relative flex flex-col cursor-pointer"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100/50 shadow-inner">
                    <Star 
                      onClick={(e) => { e.stopPropagation(); store.toggleFavourite(dev.id); }}
                      size={24} 
                      className={`cursor-pointer transition-all ${dev.isFavourite ? 'text-amber-500 fill-amber-500' : 'text-amber-200'}`} 
                    />
                  </div>
                  <div className="relative">
                     <button 
                      onClick={(e) => handleToggleMenu(e, dev.id)}
                      className={`p-2 rounded-xl transition-all ${activeMenuId === uniqueMenuId ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:text-slate-900'}`}
                    >
                      <MoreVertical size={20} />
                    </button>
                    {activeMenuId === uniqueMenuId && (
                      <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                        <button onClick={(e) => { e.stopPropagation(); onOpenEditModal(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Edit3 size={14} className="text-blue-500" /> EDIT DETAILS</button>
                        <button onClick={(e) => { e.stopPropagation(); store.duplicateDevelopment(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Copy size={14} className="text-emerald-500" /> DUPLICATE</button>
                        <button onClick={(e) => { e.stopPropagation(); store.toggleFavourite(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Star size={14} className="text-amber-500" fill={dev.isFavourite ? "currentColor" : "none"} /> {dev.isFavourite ? 'UNFAVOURITE' : 'FAVOURITE'}</button>
                        <button onClick={(e) => { e.stopPropagation(); store.toggleArchive(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Archive size={14} className="text-slate-500" /> {dev.isArchived ? 'RESTORE' : 'ARCHIVE'}</button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button onClick={(e) => { e.stopPropagation(); onOpenDeleteModal(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Trash2 size={14} /> DELETE</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">{dev.reference}</p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                       <Calendar size={10} /> {formatDate(dev.createdAt)}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 truncate tracking-tight flex items-center gap-3">
                    {dev.name}
                    {isFullComplete && <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />}
                  </h3>
                </div>

                <div className="mt-auto space-y-6">
                   <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-semibold uppercase tracking-wider shadow-sm">
                          {completedBlocks} / {dev.blocks.length} Blocks Done
                        </span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Global Valuation</span>
                         <span className="text-3xl font-bold text-slate-900 tracking-tighter">£{devTotalRCA.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                         <PoundSterling size={14} className="text-blue-500" />
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Internal RCA Fee:</span>
                            <span className="text-sm font-bold text-blue-600">£{(dev.rcaFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[9px] font-semibold uppercase text-slate-400 tracking-widest">Sectional Progress</span>
                         <span className="text-[9px] font-semibold text-blue-600">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ease-out ${isFullComplete ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                </div>
              </div>
            );
          } else {
            return (
              <div key={dev.id} onClick={() => onSelectDevelopment(dev)} className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 group">
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100/50 shrink-0 hidden sm:block">
                  <Star onClick={(e) => { e.stopPropagation(); store.toggleFavourite(dev.id); }} size={20} className={dev.isFavourite ? 'text-amber-500 fill-amber-500' : 'text-amber-200'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{dev.name}</h3>
                    {isFullComplete && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Scheme No: {dev.reference}</p>
                    <span className="text-[10px] text-slate-300 hidden sm:inline">•</span>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden sm:block">Created: {formatDate(dev.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 sm:contents">
                  <div className="sm:w-24 shrink-0">
                     <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Blocks</p>
                     <p className="text-sm font-semibold text-slate-700">{completedBlocks}/{dev.blocks.length}</p>
                  </div>
                  <div className="hidden md:block w-32 shrink-0">
                     <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5 text-center">Internal Fee</p>
                     <p className="text-xs font-bold text-blue-600 text-center">£{(dev.rcaFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="shrink-0 ml-auto sm:w-48">
                     <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5 text-right">Global Valuation</p>
                     <p className="text-base sm:text-lg font-bold text-slate-900 text-right">£{devTotalRCA.toLocaleString()}</p>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => handleToggleMenu(e, dev.id)}
                    className={`p-2 rounded-xl transition-all ${activeMenuId === uniqueMenuId ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:text-slate-900'}`}
                  >
                    <MoreVertical size={20} />
                  </button>
                  {activeMenuId === uniqueMenuId && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                      <button onClick={(e) => { e.stopPropagation(); onOpenEditModal(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Edit3 size={14} className="text-blue-500" /> EDIT DETAILS</button>
                      <button onClick={(e) => { e.stopPropagation(); store.duplicateDevelopment(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Copy size={14} className="text-emerald-500" /> DUPLICATE</button>
                      <button onClick={(e) => { e.stopPropagation(); store.toggleFavourite(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Star size={14} className="text-amber-500" fill={dev.isFavourite ? "currentColor" : "none"} /> {dev.isFavourite ? 'UNFAVOURITE' : 'FAVOURITE'}</button>
                      <button onClick={(e) => { e.stopPropagation(); store.toggleArchive(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Archive size={14} className="text-slate-500" /> {dev.isArchived ? 'RESTORE' : 'ARCHIVE'}</button>
                      <div className="h-px bg-slate-100 my-1" />
                      <button onClick={(e) => { e.stopPropagation(); onOpenDeleteModal(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Trash2 size={14} /> DELETE</button>
                    </div>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default DashboardPage;