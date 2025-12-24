import React, { useState, useRef } from 'react';
import { ChevronLeft, Building2, LayoutGrid, Hammer, MessageSquare, Info, Plus, X, ArrowRight, ShieldCheck, Mail, Phone, FileText, Trees, PieChart, TrendingUp } from 'lucide-react';
import { Development, Block, ExternalItem, Correspondence } from '../types';
import { getBlockEstimatedRCA, getDevelopmentTotalRCA } from '../store';

interface DevelopmentPageProps {
  development: Development;
  onSelectBlock: (block: Block) => void;
  onUpdateDevelopment: (dev: Development) => void;
  onBack: () => void;
}

const NumberInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
}> = ({ value, onChange, prefix }) => (
  <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
    {prefix && <span className="pl-3 text-slate-400 font-medium text-xs">{prefix}</span>}
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full bg-transparent py-2 px-3 text-sm font-bold text-slate-900 outline-none"
    />
  </div>
);

const DevelopmentPage: React.FC<DevelopmentPageProps> = ({ 
  development, 
  onSelectBlock, 
  onUpdateDevelopment,
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'externals' | 'correspondence'>('summary');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const updateDev = (updates: Partial<Development>) => {
    onUpdateDevelopment({ ...development, ...updates });
  };

  const handleAddBlock = () => {
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
      fees: {
        professionalPercent: 12.5,
        localAuthority: 1500
      }
    };
    updateDev({ blocks: [...(development.blocks || []), newBlock] });
  };

  // Fixed addExternal to use correct property 'externalsAssessment'
  const addExternal = (category: ExternalItem['category']) => {
    const newItem: ExternalItem = {
      id: Date.now().toString(),
      category,
      description: '',
      quantity: 0,
      rate: 0,
      unit: category === 'Landscaping' ? 'm2' : 'Nr'
    };
    updateDev({ 
      externalsAssessment: { 
        ...development.externalsAssessment, 
        items: [...(development.externalsAssessment.items || []), newItem] 
      } 
    });
  };

  // Fixed removeExternal to use correct property 'externalsAssessment'
  const removeExternal = (id: string) => {
    updateDev({ 
      externalsAssessment: { 
        ...development.externalsAssessment, 
        items: (development.externalsAssessment.items || []).filter(e => e.id !== id) 
      } 
    });
  };

  const addCorrespondence = (type: Correspondence['type']) => {
    const newCorr: Correspondence = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      author: 'Current User',
      type,
      content: ''
    };
    updateDev({ correspondence: [newCorr, ...(development.correspondence || [])] });
  };

  const totalDevRCA = getDevelopmentTotalRCA(development);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all border border-slate-200">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{development.name}</h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">{development.reference} • Project Hub</p>
          </div>
        </div>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-200">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Project Value</p>
           <p className="text-xl font-black">£{totalDevRCA.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-8 max-w-6xl mx-auto w-full space-y-10 pb-20">
        
        {/* Description Section */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-10 -mr-16 -mt-16"></div>
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Info size={20} className="text-blue-500" /> Development Description</h3>
              <button 
                onClick={() => setIsEditingDesc(!isEditingDesc)}
                className="text-[10px] font-black uppercase text-blue-600 hover:underline"
              >
                {isEditingDesc ? 'Save Description' : 'Edit Description'}
              </button>
           </div>
           {isEditingDesc ? (
             <textarea 
               value={development.description}
               onChange={e => updateDev({ description: e.target.value })}
               className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10"
               placeholder="Enter detailed development overview..."
             />
           ) : (
             <p className="text-slate-600 text-sm leading-relaxed font-medium">
               {development.description || 'No description provided. Click edit to add an overview of this development.'}
             </p>
           )}
        </section>

        {/* Tab Navigation */}
        <div className="flex gap-4 p-1 bg-slate-200/50 rounded-2xl w-fit">
           <button onClick={() => setActiveTab('summary')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Summary & Blocks</button>
           <button onClick={() => setActiveTab('externals')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'externals' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Development Externals</button>
           <button onClick={() => setActiveTab('correspondence')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'correspondence' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Correspondence</button>
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(development.blocks || []).map(block => {
                   const blockRCA = getBlockEstimatedRCA(block);
                   return (
                     <div key={block.id} onClick={() => onSelectBlock(block)} className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center"><Building2 size={20} /></div>
                              <div>
                                 <h4 className="font-black text-slate-900">{block.name}</h4>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.reference}</p>
                              </div>
                           </div>
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${block.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{block.status}</span>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Block Assessment</p>
                              <p className="text-xl font-black text-slate-900">£{blockRCA.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                           </div>
                           <button className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><ArrowRight size={20} /></button>
                        </div>
                     </div>
                   );
                })}
                <button 
                  onClick={handleAddBlock}
                  className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all"
                >
                   <Plus size={32} />
                   <p className="font-black uppercase text-xs tracking-widest">Add New Block</p>
                </button>
             </div>
          </div>
        )}

        {activeTab === 'externals' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-white p-8">
                   <h3 className="text-xl font-bold flex items-center gap-3"><Hammer size={24} className="text-blue-400" /> Project-Wide Externals</h3>
                   <p className="text-slate-400 text-sm mt-1">Assessment of shared site works, outbuildings, and landscaping.</p>
                </div>

                {['Outbuildings', 'Landscaping', 'Anomalies'].map(cat => (
                  <div key={cat} className="p-8 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between mb-6">
                       <h4 className={`text-[12px] font-black uppercase tracking-widest flex items-center gap-2 ${cat === 'Outbuildings' ? 'text-fuchsia-600' : cat === 'Landscaping' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {cat === 'Outbuildings' ? <ShieldCheck size={16} /> : cat === 'Landscaping' ? <Trees size={16} /> : <LayoutGrid size={16} />} {cat}
                       </h4>
                       <button onClick={() => addExternal(cat as any)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-3">
                       {/* Fixed to use development.externalsAssessment.items */}
                       {(development.externalsAssessment.items || []).filter(e => e.category === cat).map(ext => (
                         <div key={ext.id} className="grid grid-cols-12 gap-4 items-center group">
                            <div className="col-span-6">
                               <input 
                                 value={ext.description} 
                                 onChange={e => {
                                   const next = (development.externalsAssessment.items || []).map(x => x.id === ext.id ? {...x, description: e.target.value} : x);
                                   updateDev({ externalsAssessment: { ...development.externalsAssessment, items: next } });
                                 }}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm font-bold text-slate-900" 
                                 placeholder="Item name..." 
                               />
                            </div>
                            <div className="col-span-2">
                               <NumberInput 
                                 value={ext.quantity} 
                                 onChange={v => {
                                   const next = (development.externalsAssessment.items || []).map(x => x.id === ext.id ? {...x, quantity: v} : x);
                                   updateDev({ externalsAssessment: { ...development.externalsAssessment, items: next } });
                                 }}
                               />
                            </div>
                            <div className="col-span-1">
                               <input 
                                 value={ext.unit} 
                                 onChange={e => {
                                   const next = (development.externalsAssessment.items || []).map(x => x.id === ext.id ? {...x, unit: e.target.value} : x);
                                   updateDev({ externalsAssessment: { ...development.externalsAssessment, items: next } });
                                 }}
                                 className="w-full bg-transparent text-[11px] font-black text-slate-400 uppercase text-center" 
                                 placeholder="Nr" 
                               />
                            </div>
                            <div className="col-span-2">
                               <NumberInput 
                                 value={ext.rate} 
                                 prefix="£" 
                                 onChange={v => {
                                   const next = (development.externalsAssessment.items || []).map(x => x.id === ext.id ? {...x, rate: v} : x);
                                   updateDev({ externalsAssessment: { ...development.externalsAssessment, items: next } });
                                 }}
                               />
                            </div>
                            <div className="col-span-1 text-right">
                               <button onClick={() => removeExternal(ext.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16} /></button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'correspondence' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><MessageSquare size={24} className="text-blue-500" /> Interaction Log</h3>
                <div className="flex gap-2">
                   <button onClick={() => addCorrespondence('Note')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"><FileText size={14} /> Add Note</button>
                   <button onClick={() => addCorrespondence('Email')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"><Mail size={14} /> Log Email</button>
                </div>
             </div>
             <div className="space-y-4">
                {(development.correspondence || []).map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex gap-6">
                     <div className="shrink-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'Note' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                           {item.type === 'Note' ? <FileText size={20} /> : <Mail size={20} />}
                        </div>
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.date} • {item.author}</span>
                              <h5 className="font-bold text-slate-900">{item.type} entry</h5>
                           </div>
                           <button onClick={() => updateDev({ correspondence: (development.correspondence || []).filter(c => c.id !== item.id) })} className="text-slate-300 hover:text-red-500"><X size={16} /></button>
                        </div>
                        <textarea 
                          value={item.content}
                          onChange={e => {
                            const next = (development.correspondence || []).map(c => c.id === item.id ? {...c, content: e.target.value} : c);
                            updateDev({ correspondence: next });
                          }}
                          className="w-full bg-slate-50/50 border border-transparent hover:border-slate-100 focus:border-blue-200 rounded-xl p-3 text-sm font-medium text-slate-600 outline-none transition-all"
                          placeholder="Type entry details here..."
                        />
                     </div>
                  </div>
                ))}
                {(!development.correspondence || development.correspondence.length === 0) && (
                  <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                     <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No project logs yet</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevelopmentPage;