
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Download, Upload, Search, Filter, MoreVertical, Layout, List, FileBadge, Plus, Trash2, Edit3, Star, Archive, ChevronDown, Grid, Clock, CheckCircle2, ArrowRight, ShieldCheck, FileBox, Building2, X, AlertTriangle, Eye, File as FileIcon, Loader2, Info } from 'lucide-react';
// Fix: Removed Type from the relative types import and moved it to @google/genai
import { Report, Template, SortOption, ViewMode } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

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
}

const ReportsPage: React.FC<ReportsPageProps> = ({ store }) => {
  const [activeTab, setActiveTab] = useState<'staging' | 'finalized' | 'templates'>('staging');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showArchived, setShowArchived] = useState(false);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isDeciphering, setIsDeciphering] = useState(false);
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [renamingReport, setRenamingReport] = useState<Report | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, type: 'report' | 'template' } | null>(null);
  
  // Template Preview States
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isParsingTemplate, setIsParsingTemplate] = useState(false);

  // Template Upload States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCompany, setTemplateCompany] = useState(store.user?.company || '');
  const [templateVersion, setTemplateVersion] = useState('1.0');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeMenuId === id) {
      setActiveMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, left: rect.left - 160 });
      setActiveMenuId(id);
    }
  };

  const handleGenerateReport = async (id: string) => {
    setIsGenerating(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    store.updateReport(id, { 
      status: 'Ready', 
      generatedAt: new Date().toISOString() 
    });
    setIsGenerating(null);
    setActiveTab('finalized');
  };

  const handleImportDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDeciphering(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    store.addReportFromDoc(file.name);
    setIsDeciphering(false);
    if (reportFileInputRef.current) reportFileInputRef.current.value = '';
    setActiveTab('staging');
  };

  const handleTemplateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
      setUploadedFile(file);
      setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateTemplate = async () => {
    if (uploadedFile && templateName) {
      setIsDeciphering(true);
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const base64 = await fileToBase64(uploadedFile);
        
        const prompt = `Analyze this RCA (Reinstatement Cost Assessment) Word template. Extract the visual layout and return a JSON object describing its structure for a preview renderer. Include branding, header text, and sections. Example format: { brandColor: string, hasLogo: boolean, logoPos: 'left'|'right'|'center', headerTitle: string, sections: [{ title: string, type: 'text'|'table' }] }`;

        // Fix: Updated contents to use the recommended { parts: [...] } structure
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { inlineData: { mimeType: uploadedFile.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document", data: base64 } },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                brandColor: { type: Type.STRING },
                hasLogo: { type: Type.BOOLEAN },
                logoPos: { type: Type.STRING, enum: ['left', 'right', 'center'] },
                headerTitle: { type: Type.STRING },
                sections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['text', 'table', 'chart'] }
                    }
                  }
                }
              }
            }
          }
        });

        // Fix: Accessed response.text property directly as per guidelines
        const parsedData = JSON.parse(response.text || '{}');
        store.addTemplateFromFile(templateName, templateCompany, templateVersion, parsedData);
      } catch (error) {
        console.error("Gemini Parsing Error:", error);
        // Fallback for demo if API fails
        store.addTemplateFromFile(templateName, templateCompany, templateVersion, {
          brandColor: '#0f172a',
          hasLogo: true,
          logoPos: 'left',
          headerTitle: 'RCA REPORT TEMPLATE',
          sections: [{ title: 'Overview', type: 'text' }, { title: 'Costs', type: 'table' }]
        });
      }

      setIsDeciphering(false);
      setIsUploadModalOpen(false);
      setUploadedFile(null);
      setTemplateName('');
      setTemplateVersion('1.0');
    }
  };

  const handleOpenPreview = async (template: Template) => {
    setPreviewTemplate(template);
    setIsParsingTemplate(true);
    // Simulated high-fidelity rendering time
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsParsingTemplate(false);
  };

  const handleSaveTemplateEdit = () => {
    if (editingTemplate) {
      store.updateTemplate(editingTemplate.id, editingTemplate);
      setEditingTemplate(null);
    }
  };

  const handleSaveReportRename = () => {
    if (renamingReport) {
      store.updateReport(renamingReport.id, { name: renamingReport.name });
      setRenamingReport(null);
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    if (deleteConfirmation.type === 'report') {
      store.deleteReport(deleteConfirmation.id);
    } else {
      store.deleteTemplate(deleteConfirmation.id);
    }
    setDeleteConfirmation(null);
  };

  const getFilteredItems = () => {
    let items: any[] = [];
    if (activeTab === 'templates') {
      items = store.templates || [];
    } else {
      items = store.reports || [];
    }

    let result = items.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.reference && item.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesArchive = showArchived ? item.isArchived : !item.isArchived;
      const matchesFav = showFavouritesOnly ? item.isFavourite : true;
      
      if (activeTab === 'staging') {
        return matchesSearch && matchesArchive && matchesFav && item.status === 'Staging';
      } else if (activeTab === 'finalized') {
        return matchesSearch && matchesArchive && matchesFav && item.status === 'Ready';
      }
      return matchesSearch && matchesArchive && matchesFav;
    });

    if (sortBy === 'newest') result.sort((a, b) => (b.date || b.updatedAt || "").localeCompare(a.date || a.updatedAt || ""));
    if (sortBy === 'oldest') result.sort((a, b) => (a.date || a.updatedAt || "").localeCompare(b.date || b.updatedAt || ""));
    if (sortBy === 'alphabetical') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'value') result.sort((a, b) => (b.value || 0) - (a.value || 0));

    return result;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports Hub</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">Stage, review, and generate professional RCA reports.</p>
        </div>

        <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-fit shrink-0">
          <button 
            onClick={() => setActiveTab('staging')}
            className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'staging' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Clock size={14} /> Staging {store.reports.filter((r: Report) => r.status === 'Staging' && !r.isArchived).length > 0 && `(${store.reports.filter((r: Report) => r.status === 'Staging' && !r.isArchived).length})`}
          </button>
          <button 
            onClick={() => setActiveTab('finalized')}
            className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'finalized' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <ShieldCheck size={14} /> Finalized
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'templates' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <FileBadge size={14} /> Templates
          </button>
        </div>
      </header>

      {/* UNIVERSAL FILTER BAR */}
      <div className="bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex items-center gap-4">
        <div className="flex-1 relative flex items-center px-4">
          <Search className="text-slate-400 mr-3" size={20} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'templates' ? 'templates' : 'projects'}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-900 font-medium placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 pr-2">
          <div className="relative group">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
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
            <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}><Grid size={20} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}><List size={20} /></button>
          </div>
        </div>
      </div>

      {activeTab === 'staging' && (
        <div className="animate-in fade-in duration-400 space-y-8">
           <div className="flex justify-end mb-4">
              <button onClick={() => reportFileInputRef.current?.click()} disabled={isDeciphering} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-200">
                {isDeciphering ? (
                   <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Deciphering doc...</>
                ) : (
                   <><Upload size={18} /> Import Word Report</>
                )}
              </button>
              <input type="file" ref={reportFileInputRef} onChange={handleImportDoc} className="hidden" accept=".doc,.docx" />
           </div>

           {filteredItems.length === 0 ? (
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
                <FileBox size={48} className="mx-auto text-slate-300 mb-6" />
                <p className="text-xl font-black text-slate-400">Staging Area Empty</p>
                <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs mx-auto">Complete an RCA project or import a Word doc to see it pending generation here.</p>
             </div>
           ) : viewMode === 'grid' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((report: Report) => (
                  <div key={report.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:border-blue-500 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 -mr-12 -mt-12 rounded-full" />
                     <div className="flex items-start justify-between mb-8">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">
                           <Clock size={28} />
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => store.toggleReportFavourite(report.id)}
                             className={`p-2 rounded-xl transition-all ${report.isFavourite ? 'text-amber-500 bg-amber-50 border-amber-100 border' : 'text-slate-200 hover:text-amber-400 hover:bg-amber-50 border-transparent border'}`}
                           >
                              <Star size={18} fill={report.isFavourite ? "currentColor" : "none"} />
                           </button>
                           <button onClick={(e) => toggleMenu(e, report.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><MoreVertical size={18} /></button>
                        </div>
                     </div>
                     <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{report.name}</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{report.reference}</p>
                     
                     <div className="space-y-4 pt-6 border-t border-slate-100 mb-8">
                        <div className="flex items-center justify-between text-xs font-bold">
                           <span className="text-slate-400">Valuation:</span>
                           <span className="text-slate-900">£{formatNumber(report.value)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                           <span className="text-slate-400">Last Modified:</span>
                           <span className="text-slate-900">{formatDate(report.date)}</span>
                        </div>
                     </div>

                     <button 
                       onClick={() => handleGenerateReport(report.id)}
                       disabled={isGenerating === report.id}
                       className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 mt-auto flex items-center justify-center gap-2"
                     >
                        {isGenerating === report.id ? (
                          <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Generating...</>
                        ) : (
                          <><FileText size={16} /> Finalize to Word Doc</>
                        )}
                     </button>
                  </div>
                ))}
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Value</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Last Modified</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((report: Report) => (
                      <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><Clock size={18} /></div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 truncate">{report.name}</p>
                                    {report.isFavourite && <Star size={10} className="text-amber-500 fill-amber-500" />}
                                 </div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.reference}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 font-black text-slate-900 text-sm">£{formatNumber(report.value)}</td>
                        <td className="px-8 py-6 text-center font-bold text-slate-500 text-sm">{formatDate(report.date)}</td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-4">
                              <button 
                                onClick={() => handleGenerateReport(report.id)}
                                disabled={isGenerating === report.id}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
                              >
                                 {isGenerating === report.id ? 'Generating...' : 'Finalize'}
                              </button>
                              <button onClick={(e) => toggleMenu(e, report.id)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"><MoreVertical size={18} /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           )}
        </div>
      )}

      {activeTab === 'finalized' && (
        <div className="animate-in fade-in duration-400">
          {filteredItems.length === 0 ? (
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
                <CheckCircle2 size={48} className="mx-auto text-slate-300 mb-6" />
                <p className="text-xl font-black text-slate-400">No Finalized Reports</p>
                <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs mx-auto">Generate reports from the staging area to see them finalized here.</p>
             </div>
           ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredItems.map((report: Report) => (
                 <div key={report.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:border-emerald-500 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 -mr-12 -mt-12 rounded-full" />
                    <div className="flex items-start justify-between mb-8">
                       <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <CheckCircle2 size={28} />
                       </div>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => store.toggleReportFavourite(report.id)}
                            className={`p-2 rounded-xl transition-all ${report.isFavourite ? 'text-amber-500 bg-amber-50 border-amber-100 border' : 'text-slate-200 hover:text-amber-400 hover:bg-amber-50 border-transparent border'}`}
                          >
                             <Star size={18} fill={report.isFavourite ? "currentColor" : "none"} />
                          </button>
                          <button onClick={(e) => toggleMenu(e, report.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><MoreVertical size={18} /></button>
                       </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{report.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Generated {formatDate(report.generatedAt!)}</p>
                    
                    <div className="flex items-center gap-3 pt-6 border-t border-slate-100 mt-auto">
                       <button className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                          <Download size={14} /> Word
                       </button>
                       <button className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                          <Download size={14} /> PDF
                       </button>
                    </div>
                 </div>
               ))}
            </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Report Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valuation</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Finalized Date</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((report: Report) => (
                      <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><FileText size={18} /></div>
                              <p className="font-bold text-slate-900 truncate">{report.name}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6 font-black text-slate-900 text-sm">£{formatNumber(report.value)}</td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-500">{formatDate(report.generatedAt!)}</td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <button className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all">
                                 <Download size={20} />
                              </button>
                              <button onClick={(e) => toggleMenu(e, report.id)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"><MoreVertical size={18} /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="animate-in fade-in duration-400">
           <div className="flex justify-end mb-8">
              <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                  <Upload size={18} /> Upload New Template
              </button>
           </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((template: Template) => (
                <div key={template.id} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:border-blue-500 hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-12 -mt-12 rounded-full" />
                  <div className="flex items-start justify-between mb-8">
                    <div 
                      onClick={() => handleOpenPreview(template)}
                      className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors cursor-pointer group/icon relative"
                    >
                      <FileBadge size={28} className="group-hover/icon:opacity-0 transition-opacity" />
                      <Eye size={28} className="absolute opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => store.toggleTemplateFavourite(template.id)}
                        className={`p-2 rounded-xl transition-all ${template.isFavourite ? 'text-amber-500 bg-amber-50 border-amber-100 border' : 'text-slate-200 hover:text-amber-400 hover:bg-amber-50 border-transparent border'}`}
                      >
                         <Star size={18} fill={template.isFavourite ? "currentColor" : "none"} />
                      </button>
                      <button onClick={(e) => toggleMenu(e, template.id)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition-all"><MoreVertical size={20} /></button>
                    </div>
                  </div>
                  <h3 className="font-black text-xl text-slate-900 mb-1 leading-tight">{template.name}</h3>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 truncate">{template.company}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Version</span>
                      <span className="text-[12px] font-black text-slate-600">{template.version}</span>
                    </div>
                    <button className="bg-slate-50 text-blue-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 transition-all border border-blue-100 shadow-sm">
                      <Download size={14} /> Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Template Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Company</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Version</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((template: Template) => (
                      <tr key={template.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div 
                                onClick={() => handleOpenPreview(template)}
                                className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0 cursor-pointer hover:bg-blue-600 transition-colors"
                              >
                                <FileBadge size={18} />
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 truncate">{template.name}</p>
                                    <button onClick={(e) => { e.stopPropagation(); store.toggleTemplateFavourite(template.id); }} className={`transition-all ${template.isFavourite ? 'text-amber-500' : 'text-slate-200 hover:text-amber-400'}`}>
                                       <Star size={12} fill={template.isFavourite ? "currentColor" : "none"} />
                                    </button>
                                 </div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Updated {template.updatedAt}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 font-bold text-slate-500 text-sm">{template.company}</td>
                        <td className="px-8 py-6 text-center font-black text-slate-900 text-sm">{template.version}</td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleOpenPreview(template)} className="p-2 text-slate-300 hover:text-blue-600 rounded-lg hover:bg-white transition-all"><Eye size={20} /></button>
                              <button className="p-2 text-slate-300 hover:text-blue-600 rounded-lg hover:bg-white transition-all"><Download size={20} /></button>
                              <button onClick={(e) => { e.stopPropagation(); toggleMenu(e, template.id); }} className="p-2 text-slate-300 hover:text-slate-900 rounded-lg hover:bg-white transition-all"><MoreVertical size={20} /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      
      {/* Template Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
             <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upload New Template</h2>
               <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} className="text-slate-500" /></button>
             </div>
             
             <div className="p-10 space-y-8 overflow-auto max-h-[70vh] custom-scrollbar">
                {!uploadedFile ? (
                   <div 
                     onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                     onDragLeave={() => setIsDragging(false)}
                     onDrop={handleDrop}
                     onClick={() => templateFileInputRef.current?.click()}
                     className={`border-4 border-dashed rounded-[3rem] p-20 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'}`}
                   >
                      <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 transition-all">
                        <Upload size={40} />
                      </div>
                      <div className="text-center">
                         <p className="text-xl font-black text-slate-900">Drop Template File Here</p>
                         <p className="text-sm font-medium text-slate-500 mt-2">Support for .doc and .docx formats only.</p>
                      </div>
                      <input type="file" ref={templateFileInputRef} onChange={handleTemplateFileSelect} className="hidden" accept=".doc,.docx" />
                   </div>
                ) : (
                   <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                            <FileIcon size={24} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="font-bold text-blue-900 truncate">{uploadedFile.name}</p>
                            <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">{(uploadedFile.size / 1024).toFixed(1)} KB • Word Document</p>
                         </div>
                         <button onClick={() => setUploadedFile(null)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all">
                            <X size={18} />
                         </button>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                         <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Template Display Name</label>
                            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Company Author</label>
                               <input type="text" value={templateCompany} onChange={e => setTemplateCompany(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Version</label>
                               <input type="text" value={templateVersion} onChange={e => setTemplateVersion(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                            </div>
                         </div>
                      </div>
                   </div>
                )}
             </div>

             <div className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setIsUploadModalOpen(false)} className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase text-slate-500 tracking-widest hover:bg-white border border-transparent transition-colors">Cancel</button>
                <button 
                  onClick={handleCreateTemplate}
                  disabled={!uploadedFile || !templateName || isDeciphering} 
                  className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-200 transition-all flex items-center gap-2"
                >
                  {isDeciphering ? <><Loader2 size={14} className="animate-spin" /> Analyzing Structure...</> : "Analyze & Create Card"}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[300] flex items-center justify-center p-4 overflow-hidden"
          onClick={() => !isParsingTemplate && setPreviewTemplate(null)}
        >
           <div 
             className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative"
             onClick={e => e.stopPropagation()}
           >
              {/* Parsing Overlay */}
              {isParsingTemplate && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-[310] flex flex-col items-center justify-center gap-6">
                   <div className="relative">
                      <div className="w-20 h-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <FileBadge className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={32} />
                   </div>
                   <div className="text-center">
                      <p className="text-xl font-black text-slate-900 tracking-tight">Deep Node Analysis...</p>
                      <p className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Reconstructing XML Layout Components</p>
                   </div>
                </div>
              )}

              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                       <FileBadge size={20} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 tracking-tight">{previewTemplate.name}</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High-Fidelity Preview • Version {previewTemplate.version}</p>
                    </div>
                 </div>
              </div>
              
              <div className="flex-1 bg-slate-100 p-12 overflow-auto custom-scrollbar flex justify-center">
                 {/* AI-RECONSTRUCTED DOCUMENT PREVIEW */}
                 <div className="bg-white w-full max-w-[800px] aspect-[1/1.41] shadow-[0_30px_60px_rgba(0,0,0,0.1)] p-20 space-y-12 animate-in fade-in duration-1000">
                    <div className={`flex ${previewTemplate.previewData?.logoPos === 'right' ? 'flex-row-reverse' : previewTemplate.previewData?.logoPos === 'center' ? 'flex-col items-center' : 'flex-row'} justify-between items-start border-b-4 pb-12`} style={{ borderColor: previewTemplate.previewData?.brandColor || '#0f172a' }}>
                       {previewTemplate.previewData?.hasLogo && (
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl border-4 border-slate-200 flex items-center justify-center text-slate-300 font-black italic text-4xl">LOGO</div>
                       )}
                       <div className={previewTemplate.previewData?.logoPos === 'center' ? 'text-center mt-6' : 'text-right'}>
                          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">{previewTemplate.previewData?.headerTitle || 'RCA REPORT'}</h1>
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{previewTemplate.company}</p>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
                       <div className="space-y-4">
                          <div className="h-3 bg-slate-50 rounded-full w-full"></div>
                          <div className="h-3 bg-slate-50 rounded-full w-full"></div>
                          <div className="h-3 bg-slate-50 rounded-full w-11/12"></div>
                       </div>
                    </div>

                    <div className="space-y-12">
                        {previewTemplate.previewData?.sections?.map((section, idx) => (
                          <div key={idx} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1 rounded-full" style={{ backgroundColor: previewTemplate.previewData?.brandColor || '#3b82f6' }}></div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{section.title}</h3>
                            </div>
                            {section.type === 'text' ? (
                               <div className="space-y-3">
                                  <div className="h-2 bg-slate-50 rounded-full w-full"></div>
                                  <div className="h-2 bg-slate-50 rounded-full w-5/6"></div>
                               </div>
                            ) : section.type === 'table' ? (
                               <div className="border border-slate-100 rounded-xl overflow-hidden">
                                  <div className="bg-slate-50 h-8 border-b border-slate-100"></div>
                                  <div className="h-24 p-4 space-y-4">
                                     <div className="h-2 bg-slate-50 rounded-full w-full"></div>
                                     <div className="h-2 bg-slate-50 rounded-full w-full"></div>
                                  </div>
                               </div>
                            ) : (
                               <div className="bg-slate-50 h-32 rounded-2xl flex items-center justify-center">
                                  <Info className="text-slate-200" size={32} />
                               </div>
                            )}
                          </div>
                        ))}
                    </div>

                    <div className="pt-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                       Proprietary Format • Verified by BuiltTech Analyzers
                    </div>
                 </div>
              </div>
              
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                 <div className="bg-slate-900/90 backdrop-blur-md px-6 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/10 flex items-center gap-2">
                    <Eye size={12} className="text-blue-400" /> Virtual Document Preview
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click outside to dismiss</p>
              </div>
           </div>
        </div>
      )}

      {renamingReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Rename Report</h3>
             <input 
               type="text" 
               value={renamingReport.name} 
               onChange={e => setRenamingReport({ ...renamingReport, name: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 mb-6"
             />
             <div className="flex gap-3">
                <button onClick={() => setRenamingReport(null)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[11px] tracking-widest border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveReportRename} className="flex-1 py-3 bg-blue-600 text-white font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Save Name</button>
             </div>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Forever?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">This will remove the {deleteConfirmation.type} permanently. This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-xl border border-slate-200 transition-all">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all">Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Three-Dot Menu */}
      {activeMenuId && (
        <div 
          ref={menuRef} 
          className="fixed w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-2 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {activeTab === 'templates' ? (
             <>
                <button onClick={(e) => { e.stopPropagation(); handleOpenPreview(store.templates.find((t: any) => t.id === activeMenuId)); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                  <Eye size={14} className="text-blue-500" /> Preview Template
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditingTemplate(store.templates.find((t: any) => t.id === activeMenuId)); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                  <Edit3 size={14} className="text-blue-500" /> Edit Metadata
                </button>
                <button onClick={(e) => { e.stopPropagation(); store.toggleTemplateArchive(activeMenuId); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                  <Archive size={14} className="text-slate-500" /> {store.templates.find((t:any)=>t.id===activeMenuId)?.isArchived ? 'Restore Template' : 'Archive Template'}
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmation({ id: activeMenuId, type: 'template' }); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                  <Trash2 size={14} /> Delete
                </button>
             </>
          ) : (
             <>
                <button onClick={(e) => { e.stopPropagation(); setRenamingReport(store.reports.find((r:any) => r.id === activeMenuId)); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                  <Edit3 size={14} className="text-blue-500" /> Rename Report
                </button>
                <button onClick={(e) => { e.stopPropagation(); store.toggleReportFavourite(activeMenuId); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                  <Star size={14} className="text-amber-500" fill={store.reports.find((r:any)=>r.id===activeMenuId)?.isFavourite ? "currentColor" : "none"} /> Favourite
                </button>
                <button onClick={(e) => { e.stopPropagation(); store.toggleReportArchive(activeMenuId); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                  <Archive size={14} className="text-slate-500" /> {store.reports.find((r:any)=>r.id===activeMenuId)?.isArchived ? 'Restore Report' : 'Archive Report'}
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmation({ id: activeMenuId, type: 'report' }); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest text-left">
                  <Trash2 size={14} /> Delete
                </button>
             </>
          )}
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Template Info</h2>
              <button onClick={() => setEditingTemplate(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Template Name</label>
                <input type="text" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Version</label>
                  <input type="text" value={editingTemplate.version} onChange={e => setEditingTemplate({ ...editingTemplate, version: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Company</label>
                  <input type="text" value={editingTemplate.company} onChange={e => setEditingTemplate({ ...editingTemplate, company: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setEditingTemplate(null)} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase text-slate-500 tracking-widest hover:bg-white border border-transparent transition-colors">Cancel</button>
              <button onClick={handleSaveTemplateEdit} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
