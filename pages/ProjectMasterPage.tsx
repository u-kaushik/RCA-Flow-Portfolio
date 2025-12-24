
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Building2, LayoutGrid, Hammer, MessageSquare, Info, Plus, X, ArrowRight, ShieldCheck, Mail, Camera, ImageIcon, Ruler, TrendingUp, FileText, CheckCircle2, Trees, Lock, Upload, File, Trash2, Edit3, Download, AlertTriangle, PoundSterling, Archive, Star, FileBox } from 'lucide-react';
import { Development, Block, ExternalItem, ProjectDocument, ExternalsAssessment, Report } from '../types';
import { getBlockEstimatedRCA, getDevelopmentTotalRCA, getExternalsTotal } from '../store';

const formatNumber = (num: number): string => {
  if (num === 0) return '0.00';
  return num.toLocaleString('en-GB', { 
    maximumFractionDigits: 2,
    minimumFractionDigits: 2 
  });
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
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [deleteDocTarget, setDeleteDocTarget] = useState<string | null>(null);
  const [isPackaging, setIsPackaging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      author: 'Senior Surveyor',
      url: '#' 
    }));

    updateDev({ documents: [...(development.documents || []), ...newDocs] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateDocumentName = (id: string, newName: string) => {
    const next = (development.documents || []).map(d => d.id === id ? { ...d, displayName: newName } : d);
    updateDev({ documents: next });
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

  const totalDevRCA = getDevelopmentTotalRCA(development);
  const externalsTotal = getExternalsTotal(development.externalsAssessment);
  
  const completedBlocksCount = (development.blocks || []).filter(b => b.status === 'Completed').length;
  const isExternalsComplete = development.externalsAssessment.status === 'Completed';
  const isProjectComplete = completedBlocksCount === (development.blocks || []).length && (development.blocks || []).length > 0 && isExternalsComplete;

  // Refined Logic: Check if a report for this project is ALREADY in staging/ready
  // FIX: Comparison with 'Archived' on line 91 was invalid because status is 'Staging' | 'Ready'. Use isArchived property instead.
  const alreadyInStaging = store?.reports?.some((r: Report) => r.developmentId === development.id && !r.isArchived) || false;

  const ProgressBar = ({ current, total, color = 'blue' }: { current: number, total: number, color?: 'blue' | 'emerald' }) => {
    const pct = Math.min(100, Math.max(0, (current / (total || 1)) * 100));
    return (
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
        <div 
          className={`h-full transition-all duration-1000 ${color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 font-inter">
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all border border-slate-200">
            <ChevronLeft size={22} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{development.name}</h1>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavourite(development.id); }}
                className={`transition-all p-1.5 rounded-xl ${development.isFavourite ? 'text-amber-500 bg-amber-50 shadow-sm border border-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                title={development.isFavourite ? "Remove from Favourites" : "Add to Favourites"}
              >
                <Star size={20} fill={development.isFavourite ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              <span>{development.reference} • Project Master View</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 pr-6 mr-2">
            <button 
              onClick={() => onEditDevelopment(development)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Edit Overview"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => onArchiveDevelopment(development.id)}
              className={`p-2 rounded-xl transition-all ${development.isArchived ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
              title={development.isArchived ? "Restore Project" : "Archive Project"}
            >
              <Archive size={18} />
            </button>
            <button 
              onClick={() => onDeleteDevelopment(development.id)}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Delete Project"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-xl text-right flex items-center gap-4 shadow-lg shadow-slate-200">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global RCA</p>
             <p className="text-md font-black text-blue-400">£{formatNumber(totalDevRCA)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6 md:p-12 space-y-12 pb-32">
        <div className="max-w-3xl mx-auto space-y-12">
          {!isProjectComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4 text-amber-800">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldCheck size={24} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-black text-xs uppercase tracking-[0.1em]">Project Status: In Progress</p>
                  <p className="text-[11px] font-medium opacity-80 mt-0.5">({completedBlocksCount}/{development.blocks.length} blocks, Externals: {isExternalsComplete ? 'Complete' : 'Pending'})</p>
                </div>
              </div>
              <div className="w-32 h-1.5 bg-amber-200/50 rounded-full overflow-hidden shrink-0">
                 <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${((completedBlocksCount + (isExternalsComplete ? 1 : 0)) / (development.blocks.length + 1 || 1)) * 100}%` }}></div>
              </div>
            </div>
          )}

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><Info size={24} /></div>
                  Project Brief
                </h3>
                <button onClick={() => setIsEditingDesc(!isEditingDesc)} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 tracking-widest bg-blue-50 px-4 py-2 rounded-xl transition-all">
                  {isEditingDesc ? 'Save Changes' : 'Edit Brief'}
                </button>
             </div>
             {isEditingDesc ? (
               <textarea 
                 value={development.description}
                 onChange={e => updateDev({ description: e.target.value })}
                 className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                 placeholder="Describe the scope of this project..."
               />
             ) : (
               <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {development.description || 'Provide a high-level summary of the site characteristics and survey scope.'}
                  </p>
               </div>
             )}
          </section>

          <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-fit mx-auto">
             <button onClick={() => setActiveTab('summary')} className={`px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all ${activeTab === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Assessments</button>
             <button onClick={() => setActiveTab('docs')} className={`px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all ${activeTab === 'docs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Documentation</button>
          </div>

          {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
               {(development.blocks || []).map(block => {
                  const blockRCA = getBlockEstimatedRCA(block);
                  const isCompleted = block.status === 'Completed';
                  const compCount = (block.completedSections || []).length;
                  const totalSecs = 7;
                  
                  return (
                    <div key={block.id} onClick={() => onSelectBlock(block)} className={`group bg-white p-8 rounded-[2.5rem] border hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer flex items-center justify-between relative overflow-hidden ${isCompleted ? 'border-green-100' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-5 relative z-10 flex-1">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${isCompleted ? 'bg-green-600' : 'bg-slate-900 group-hover:bg-blue-600'}`}>
                              <Building2 size={24} className="text-white" />
                            </div>
                            <div className="flex-1 pr-4">
                               <h4 className={`text-lg font-black transition-colors ${isCompleted ? 'text-green-700' : 'text-slate-900 group-hover:text-blue-600'}`}>{block.name}</h4>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: {block.reference}</p>
                               <div className="mt-4 max-w-[200px]">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{Math.round((compCount/totalSecs)*100)}%</span>
                                 </div>
                                 <ProgressBar current={compCount} total={totalSecs} />
                               </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-12 relative z-10">
                           <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assessment Value</p>
                              <p className="text-lg font-black text-slate-900">£{formatNumber(blockRCA)}</p>
                           </div>
                           <div className={`p-3 rounded-2xl transition-all shadow-sm ${isCompleted ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                             <ArrowRight size={22} />
                           </div>
                        </div>
                    </div>
                  );
               })}
               <div 
                  onClick={() => onSelectExternals(development.externalsAssessment)} 
                  className={`group bg-white p-8 rounded-[2.5rem] border hover:shadow-xl transition-all cursor-pointer flex items-center justify-between relative overflow-hidden ${isExternalsComplete ? 'border-green-100' : 'border-emerald-100 hover:border-emerald-500'}`}
               >
                   <div className="flex items-center gap-5 relative z-10 flex-1">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${isExternalsComplete ? 'bg-green-600' : 'bg-emerald-600 group-hover:bg-emerald-500'}`}>
                           <Hammer size={24} className="text-white" />
                       </div>
                       <div className="flex-1 pr-4">
                           <h4 className={`text-lg font-black transition-colors ${isExternalsComplete ? 'text-green-700' : 'text-emerald-700 group-hover:text-emerald-800'}`}>Externals Assessment</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Project-Wide Site Works</p>
                           <div className="mt-4 max-w-[200px]">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{Math.round(((development.externalsAssessment.completedSections || []).length / 3) * 100)}%</span>
                              </div>
                              <ProgressBar current={(development.externalsAssessment.completedSections || []).length} total={3} color="emerald" />
                           </div>
                       </div>
                   </div>
                   <div className="flex items-center gap-12 relative z-10">
                       <div className="text-right hidden sm:block">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Externals Value</p>
                           <p className="text-lg font-black text-slate-900">£{formatNumber(externalsTotal)}</p>
                       </div>
                       <div className={`p-3 rounded-2xl transition-all shadow-sm ${isExternalsComplete ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                           <ArrowRight size={22} />
                       </div>
                   </div>
               </div>
               <button 
                 onClick={() => {
                   const newBlock: Block = {
                     id: `block-${Date.now()}`,
                     name: `Block ${development.blocks.length + 1}`,
                     reference: `B${development.blocks.length + 1}`,
                     status: 'Draft',
                     floors: [],
                     buildingRate: {
                       date: new Date().toISOString().split('T')[0],
                       uniclassRate: 'Standard Benchmark',
                       locationFactor: 1.0,
                       ratesPerFloor: {}
                     },
                     adjustments: [],
                     anomalies: [],
                     demolitionRate: 85,
                     fees: { professionalPercent: 12.5, localAuthority: 1500 }
                   };
                   updateDev({ blocks: [...(development.blocks || []), newBlock] });
                 }}
                 className="w-full border-2 border-dashed border-slate-200 rounded-[2.5rem] py-10 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all group"
               >
                  <Plus size={32} />
                  <p className="font-black uppercase text-[11px] tracking-widest">Register Building Block</p>
               </button>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-inner"><FileText size={24} /></div>
                    Site Files
                  </h3>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                    <Upload size={14} /> Upload
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
               </div>
               <div className="space-y-4">
                  {(development.documents || []).length > 0 ? (
                    development.documents.map(doc => (
                      <div key={doc.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-blue-300 transition-all">
                         <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner shrink-0"><File size={24} /></div>
                         <div className="flex-1 min-w-0">
                            <input 
                              value={doc.displayName}
                              onChange={(e) => updateDocumentName(doc.id, e.target.value)}
                              className="text-md font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none transition-all w-full mb-1"
                            />
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                               <span>{doc.uploadDate}</span>
                               <span className="w-1 h-1 bg-slate-300 rounded-full" />
                               <span className="truncate max-w-[150px]">{doc.originalFileName}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-3 bg-slate-50 text-slate-500 hover:text-blue-600 rounded-2xl transition-all border border-slate-100"><Download size={18} /></button>
                            <button onClick={() => setDeleteDocTarget(doc.id)} className="p-3 bg-red-50 text-red-400 hover:text-red-600 rounded-2xl transition-all border border-red-100"><Trash2 size={18} /></button>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="border-3 border-dashed border-slate-200 rounded-[3rem] p-20 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group">
                       <Upload size={40} className="text-slate-300" />
                       <p className="text-lg font-black text-slate-400">Add Floorplans & Documents</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 p-8 flex justify-center items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleGenerateReport}
          disabled={!isProjectComplete || isPackaging || alreadyInStaging}
          className={`flex items-center gap-3 px-16 py-4 rounded-[2rem] font-black uppercase tracking-widest text-[12px] transition-all shadow-2xl ${
            isProjectComplete && !isPackaging && !alreadyInStaging
            ? 'bg-slate-900 text-white hover:bg-slate-800' 
            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
          }`}
        >
          {isPackaging ? (
            <><div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" /> Packaging RCA Assets...</>
          ) : alreadyInStaging ? (
            <><CheckCircle2 size={18} className="text-green-500" /> RCA Already Packaged & Staged</>
          ) : isProjectComplete ? (
            <><FileBox size={18} /> Package RCA & Send to Staging</>
          ) : (
            <><Lock size={18} /> Verification Pending (Complete All Blocks & Externals)</>
          )}
        </button>
      </div>

      {deleteDocTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2 tracking-tight">Confirm Deletion</h3>
            <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">Are you sure? This cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteDocTarget(null)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-xl border border-slate-200 transition-all">Cancel</button>
              <button onClick={() => { updateDev({ documents: (development.documents || []).filter(d => d.id !== deleteDocTarget) }); setDeleteDocTarget(null); }} className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMasterPage;
