import React, { useState, useRef, useEffect } from 'react';
import { FileText, Download, Upload, Search, Filter, MoreVertical, List, FileBadge, Plus, Trash2, Edit3, Star, Archive, ChevronDown, Grid, ArrowRight, ShieldCheck, FileBox, X, AlertTriangle, Eye, Loader2, Database, Zap, Copy } from 'lucide-react';
import { Report, Template, SortOption, ViewMode } from '../types';
import mammoth from "mammoth";
import * as docx from "docx-preview";

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-GB', { 
    maximumFractionDigits: 0,
    minimumFractionDigits: 0 
  });
};

const formatDate = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface ReportsPageProps {
  store: any;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ store, activeMenuId, setActiveMenuId }) => {
  const [activeTab, setActiveTab] = useState<'staging' | 'finalized' | 'templates'>('staging');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isDeciphering, setIsDeciphering] = useState(false);
  
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isRenderingDoc, setIsRenderingDoc] = useState(false);

  // Template Upload States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');

  // Edit State
  const [renamingReport, setRenamingReport] = useState<Report | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, type: 'report' | 'template' } | null>(null);

  const reportFileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const docPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewTemplate?.docBuffer && docPreviewRef.current) {
      setIsRenderingDoc(true);
      docPreviewRef.current.innerHTML = '';
      docx.renderAsync(previewTemplate.docBuffer, docPreviewRef.current, undefined, {
        className: "docx-viewer",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        renderHeaders: true, 
        renderFooters: true, 
        renderFootnotes: true,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        useBase64URL: true,
        experimental: true,
        trimXmlDeclaration: true,
        debug: false
      }).then(() => {
        setIsRenderingDoc(false);
      }).catch(err => {
        console.error("Rendering error:", err);
        setIsRenderingDoc(false);
      });
    }
  }, [previewTemplate]);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const uniqueId = `reports-${id}`;
    setActiveMenuId(activeMenuId === uniqueId ? null : uniqueId);
  };

  const handleCreateTemplate = async () => {
    if (uploadedFile && templateName) {
      setIsDeciphering(true);
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const textResult = await mammoth.extractRawText({ arrayBuffer });
        const tagRegex = /\{{1,2}[A-Za-z0-9_]+\}{1,2}/g;
        const matches = textResult.value.match(tagRegex) || [];
        const uniqueTags = Array.from(new Set(matches));
        store.addTemplateFromFile(templateName, store.user?.company || '', '1.0', {
          brandColor: '#0f172a',
          headerTitle: templateName.toUpperCase(),
          hasLogo: true,
          logoPos: 'left',
          sections: [{ title: 'Overview', type: 'text' }],
          mergeFields: uniqueTags
        }, arrayBuffer);
      } catch (error) { console.error(error); }
      setIsDeciphering(false);
      setIsUploadModalOpen(false);
      setUploadedFile(null);
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId);
    await new Promise(resolve => setTimeout(resolve, 2000));
    store.updateReport(reportId, { status: 'Ready', generatedAt: new Date().toISOString() });
    setIsGenerating(null);
    setActiveTab('finalized');
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    if (deleteConfirmation.type === 'report') store.deleteReport(deleteConfirmation.id);
    else if (deleteConfirmation.type === 'template') store.deleteTemplate(deleteConfirmation.id);
    setDeleteConfirmation(null);
  };

  const filteredItems = (() => {
    let items = activeTab === 'templates' ? store.templates : store.reports;
    return items.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArchive = showArchived ? item.isArchived : !item.isArchived;
      const matchesFav = showFavouritesOnly ? item.isFavourite : true;
      if (activeTab === 'staging') return matchesSearch && matchesArchive && matchesFav && item.status === 'Staging';
      if (activeTab === 'finalized') return matchesSearch && matchesArchive && matchesFav && item.status === 'Ready';
      return matchesSearch && matchesArchive && matchesFav;
    });
  })();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-32 font-inter">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Report Center</h1>
          <p className="text-slate-600 mt-1 font-medium text-sm">Stage, review, and manage high-fidelity RCA reports.</p>
        </div>

        <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-fit shrink-0">
          <button onClick={() => setActiveTab('staging')} className={`px-6 py-2 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'staging' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>In Progress</button>
          <button onClick={() => setActiveTab('finalized')} className={`px-6 py-2 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'finalized' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Finalized</button>
          <button onClick={() => setActiveTab('templates')} className={`px-6 py-2 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Library</button>
        </div>
      </header>

      <div className="flex justify-end mb-4 px-2">
        {activeTab === 'templates' ? (
          <button onClick={() => setIsUploadModalOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-semibold uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"><Plus size={18} /> Register Template</button>
        ) : activeTab === 'staging' ? (
          <button onClick={() => reportFileInputRef.current?.click()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-semibold uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"><Upload size={18} /> Import Report</button>
        ) : null}
        <input type="file" ref={reportFileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) store.addReportFromDoc(f.name); }} className="hidden" accept=".docx" />
      </div>

      <div className="bg-white p-2.5 rounded-[3rem] shadow-sm border border-slate-100 mb-10 flex items-center gap-4">
        <div className="flex-1 relative flex items-center px-4">
          <Search className="text-slate-300 mr-4" size={22} />
          <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent border-none outline-none text-slate-900 font-bold text-sm placeholder:text-slate-300" />
        </div>

        <div className="flex items-center gap-3 pr-2 shrink-0">
          <div className="relative">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="appearance-none bg-slate-50/50 border border-slate-100/50 rounded-[2rem] py-3 pl-14 pr-12 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer transition-all min-w-[210px]">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="value">Highest Value</option>
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
          </div>

          <button onClick={() => setShowFavouritesOnly(!showFavouritesOnly)} className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${showFavouritesOnly ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}><Star size={20} fill={showFavouritesOnly ? "currentColor" : "none"} /></button>
          <button onClick={() => setShowArchived(!showArchived)} className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${showArchived ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}><Archive size={20} /></button>
          <div className="h-8 w-px bg-slate-100 mx-2" />
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-[1.5rem]">
            <button onClick={() => setViewMode('grid')} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-300 hover:text-slate-50'}`}><Grid size={20} /></button>
            <button onClick={() => setViewMode('list')} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-300 hover:text-slate-50'}`}><List size={20} /></button>
          </div>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-4"}>
        {filteredItems.map((item: any) => {
          const uniqueMenuId = `reports-${item.id}`;
          if (viewMode === 'grid') {
            return (
              <div key={item.id} className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:border-blue-500 hover:shadow-2xl transition-all relative flex flex-col cursor-pointer">
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100/50 shadow-inner">
                    <Star onClick={(e) => { e.stopPropagation(); activeTab === 'templates' ? store.toggleTemplateFavourite(item.id) : store.toggleReportFavourite(item.id); }} size={24} className={`cursor-pointer transition-all ${item.isFavourite ? 'text-amber-500 fill-amber-500' : 'text-amber-200'}`} />
                  </div>
                  <div className="relative">
                    <button onClick={(e) => toggleMenu(e, item.id)} className={`p-2 rounded-xl transition-all ${activeMenuId === uniqueMenuId ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:text-slate-600'}`}><MoreVertical size={20} /></button>
                    {activeMenuId === uniqueMenuId && (
                      <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] animate-in fade-in zoom-in-95 duration-150 text-left">
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Edit3 size={14} className="text-blue-500" /> EDIT DETAILS</button>
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Copy size={14} className="text-emerald-500" /> DUPLICATE</button>
                        <button onClick={(e) => { e.stopPropagation(); activeTab === 'templates' ? store.toggleTemplateFavourite(item.id) : store.toggleReportFavourite(item.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Star size={14} className="text-amber-500" fill={item.isFavourite ? "currentColor" : "none"} /> {item.isFavourite ? 'UNFAVOURITE' : 'FAVOURITE'}</button>
                        <button onClick={(e) => { e.stopPropagation(); activeTab === 'templates' ? store.toggleTemplateArchive(item.id) : store.toggleReportArchive(item.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Archive size={14} className="text-slate-500" /> {item.isArchived ? 'RESTORE' : 'ARCHIVE'}</button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmation({ id: item.id, type: activeTab === 'templates' ? 'template' : 'report' }); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Trash2 size={14} /> DELETE</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mb-8">
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.3em] mb-2 ${activeTab === 'templates' ? 'text-emerald-500' : 'text-blue-500'}`}>{activeTab === 'templates' ? 'DOCX Master' : `REF: ${item.reference}`}</p>
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight truncate tracking-tight">{item.name}</h3>
                  {activeTab === 'templates' && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">{item.company}</p>}
                </div>
                <div className="mt-auto">
                   {activeTab !== 'templates' && (
                     <div className="flex items-end justify-between mb-8">
                        <div className="flex flex-col"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Asset Value</span><span className="text-3xl font-bold text-slate-900 tracking-tighter">£{formatNumber(item.value || 0)}</span></div>
                        <span className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-slate-100">{item.blockCount || 1} Blocks</span>
                     </div>
                   )}
                   <div className="pt-6 border-t border-slate-100">
                    {activeTab === 'staging' ? (
                      <button onClick={(e) => { e.stopPropagation(); handleGenerateReport(item.id); }} disabled={isGenerating === item.id} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">{isGenerating === item.id ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={16} /> Imprint Assets</>}</button>
                    ) : activeTab === 'finalized' ? (
                      <div className="flex gap-3 w-full"><button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-semibold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all"><Download size={16} /> Word</button><button className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-2xl font-semibold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 border border-slate-200 hover:bg-white transition-all"><Download size={16} /> PDF</button></div>
                    ) : (
                      <div className="flex items-center justify-between w-full"><div className="flex flex-col"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Version Control</span><span className="text-[14px] font-bold text-slate-900">v{item.version}</span></div><button onClick={(e) => { e.stopPropagation(); setPreviewTemplate(item); }} className="px-6 py-2.5 bg-slate-50 text-slate-900 rounded-xl font-semibold uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-white transition-all flex items-center gap-2"><Eye size={14} /> Preview</button></div>
                    )}
                   </div>
                </div>
              </div>
            );
          } else {
            return (
              <div key={item.id} className="bg-white border border-slate-200 transition-all group relative overflow-visible flex flex-row items-center p-6 rounded-[2rem] hover:border-blue-300 hover:shadow-xl cursor-pointer">
                <div className="flex-1 min-w-0 flex items-center gap-12">
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{item.name}</h3>
                        <button onClick={(e) => { e.stopPropagation(); activeTab === 'templates' ? store.toggleTemplateFavourite(item.id) : store.toggleReportFavourite(item.id); }} className={`p-1.5 rounded-lg transition-all ${item.isFavourite ? 'text-amber-500 bg-amber-50' : 'text-slate-200 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}><Star size={18} fill={item.isFavourite ? 'currentColor' : 'none'} /></button>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] truncate">{activeTab === 'templates' ? item.company : `REF: ${item.reference}`}</p>
                   </div>
                   <div className="flex items-center gap-12 shrink-0">
                      {activeTab !== 'templates' && (<div className="w-32"><p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Value</p><p className="text-sm font-bold text-slate-700">£{formatNumber(item.value || 0)}</p></div>)}
                      <div className="w-32"><p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{activeTab === 'templates' ? 'Updated' : 'Last Sync'}</p><p className="text-xs font-bold text-slate-500">{formatDate(item.updatedAt || item.date)}</p></div>
                   </div>
                </div>
                <div className="ml-8 flex items-center gap-3 relative">
                   {activeTab === 'staging' && (<button onClick={(e) => { e.stopPropagation(); handleGenerateReport(item.id); }} disabled={isGenerating === item.id} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-semibold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">{isGenerating === item.id ? <Loader2 size={14} className="animate-spin" /> : 'Imprint'}</button>)}
                   <button onClick={(e) => toggleMenu(e, item.id)} className={`p-2 rounded-xl transition-all ${activeMenuId === uniqueMenuId ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:text-slate-600'}`}><MoreVertical size={20} /></button>
                   {activeMenuId === uniqueMenuId && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] animate-in fade-in zoom-in-95 duration-150 text-left">
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Edit3 size={14} className="text-blue-500" /> EDIT DETAILS</button>
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Copy size={14} className="text-emerald-500" /> DUPLICATE</button>
                        <button onClick={(e) => { e.stopPropagation(); activeTab === 'templates' ? store.toggleTemplateFavourite(item.id) : store.toggleReportFavourite(item.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Star size={14} className="text-amber-500" fill={item.isFavourite ? "currentColor" : "none"} /> {item.isFavourite ? 'UNFAVOURITE' : 'FAVOURITE'}</button>
                        <button onClick={(e) => { e.stopPropagation(); activeTab === 'templates' ? store.toggleTemplateArchive(item.id) : store.toggleReportArchive(item.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Archive size={14} className="text-slate-500" /> {item.isArchived ? 'RESTORE' : 'ARCHIVE'} </button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmation({ id: item.id, type: activeTab === 'templates' ? 'template' : 'report' }); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest text-left"><Trash2 size={14} /> DELETE</button>
                    </div>
                   )}
                </div>
              </div>
            );
          }
        })}
      </div>

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertTriangle size={40} /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Permanently remove from the report hub layer?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-4 text-slate-500 font-semibold uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-600 text-white font-semibold uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-2xl shadow-lg shadow-red-100 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .docx-container-custom { all: initial; font-family: initial; }
        .docx-container-custom .docx-wrapper { padding: 0 !important; background: transparent !important; display: flex !important; flex-direction: column !important; align-items: center !important; }
        .docx-container-custom .docx-viewer { box-shadow: 0 40px 100px rgba(0,0,0,0.1) !important; margin-bottom: 50px !important; max-width: 100% !important; width: 100% !important; background: white !important; position: relative !important; box-sizing: border-box !important; }
      `}} />
    </div>
  );
};

export default ReportsPage;