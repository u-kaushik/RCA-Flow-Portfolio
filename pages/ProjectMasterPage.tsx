import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Building2, LayoutGrid, Hammer, Info, Plus, ArrowRight, ShieldCheck, Ruler, TrendingUp, FileText, CheckCircle2, Lock, Upload, File, Trash2, Edit3, Download, AlertTriangle, PoundSterling, Archive, Star, FileBox, GripVertical, SortAsc, SortDesc, MoreVertical, X, Loader2, Calendar, Database, List } from 'lucide-react';
import { Development, Block, ProjectDocument, ExternalsAssessment, Report } from '../types';
import { getBlockEstimatedRCA, getDevelopmentTotalRCA, getExternalsTotal } from '../store';

const formatNumber = (num: number): string => {
  if (num === 0) return '0.00';
  return num.toLocaleString('en-GB', { 
    maximumFractionDigits: 2, 
    minimumFractionDigits: 2 
  });
};

const formatDateLong = (isoStr: string) => {
  if (!isoStr) return 'N/A';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

interface ProjectMasterPageProps {
  development: Development;
  onSelectBlock: (block: Block) => void;
  onSelectExternals: (assessment: ExternalsAssessment) => void;
  onUpdateDevelopment: (dev: Development) => void;
  onEditDevelopment: (dev: Development) => void;
  onArchiveDevelopment: (id: string) => void;
  onDeleteDevelopment: (id: string) => void;
  onToggleFavourite: (id: string) => void;
  onBack: () => void;
  onNavigateReports?: () => void;
  store?: any;
}

const ProjectMasterPage: React.FC<ProjectMasterPageProps> = ({ 
  development, 
  onSelectBlock, 
  onSelectExternals,
  onUpdateDevelopment,
  onEditDevelopment,
  onArchiveDevelopment,
  onDeleteDevelopment,
  onToggleFavourite,
  onBack,
  onNavigateReports,
  store
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'docs'>('summary');
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');
  const [deleteDocTarget, setDeleteDocTarget] = useState<string | null>(null);
  const [isPackaging, setIsPackaging] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateDev = (updates: Partial<Development>) => {
    onUpdateDevelopment({ ...development, ...updates });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs: ProjectDocument[] = Array.from(files).map((file: File) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      displayName: file.name.split('.').slice(0, -1).join('.'), 
      originalFileName: file.name,
      fileType: file.name.split('.').pop() || 'file',
      uploadDate: new Date().toISOString().split('T')[0],
      author: store?.user?.firstName ? `${store.user.firstName} ${store.user.lastName}` : 'Senior Surveyor',
      url: '#' 
    }));

    updateDev({ documents: [...(development.documents || []), ...newDocs] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateDocumentName = (id: string, newName: string) => {
    const next = (development.documents || []).map(d => d.id === id ? { ...d, displayName: newName } : d);
    updateDev({ documents: next });
  };

  const handleDeleteDocument = () => {
    if (!deleteDocTarget) return;
    updateDev({ documents: (development.documents || []).filter(d => d.id !== deleteDocTarget) });
    setDeleteDocTarget(null);
  };

  const handleGenerateReport = async () => {
    if (store) {
      setIsPackaging(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      store.addReport(development);
      setIsPackaging(false);
      if (onNavigateReports) onNavigateReports();
    }
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.setData('text/plain', blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
  };

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === targetBlockId) {
      setDraggedBlockId(null);
      return;
    }

    const blocks = [...development.blocks];
    const sourceIdx = blocks.findIndex(b => b.id === sourceId);
    const targetIdx = blocks.findIndex(b => b.id === targetBlockId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedBlock] = blocks.splice(sourceIdx, 1);
      blocks.splice(targetIdx, 0, movedBlock);
      updateDev({ blocks });
    }
    setDraggedBlockId(null);
  };

  const sortBlocksAZ = () => {
    const blocks = [...development.blocks].sort((a, b) => a.name.localeCompare(b.name));
    updateDev({ blocks });
    setIsProjectMenuOpen(false);
  };

  const sortBlocksZA = () => {
    const blocks = [...development.blocks].sort((a, b) => b.name.localeCompare(a.name));
    updateDev({ blocks });
    setIsProjectMenuOpen(false);
  };

  const totalDevRCA = getDevelopmentTotalRCA(development);
  const externalsTotal = getExternalsTotal(development.externalsAssessment);
  
  const blocks = development.blocks || [];
  const completedBlocksCount = blocks.filter(b => b.status === 'Completed').length;
  const isExternalsComplete = development.externalsAssessment.status === 'Completed';
  
  const isProjectComplete = blocks.length > 0 && 
                            completedBlocksCount === blocks.length && 
                            isExternalsComplete;

  const alreadyInStaging = store?.reports?.some((r: Report) => r.developmentId === development.id && !r.isArchived) || false;

  const ProgressBar = ({ current, total, color = 'blue', showLabel = false }: { current: number, total: number, color?: 'blue' | 'emerald' | 'white', showLabel?: boolean }) => {
    const pct = Math.min(100, Math.max(0, (current / (total || 1)) * 100));
    const bgColor = color === 'emerald' ? 'bg-emerald-500' : color === 'white' ? 'bg-white' : 'bg-blue-500';
    const trackColor = color === 'white' ? 'bg-white/20' : 'bg-slate-100';
    
    return (
      <div className="w-full">
        <div className={`w-full h-1.5 ${trackColor} rounded-full overflow-hidden mt-2`}>
          <div 
            className={`h-full transition-all duration-1000 ${bgColor}`} 
            style={{ width: `${pct}%` }} 
          />
        </div>
        {showLabel && <p className="text-[9px] font-semibold uppercase tracking-widest mt-1 opacity-70">{Math.round(pct)}% Completed</p>}
      </div>
    );
  };

  const maturityPercent = Math.round(((completedBlocksCount + (isExternalsComplete ? 1 : 0)) / (blocks.length + 1)) * 100);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 font-inter relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button onClick={onBack} className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all border border-slate-200 shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">{development.name}</h1>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavourite(development.id); }}
                className={`transition-all p-1 sm:p-1.5 rounded-xl shrink-0 ${development.isFavourite ? 'text-amber-500 bg-amber-50 shadow-sm border border-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                title={development.isFavourite ? "Remove from Favourites" : "Add to Favourites"}
              >
                <Star size={18} fill={development.isFavourite ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              <span>Scheme Number: {development.reference} • Registered: {formatDateLong(development.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 pr-6 mr-2 relative">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onEditDevelopment(development)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Edit Attributes"
              >
                <Edit3 size={18} />
              </button>
              
              <div className="relative" ref={projectMenuRef}>
                <button 
                  onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                  className={`p-2 rounded-xl transition-all ${isProjectMenuOpen ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                  title="Project Options"
                >
                  <MoreVertical size={18} />
                </button>
                {isProjectMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <p className="px-3 py-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Layout View</p>
                    <button onClick={() => { setViewMode('grid'); setIsProjectMenuOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-colors uppercase tracking-widest text-left ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <LayoutGrid size={14} /> Grid Layout
                    </button>
                    <button onClick={() => { setViewMode('row'); setIsProjectMenuOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-colors uppercase tracking-widest text-left ${viewMode === 'row' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <List size={14} /> Row Layout
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    
                    <p className="px-3 py-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Sorting</p>
                    <button onClick={sortBlocksAZ} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left">
                      <SortAsc size={14} className="text-blue-500" /> Sort A-Z
                    </button>
                    <button onClick={sortBlocksZA} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left">
                      <SortDesc size={14} className="text-blue-500" /> Sort Z-A
                    </button>
                    <div className="h-px bg-slate-100 my-1" />

                    <p className="px-3 py-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Management</p>
                    <button 
                      onClick={() => { onArchiveDevelopment(development.id); setIsProjectMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left"
                    >
                      <Archive size={14} className="text-slate-500" /> {development.isArchived ? 'Restore Project' : 'Archive Project'}
                    </button>
                    <button 
                      onClick={() => { onDeleteDevelopment(development.id); setIsProjectMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-widest text-left"
                    >
                      <Trash2 size={14} /> Delete Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-slate-900 px-3 sm:px-4 py-2 rounded-xl text-right flex items-center gap-2 sm:gap-4 shadow-lg shadow-slate-200">
             <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-slate-500 hidden sm:block">Global RCA</p>
             <p className="text-sm sm:text-md font-bold text-blue-400">£{formatNumber(totalDevRCA)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 sm:space-y-10 pb-24">
        {/* Project KPI HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
           <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm">
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Building Assets</p>
              <div className="flex items-center gap-2 sm:gap-3">
                 <Building2 size={18} className="text-blue-600 shrink-0" />
                 <h4 className="text-lg sm:text-2xl font-bold text-slate-900">{blocks.length} Blocks</h4>
              </div>
              <ProgressBar current={completedBlocksCount} total={blocks.length} />
           </div>

           <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm">
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Site Externals</p>
              <div className="flex items-center gap-2 sm:gap-3">
                 <Hammer size={18} className="text-emerald-600 shrink-0" />
                 <h4 className="text-lg sm:text-2xl font-bold text-slate-900">{isExternalsComplete ? 'Finalized' : 'Draft'}</h4>
              </div>
              <ProgressBar current={isExternalsComplete ? 1 : 0} total={1} color="emerald" />
           </div>

           <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm">
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Internal Dept Fee</p>
              <div className="flex items-center gap-2 sm:gap-3">
                 <PoundSterling size={18} className="text-blue-500 shrink-0" />
                 <h4 className="text-lg sm:text-2xl font-bold text-slate-900">£{(development.rcaFee || 0).toLocaleString()}</h4>
              </div>
           </div>

           <div className="bg-blue-600 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-blue-100 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-blue-100 uppercase tracking-widest mb-1 relative z-10">Project Maturity</p>
              <h4 className="text-lg sm:text-2xl font-bold text-white relative z-10">
                {maturityPercent}% Complete
              </h4>
              <div className="relative z-10 mt-1">
                <ProgressBar current={completedBlocksCount + (isExternalsComplete ? 1 : 0)} total={blocks.length + 1} color="white" />
              </div>
           </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 sm:gap-4 p-1 bg-slate-200/50 rounded-2xl w-fit">
            <button onClick={() => setActiveTab('summary')} className={`px-4 sm:px-8 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Summary & Blocks</button>
            <button onClick={() => setActiveTab('docs')} className={`px-4 sm:px-8 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'docs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Documents ({development.documents?.length || 0})</button>
          </div>

          {activeTab === 'summary' && (
            <button
              onClick={handleGenerateReport}
              disabled={isPackaging || !isProjectComplete || alreadyInStaging}
              className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-semibold uppercase text-[10px] sm:text-[11px] tracking-widest transition-all shadow-xl w-full sm:w-auto justify-center ${
                alreadyInStaging ? 'bg-emerald-500 text-white shadow-emerald-100' :
                isProjectComplete ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isPackaging ? <Loader2 size={16} className="animate-spin" /> :
               alreadyInStaging ? <><CheckCircle2 size={16} /> Asset In Staging</> :
               isProjectComplete ? <><FileText size={16} /> Finalize & Imprint</> : <><Lock size={16} /> Complete Sections to Finalize</>}
            </button>
          )}
        </div>

        {activeTab === 'summary' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-8">
              {/* Blocks Grid including Externals */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h3 className="text-xl font-bold text-slate-900 tracking-tight">Project Components</h3>
                   <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{completedBlocksCount + (isExternalsComplete ? 1 : 0)} of {blocks.length + 1} Verified</span>
                </div>
                
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" : "space-y-4"}>
                  {/* Shared Site Externals Item styled as a Block */}
                  <div 
                    onClick={() => onSelectExternals(development.externalsAssessment)}
                    className={`group bg-white rounded-[2.5rem] border transition-all cursor-pointer relative overflow-hidden flex ${viewMode === 'grid' ? 'flex-col h-64 p-8' : 'flex-row items-center p-6 gap-6'} ${isExternalsComplete ? 'border-emerald-500/30 hover:border-emerald-500' : 'border-slate-200 hover:border-emerald-500 hover:shadow-2xl hover:-translate-y-1'}`}
                  >
                    <div className={`flex items-start relative z-10 ${viewMode === 'grid' ? 'justify-between mb-6' : 'shrink-0'}`}>
                       <div className={`rounded-2xl flex items-center justify-center shadow-lg transition-colors ${viewMode === 'grid' ? 'p-3' : 'p-2.5'} ${isExternalsComplete ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white group-hover:bg-emerald-600'}`}>
                          <Hammer size={viewMode === 'grid' ? 20 : 18} />
                       </div>
                       {viewMode === 'grid' && (
                         <div className={`px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest flex items-center gap-2 ${isExternalsComplete ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {isExternalsComplete ? <><CheckCircle2 size={12} /> Finalized</> : <><Circle size={12} /> Draft</>}
                         </div>
                       )}
                    </div>

                    <div className={`relative z-10 flex-1 ${viewMode === 'grid' ? 'mb-6' : 'min-w-0'}`}>
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">Site Externals</h4>
                      <p className={`text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5 ${viewMode === 'grid' ? 'truncate' : ''}`}>Shared Infrastructure</p>
                    </div>

                    <div className={`flex items-center justify-between relative z-10 ${viewMode === 'grid' ? 'mt-auto border-t border-slate-50 pt-6' : 'w-56 border-l border-slate-50 pl-6'}`}>
                       <div className="min-w-0">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Externals RCA</p>
                          <p className="text-xl font-bold text-slate-900 truncate">£{externalsTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                       </div>
                       <div className={`p-2 rounded-xl transition-all ${isExternalsComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                          <ArrowRight size={20} />
                       </div>
                    </div>
                    {viewMode === 'row' && (
                       <div className="w-40 flex justify-center shrink-0">
                         <div className={`px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest flex items-center gap-2 ${isExternalsComplete ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {isExternalsComplete ? <><CheckCircle2 size={12} /> Finalized</> : <><Circle size={12} /> Draft</>}
                         </div>
                       </div>
                    )}
                  </div>

                  {/* Existing Blocks */}
                  {blocks.map((block) => (
                    <div 
                      key={block.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, block.id)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, block.id)}
                      onClick={() => onSelectBlock(block)}
                      className={`group bg-white rounded-[2.5rem] border transition-all cursor-pointer relative overflow-hidden flex ${viewMode === 'grid' ? 'flex-col h-64 p-8' : 'flex-row items-center p-6 gap-6'} ${draggedBlockId === block.id ? 'opacity-30 border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1'}`}
                    >
                      <div className={`flex items-start relative z-10 ${viewMode === 'grid' ? 'justify-between mb-6' : 'shrink-0'}`}>
                         <div className={`bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors ${viewMode === 'grid' ? 'p-3' : 'p-2.5'}`}>
                            <Building2 size={viewMode === 'grid' ? 20 : 18} />
                         </div>
                         {viewMode === 'grid' && (
                           <div className={`px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest flex items-center gap-2 ${block.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {block.status === 'Completed' ? <><CheckCircle2 size={12} /> Verified</> : <><Circle size={12} /> In Progress</>}
                           </div>
                         )}
                      </div>

                      <div className={`relative z-10 flex-1 min-w-0 ${viewMode === 'grid' ? 'mb-6' : ''}`}>
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{block.name}</h4>
                        <p className={`text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5 truncate`}>{block.reference}</p>
                      </div>

                      <div className={`flex items-center justify-between relative z-10 ${viewMode === 'grid' ? 'mt-auto border-t border-slate-50 pt-6' : 'w-56 border-l border-slate-50 pl-6'}`}>
                         <div className="min-w-0">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Asset RCA</p>
                            <p className="text-xl font-bold text-slate-900 truncate">£{getBlockEstimatedRCA(block).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                         </div>
                         <div className="p-2 bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all">
                            <ArrowRight size={20} />
                         </div>
                      </div>
                      
                      {viewMode === 'row' && (
                         <div className="w-40 flex justify-center shrink-0">
                           <div className={`px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest flex items-center gap-2 ${block.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {block.status === 'Completed' ? <><CheckCircle2 size={12} /> Verified</> : <><Circle size={12} /> In Progress</>}
                           </div>
                         </div>
                      )}

                      <div className={`absolute left-0 transform opacity-0 group-hover:opacity-100 transition-all p-2 cursor-grab active:cursor-grabbing text-slate-200 group-hover:text-blue-100 ${viewMode === 'grid' ? 'top-1/2 -translate-y-1/2' : 'top-1/2 -translate-y-1/2'}`}>
                         <GripVertical size={viewMode === 'grid' ? 24 : 18} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mt-6 sm:mt-10">
                 <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
                    <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Database size={16} className="text-blue-500" /> Valuation Overview
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Building Blocks Sum</p>
                          <p className="text-sm font-bold text-slate-700">£{formatNumber(totalDevRCA - (externalsTotal * (1 + (development.externalsAssessment.fees?.professionalPercent || 0) / 100)))}</p>
                       </div>
                       <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                          <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest mb-1">Site Externals</p>
                          <p className="text-sm font-bold text-emerald-700">£{formatNumber(externalsTotal)}</p>
                       </div>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-3xl flex items-center justify-between">
                       <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Global Reinstatement</p>
                       <p className="text-2xl font-bold text-blue-400">£{formatNumber(totalDevRCA)}</p>
                    </div>
                 </div>

                 <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                    <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6">
                      <ShieldCheck size={16} className="text-blue-500" /> Administrative Logic
                    </h4>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                       <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Created By</p>
                          <p className="text-xs font-bold text-slate-700">{development.ownerName || 'Senior Building Surveyor'}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{development.ownerRole || 'Surveyor'}</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Registration Date</p>
                          <p className="text-xs font-bold text-slate-700">{new Date(development.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                       </div>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">Valuation comprises verified architectural components and site-wide shared infrastructure provisions on a day-one reinstatement basis.</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Project Archive</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Schedules, Specs, and Evidentiary Documents</p>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                  >
                    <Upload size={16} /> Batch Upload
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50/50 border-b border-slate-100">
                     <tr>
                       <th className="px-10 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Document Title</th>
                       <th className="px-6 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Extension</th>
                       <th className="px-6 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Upload Date</th>
                       <th className="px-10 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {(development.documents || []).map((doc) => (
                       <tr key={doc.id} className="hover:bg-slate-50/50 transition-all group">
                         <td className="px-10 py-4">
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                 <File size={18} />
                              </div>
                              <input 
                                value={doc.displayName}
                                onChange={e => updateDocumentName(doc.id, e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 w-full focus:ring-2 focus:ring-blue-500/10 rounded px-2"
                              />
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-semibold uppercase tracking-widest">{doc.fileType}</span>
                         </td>
                         <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                           {doc.uploadDate}
                         </td>
                         <td className="px-10 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors" title="Download Asset"><Download size={18} /></button>
                               <button onClick={() => setDeleteDocTarget(doc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Delete Asset"><Trash2 size={18} /></button>
                            </div>
                         </td>
                       </tr>
                     ))}
                     {(!development.documents || development.documents.length === 0) && (
                       <tr>
                         <td colSpan={4} className="px-10 py-32 text-center">
                            <FileBox size={64} className="mx-auto text-slate-100 mb-6" />
                            <h4 className="text-slate-400 font-semibold uppercase text-sm tracking-widest">Project archive is empty</h4>
                            <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-widest mt-2">Upload schedules or photos to begin centralizing your survey data.</p>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Internal Modals */}
      {deleteDocTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertTriangle size={40} /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Asset?</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">This document will be removed from the project archive permanently.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteDocTarget(null)} className="flex-1 py-4 text-slate-500 font-semibold uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all">Cancel</button>
              <button onClick={handleDeleteDocument} className="flex-1 py-4 bg-red-600 text-white font-semibold uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-2xl shadow-lg shadow-red-100 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal utility component
const Circle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export default ProjectMasterPage;