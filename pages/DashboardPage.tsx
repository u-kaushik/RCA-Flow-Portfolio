import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Grid, List, Building2, Calendar, FileBox, ArrowRight, Upload, X, Check, AlertCircle, FileSpreadsheet, Info, TrendingUp, MoreVertical, Trash2, Copy, FileBadge, Star, Archive, Filter, ChevronDown, ChevronLeft, Table, AlertTriangle, MapPin, Edit3 } from 'lucide-react';
import { Development, Block, SortOption } from '../types';
import { getBlockEstimatedRCA } from '../store';

interface DashboardPageProps {
  store: any;
  onSelectDevelopment: (dev: Development) => void;
  onEditDevelopment?: (dev: Development) => void;
}

type WizardStep = 'mode' | 'details-project' | 'details-blocks' | 'import-upload' | 'import-mapping' | 'import-preview' | 'template-select';

const DashboardPage: React.FC<DashboardPageProps> = ({ store, onSelectDevelopment, onEditDevelopment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('mode');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  
  const [devName, setDevName] = useState('');
  const [devRef, setDevRef] = useState('');
  const [devAddress, setDevAddress] = useState('');
  const [devTown, setDevTown] = useState('');
  const [devPostcode, setDevPostcode] = useState('');
  
  const [blockCountInput, setBlockCountInput] = useState<string>('1');
  const [blockDefaults, setBlockDefaults] = useState({
    status: 'Draft'
  });

  const [fileName, setFileName] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setIsModalOpen(false);
    setWizardStep('mode');
    setDevName('');
    setDevRef('');
    setDevAddress('');
    setDevTown('');
    setDevPostcode('');
    setBlockCountInput('1');
    setBlockDefaults({ status: 'Draft' });
    setFileName(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setImportErrors([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length > 0) {
        const detectedHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setCsvHeaders(detectedHeaders);
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return detectedHeaders.reduce((obj, header, i) => {
            obj[header] = values[i];
            return obj;
          }, {} as any);
        }).filter(r => Object.values(r).some(v => v));
        setCsvRows(rows);
        setWizardStep('import-mapping');
      }
    };
    reader.readAsText(file);
  };

  const validateMapping = () => {
    const errors: string[] = [];
    if (!mapping['name']) errors.push("You must map a column to 'Block Name'.");
    setImportErrors(errors);
    return errors.length === 0;
  };

  const handleCreateProject = () => {
    let newDev: Development | null = null;
    const finalBlockCount = Math.max(1, parseInt(blockCountInput) || 1);
    
    const devDetails = {
      addressLine: devAddress,
      town: devTown,
      postcode: devPostcode
    };

    if (wizardStep === 'details-blocks') {
      newDev = store.addDevelopment(devName, devRef, finalBlockCount, blockDefaults, devDetails);
    } else if (wizardStep === 'import-mapping' || wizardStep === 'import-preview') {
      if (!validateMapping()) return;
      const blockData = csvRows.map(row => {
        const block: any = {};
        (Object.entries(mapping) as [string, string][]).forEach(([fieldKey, csvHeader]) => {
          if (csvHeader) {
            let val = row[csvHeader];
            if (fieldKey === 'numberOfUnits') val = parseInt(val) || 0;
            block[fieldKey] = val;
          }
        });
        return block;
      });
      newDev = store.createDevelopmentFromImport(devName, devRef, blockData, devDetails);
    }

    if (newDev) {
      onSelectDevelopment(newDev);
      resetState();
    }
  };

  const handleNextStep = () => {
    if (wizardStep === 'details-project') {
      if (devName && devRef) setWizardStep('details-blocks');
    } else if (wizardStep === 'import-mapping') {
      if (validateMapping()) setWizardStep('import-preview');
    }
  };

  const handleBack = () => {
    if (wizardStep === 'details-project' || wizardStep === 'import-upload') {
      setWizardStep('mode');
    } else if (wizardStep === 'details-blocks') {
      setWizardStep('details-project');
    } else if (wizardStep === 'import-mapping') {
      setWizardStep('import-upload');
    } else if (wizardStep === 'import-preview') {
      setWizardStep('import-mapping');
    }
  };

  const filteredProjects = store.filteredDevelopments.filter((d: Development) => 
    showFavouritesOnly ? d.isFavourite : true
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">RCA Hub</h1>
          <p className="text-slate-600 mt-1 font-medium text-sm">Professional Reinstatement Cost Assessment Management.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 shrink-0"
        >
          <Plus size={20} />
          New Development
        </button>
      </header>

      <div className="bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex items-center gap-4">
        <div className="flex-1 relative flex items-center px-4">
          <Search className="text-slate-400 mr-3" size={20} />
          <input 
            type="text" 
            placeholder="Search projects..."
            value={store.searchTerm}
            onChange={e => store.setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-900 font-medium placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 pr-2">
          <div className="relative group">
            <select 
              value={store.sortBy}
              onChange={(e) => store.setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-10 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer min-w-[190px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">A-Z</option>
              <option value="value">Highest Value</option>
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
          </div>

          <button 
            onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
            className={`p-3 rounded-2xl border transition-all ${showFavouritesOnly ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-400'}`}
          >
            <Star size={20} fill={showFavouritesOnly ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={() => store.setShowArchived(!store.showArchived)}
            className={`p-3 rounded-2xl border transition-all ${store.showArchived ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'}`}
          >
            <Archive size={20} />
          </button>

          <div className="h-10 w-px bg-slate-100 mx-2" />

          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl">
            <button onClick={() => store.setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${store.viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}><Grid size={20} /></button>
            <button onClick={() => store.setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${store.viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}><List size={20} /></button>
          </div>
        </div>
      </div>

      {store.viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProjects.map((dev: Development) => {
            const devTotalRCA = dev.blocks.reduce((acc, b) => acc + getBlockEstimatedRCA(b), 0);
            const isMenuOpen = activeMenuId === dev.id;
            const completedBlocks = dev.blocks.filter(b => b.status === 'Completed').length;

            return (
              <div 
                key={dev.id}
                onClick={() => onSelectDevelopment(dev)}
                className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:border-blue-500 hover:shadow-[0_20px_50px_-12px_rgba(37,99,235,0.15)] transition-all relative flex flex-col cursor-pointer"
              >
                <div className="h-56 w-full relative overflow-hidden bg-slate-100">
                  <img src={dev.thumbnail || `https://picsum.photos/seed/${dev.id}/600/400`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                  
                  <div className="absolute top-5 right-5 z-10 flex gap-2">
                     <button 
                       onClick={(e) => { e.stopPropagation(); store.toggleFavourite(dev.id); }}
                       className={`p-2.5 backdrop-blur-md rounded-2xl border transition-all ${dev.isFavourite ? 'bg-amber-400 border-amber-300 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20 border-white/20'}`}
                       title={dev.isFavourite ? "Unfavourite" : "Favourite"}
                     >
                       <Star size={20} fill={dev.isFavourite ? 'currentColor' : 'none'} />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : dev.id); }}
                       className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 border border-white/20 transition-all"
                     >
                       <MoreVertical size={20} />
                     </button>
                     
                     {isMenuOpen && (
                       <div className="absolute right-0 mt-12 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <button onClick={(e) => { e.stopPropagation(); onEditDevelopment?.(dev); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                            <Edit3 size={14} className="text-blue-500" /> Edit Details
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); store.toggleArchive(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                            <Archive size={14} className="text-slate-500" /> {dev.isArchived ? 'Restore' : 'Archive'}
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmationId(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                            <Trash2 size={14} /> Delete
                          </button>
                       </div>
                     )}
                  </div>

                  <div className="absolute bottom-6 left-8 right-8">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">{dev.reference}</p>
                      <h3 className="text-2xl font-black text-white truncate leading-tight tracking-tight">{dev.name}</h3>
                  </div>
                </div>

                <div className="p-8 pb-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valuation Estimate</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">£{devTotalRCA.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Completion</span>
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-wider border border-blue-100">
                          {completedBlocks} / {dev.blocks.length} Blocks
                        </span>
                     </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${completedBlocks === dev.blocks.length ? 'bg-emerald-500' : 'bg-blue-600'}`}
                      style={{ width: `${(completedBlocks / (dev.blocks.length || 1)) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-visible shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Assessment Value</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Progress</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Updated</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 overflow-visible">
              {filteredProjects.map((dev: Development) => {
                const devTotalRCA = dev.blocks.reduce((acc, b) => acc + getBlockEstimatedRCA(b), 0);
                const isMenuOpen = activeMenuId === dev.id;
                const completedBlocks = dev.blocks.filter(b => b.status === 'Completed').length;

                return (
                  <tr key={dev.id} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onSelectDevelopment(dev)}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img src={dev.thumbnail} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 leading-tight truncate">{dev.name}</p>
                            {dev.isFavourite && <Star size={12} className="text-amber-500 fill-amber-500" />}
                          </div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{dev.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900">£{devTotalRCA.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                           <div className="h-full bg-blue-600" style={{ width: `${(completedBlocks / (dev.blocks.length || 1)) * 100}%` }} />
                         </div>
                         <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{completedBlocks}/{dev.blocks.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-500">{new Date(dev.updatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-5 text-right overflow-visible">
                      <div className="relative inline-block">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : dev.id); }}
                         className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-white transition-all"
                       >
                         <MoreVertical size={20} />
                       </button>
                       {isMenuOpen && (
                        <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-2 z-[100] animate-in fade-in zoom-in-95 duration-150 text-left">
                            <button onClick={(e) => { e.stopPropagation(); onEditDevelopment?.(dev); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest">
                              <Edit3 size={14} className="text-blue-500" /> Edit Details
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); store.toggleFavourite(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest">
                              <Star size={14} className="text-amber-500" fill={dev.isFavourite ? "currentColor" : "none"} /> {dev.isFavourite ? 'Unfavourite' : 'Favourite'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); store.toggleArchive(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest">
                              <Archive size={14} className="text-slate-500" /> {dev.isArchived ? 'Restore' : 'Archive'}
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmationId(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest">
                              <Trash2 size={14} /> Delete
                            </button>
                        </div>
                      )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              <button onClick={() => { store.deleteDevelopment(deleteConfirmationId); setDeleteConfirmationId(null); }} className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all">Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                {wizardStep !== 'mode' && (
                  <button onClick={handleBack} className="p-2 hover:bg-white rounded-xl border border-slate-200 text-slate-500 transition-all">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register New Development</h2>
              </div>
              <button onClick={resetState} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-auto p-10 custom-scrollbar">
               {wizardStep === 'mode' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  {[
                    { id: 'details-project', title: 'Manual Entry', desc: 'Define project and blocks manually with archetype defaults.', icon: <Plus size={32} />, color: 'blue' },
                    { id: 'import-upload', title: 'Import Data', desc: 'Upload CSV with site block data and map attributes.', icon: <Upload size={32} />, color: 'emerald' }
                  ].map(mode => (
                    <button 
                      key={mode.id}
                      onClick={() => setWizardStep(mode.id as any)}
                      className="flex flex-col items-center text-center p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/20 transition-all group"
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 ${
                        mode.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {mode.icon}
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2">{mode.title}</h4>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              )}
              {wizardStep === 'details-project' && (
                <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-400">
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Development Name</label>
                        <input type="text" value={devName} onChange={e => setDevName(e.target.value)} placeholder="e.g. 72049 Hounslow High Street" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" autoFocus />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Project Reference</label>
                        <input type="text" value={devRef} onChange={e => setDevRef(e.target.value)} placeholder="e.g. RCA-2025-001" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                      </div>
                      <div className="pt-6 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2"><MapPin size={12} className="text-blue-500" /> Default Block Location</h4>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Street Address</label>
                          <input type="text" value={devAddress} onChange={e => setDevAddress(e.target.value)} placeholder="e.g. 72-104 High Street" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Town/City</label>
                            <input type="text" value={devTown} onChange={e => setDevTown(e.target.value)} placeholder="e.g. Hounslow" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Postcode</label>
                            <input type="text" value={devPostcode} onChange={e => setDevPostcode(e.target.value)} placeholder="e.g. TW3 1EB" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              )}
              {wizardStep === 'details-blocks' && (
                <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-400">
                   <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Number of Building Blocks</label>
                      <input type="text" value={blockCountInput} onChange={e => setBlockCountInput(e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                   </div>
                   <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4">
                      <Info className="text-blue-500 shrink-0" size={24} />
                      <p className="text-sm font-medium text-blue-800 leading-relaxed uppercase tracking-wider text-[10px]">Blocks will be initialized with benchmark templates based on UK residential archetypes. They will inherit the development address by default.</p>
                   </div>
                </div>
              )}
              {wizardStep === 'import-upload' && (
                <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-400">
                  <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-all group">
                    <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><Upload size={40} /></div>
                    <div className="text-center">
                      <p className="text-xl font-black text-slate-900">Upload Site CSV</p>
                      <p className="text-sm font-medium text-slate-500 mt-2">Import block names, addresses, and unit counts.</p>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
                </div>
              )}
            </div>
            <div className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button onClick={resetState} className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase text-slate-500 tracking-widest hover:bg-white border border-transparent transition-colors">Cancel</button>
              {wizardStep === 'details-project' && (
                <button onClick={handleNextStep} disabled={!devName || !devRef} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">Configure Blocks <ArrowRight size={14} /></button>
              )}
              {wizardStep === 'details-blocks' && (
                <button onClick={handleCreateProject} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">Create Development</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;