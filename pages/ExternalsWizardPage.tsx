import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Plus, Info, Hammer, X, ShieldCheck, Undo2, Loader2, ChevronDown, AlertTriangle, Trash2, LayoutGrid, MapPin, TrendingUp, CheckCircle2, Circle, Trees } from 'lucide-react';
import { Development, ExternalItem, ExternalCategory, ExternalsAssessment } from '../types';

const REGIONAL_FACTORS: Record<string, number> = {
  'Inner London': 1.04,
  'Outer London': 1.00,
  'South East (excluding London)': 0.95,
  'South West': 0.90,
  'West Midlands': 0.89,
  'East Midlands': 0.89,
  'East of England': 0.93,
  'Wales': 0.88,
  'North West': 0.90,
  'Yorkshire and Humberside': 0.87,
  'North East': 0.84,
  'Scotland': 0.88,
  'Northern Ireland': 0.77
};

const BUILDING_CATEGORIES = [
  { label: 'Flats/ Apartments - Low Rise 1-3 Storeys', minRate: 2100, maxRate: 2500 },
  { label: 'Flats/ Apartments - Medium Rise 4-10 Storeys', minRate: 2600, maxRate: 3400 },
  { label: 'Flats/ Apartments - High Rise 11-20 Storeys', minRate: 3500, maxRate: 5000 },
  { label: 'Houses - Terraced', minRate: 1500, maxRate: 3000 },
  { label: 'Houses - Semi Detached', minRate: 1500, maxRate: 3000 },
  { label: 'Houses - Detached', minRate: 1500, maxRate: 3000 },
  { label: 'Commercial Unit', minRate: 1000, maxRate: 5000 },
];

const getRateOptions = (category: { minRate: number; maxRate: number }) => {
  const options = [];
  for (let rate = category.minRate; rate <= category.maxRate; rate += 50) {
    options.push(rate);
  }
  return options;
};

const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === 0) return decimals === 0 ? '0' : '0.00';
  return num.toLocaleString('en-GB', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
};

const DROPDOWN_INCREMENTS = [0, 5, 10, 12, 12.5, 15, 17.5, 20, 25, 30];

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  step?: number;
  prefix?: string;
  suffix?: string;
  allowDecimals?: boolean;
  paddingClass?: string;
  maxDigits?: number;
  disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({ 
  value, 
  onChange, 
  className = '', 
  step = 1, 
  prefix, 
  suffix, 
  allowDecimals = true, 
  paddingClass = 'py-2.5 px-3',
  maxDigits,
  disabled 
}) => {
  const [localValue, setLocalValue] = useState<string>(formatNumber(value, allowDecimals ? 2 : 0));

  useEffect(() => {
    const currentNumeric = parseFloat(localValue.replace(/,/g, '')) || 0;
    if (value !== currentNumeric) {
      setLocalValue(formatNumber(value, allowDecimals ? 2 : 0));
    }
  }, [value, allowDecimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    let raw = e.target.value;
    if (!allowDecimals) {
      raw = raw.replace(/[^0-9]/g, '');
    } else {
      raw = raw.replace(/[^0-9.]/g, '');
      const parts = raw.split('.');
      if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    }

    if (maxDigits) {
      const wholePart = raw.split('.')[0];
      if (wholePart.length > maxDigits) return;
    }

    setLocalValue(raw);
    const parsed = allowDecimals ? parseFloat(raw.replace(/,/g, '')) : parseInt(raw.replace(/,/g, ''), 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (raw === '') {
      onChange(0);
    }
  };

  const handleBlur = () => {
    setLocalValue(formatNumber(value, allowDecimals ? 2 : 0));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled) return;
    setLocalValue(value === 0 ? '0' : (allowDecimals ? value.toString() : Math.round(value).toString()));
    e.target.select();
  };

  const adjust = (dir: 1 | -1) => {
    if (disabled) return;
    const current = value || 0;
    const next = Math.max(0, current + (step * dir));
    onChange(next);
  };

  return (
    <div className={`flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {prefix && <span className="pl-3 text-slate-400 font-bold text-sm">{prefix}</span>}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled}
        className={`w-full bg-transparent ${paddingClass} text-sm font-black text-slate-900 outline-none border-none disabled:cursor-not-allowed`}
      />
      {suffix && <span className="pr-3 text-slate-400 font-bold text-sm">{suffix}</span>}
      <div className="flex flex-col border-l border-slate-100 shrink-0">
        <button tabIndex={-1} disabled={disabled} onClick={() => adjust(1)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 transition-colors border-b border-slate-100 disabled:opacity-30">
          <ChevronDown className="rotate-180" size={10} />
        </button>
        <button tabIndex={-1} disabled={disabled} onClick={() => adjust(-1)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-30">
          <ChevronDown size={10} />
        </button>
      </div>
    </div>
  );
};

const ExternalsWizardPage: React.FC<{
  development: Development;
  isSaving: boolean;
  onBack: () => void;
  onUpdateDevelopment: (dev: Development) => void;
  onUndo: () => void;
  canUndo: boolean;
  onExport: () => void;
}> = ({ 
  development, 
  isSaving,
  onBack, 
  onUpdateDevelopment,
  onUndo,
  canUndo,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'item' | 'bulk', id?: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const assessment = development.externalsAssessment;
  const isLocked = assessment.status === 'Completed';

  const currentBaseRate = assessment.baseRate || 2600;
  const currentCategoryLabel = assessment.categoryLabel || BUILDING_CATEGORIES[0].label;
  const activeCategory = BUILDING_CATEGORIES.find(c => c.label === currentCategoryLabel) || BUILDING_CATEGORIES[0];

  const sectionRefs = [
    useRef<HTMLDivElement>(null), // Outbuildings
    useRef<HTMLDivElement>(null), // Anomalies
    useRef<HTMLDivElement>(null)  // Summary
  ];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPos = container.scrollTop + 250;
      let currentIdx = 0;
      sectionRefs.forEach((ref, idx) => {
        if (ref.current && scrollPos >= ref.current.offsetTop) {
          currentIdx = idx;
        }
      });
      setActiveStep(currentIdx);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    const target = sectionRefs[idx].current;
    if (target && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: target.offsetTop - 160,
        behavior: 'smooth'
      });
    }
  };

  const updateExternals = (updates: Partial<ExternalsAssessment>) => {
    if (isLocked && !updates.status) return;
    onUpdateDevelopment({
      ...development,
      externalsAssessment: { ...assessment, ...updates }
    });
  };

  const toggleSectionCompletion = (sectionId: string) => {
    if (isLocked) return;
    const currentCompleted = assessment.completedSections || [];
    const isCompleted = currentCompleted.includes(sectionId);
    const nextCompleted = isCompleted 
      ? currentCompleted.filter(id => id !== sectionId)
      : [...currentCompleted, sectionId];
    updateExternals({ completedSections: nextCompleted });
  };

  const handleLocationChange = (region: string) => {
    if (isLocked) return;
    const factor = REGIONAL_FACTORS[region] || assessment.locationFactor || 1.0;
    updateExternals({ 
      locationName: region,
      locationFactor: factor
    });
  };

  const addExternal = (category: ExternalCategory) => {
    if (isLocked) return;
    const newItem: ExternalItem = {
      id: Date.now().toString(),
      category,
      description: '',
      quantity: 0,
      rate: category === 'Outbuildings' ? currentBaseRate : 0,
      unit: category === 'Outbuildings' ? 'm2' : 'Nr'
    };
    updateExternals({ items: [...(assessment.items || []), newItem] });
  };

  const toggleSelection = (id: string) => {
    if (isLocked) return;
    const next = new Set(selectedItems);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedItems(next);
  };

  const confirmDelete = () => {
    if (!deleteTarget || isLocked) return;
    if (deleteTarget.type === 'item' && deleteTarget.id) {
      updateExternals({ items: (assessment.items || []).filter(e => e.id !== deleteTarget.id) });
      const nextSelected = new Set(selectedItems);
      nextSelected.delete(deleteTarget.id);
      setSelectedItems(nextSelected);
    } else if (deleteTarget.type === 'bulk') {
      updateExternals({ items: (assessment.items || []).filter(e => !selectedItems.has(e.id)) });
      setSelectedItems(new Set());
    }
    setDeleteTarget(null);
  };

  const handleFinalize = () => {
    const isNowCompleted = assessment.status !== 'Completed';
    const nextStatus = isNowCompleted ? 'Completed' : 'In Progress';
    
    // If finalizing, auto-complete all sections
    const nextCompleted = isNowCompleted 
      ? steps.map(s => s.id)
      : assessment.completedSections;
      
    updateExternals({ 
      status: nextStatus,
      completedSections: nextCompleted
    });
    
    // Stay on page if unlocking, otherwise go back
    if (isNowCompleted) {
      onBack();
    }
  };

  const regionalFactorName = assessment.locationName || 'Standard';
  const regionalFactorValue = assessment.locationFactor || 1.0;

  const outbuildingsItems = (assessment.items || []).filter(i => i.category === 'Outbuildings');
  const anomaliesItems = (assessment.items || []).filter(i => i.category === 'Anomalies');

  const outbuildingsBaseSum = outbuildingsItems.reduce((acc, i) => acc + (i.quantity * i.rate), 0);
  const outbuildingsNetTotal = outbuildingsBaseSum * regionalFactorValue;

  const anomaliesBaseSum = anomaliesItems.reduce((acc, i) => acc + (i.quantity * i.rate), 0);
  const anomaliesNetTotal = anomaliesBaseSum * regionalFactorValue;

  const totalExternalsNet = outbuildingsNetTotal + anomaliesNetTotal;
  
  const feesPercent = assessment.fees?.professionalPercent ?? 12.5;
  const laFees = assessment.fees?.localAuthority ?? 0;
  
  const feesAmount = totalExternalsNet * (feesPercent / 100);
  const totalDayOneRCA = totalExternalsNet + feesAmount + laFees;

  const steps = [
    { id: 'outbuildings', title: 'Outbuildings', icon: <Hammer size={18} /> },
    { id: 'anomalies', title: 'Anomalies', icon: <LayoutGrid size={18} /> },
    { id: 'summary', title: 'Summary', icon: <ShieldCheck size={18} /> }
  ];
  
  const totalSelectedCount = selectedItems.size;

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: React.ReactNode }) => {
    const isCompleted = (assessment.completedSections || []).includes(id);
    return (
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
          <div className={`p-3 rounded-2xl shadow-inner transition-colors ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {Icon}
          </div>
          {title}
        </h3>
        <button 
          disabled={isLocked}
          onClick={() => toggleSectionCompletion(id)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
            isCompleted 
              ? 'bg-green-50 border-green-200 text-green-600' 
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
          } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isCompleted ? <><CheckCircle2 size={16} /> Section Done</> : <><Circle size={16} /> Mark as Done</>}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 font-inter">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all border border-slate-200"><ChevronLeft size={22} /></button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Externals Assessment</h2>
            <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              <span className="whitespace-nowrap">{development.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLocked && (
            <div className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 shadow-sm animate-pulse">
              <ShieldCheck size={14} /> Editing Locked
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
            {isSaving ? <><Loader2 size={12} className="text-emerald-500 animate-spin" /><span className="text-[12px] font-black uppercase text-emerald-500 tracking-wider whitespace-nowrap">Syncing</span></> : <><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /><span className="text-[12px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">Saved</span></>}
          </div>
          <button disabled={!canUndo || isLocked} onClick={onUndo} className={`p-2 rounded-xl border transition-all ${canUndo && !isLocked ? 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-emerald-600' : 'text-slate-300 border-slate-100'}`}><Undo2 size={18} /></button>
        </div>
      </div>

      {/* Anchor Navigation */}
      <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar scroll-smooth sticky top-[73px] z-40">
        {steps.map((step, idx) => {
          const isComp = (assessment.completedSections || []).includes(step.id);
          return (
            <button 
              key={idx} 
              onClick={() => scrollToSection(idx)} 
              className={`flex-1 min-w-[140px] px-6 py-4 border-b-4 transition-all flex flex-col items-center justify-center gap-1 group ${activeStep === idx ? 'border-emerald-600 bg-emerald-50/20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                isComp ? 'bg-green-600 text-white shadow-lg shadow-green-200' :
                activeStep === idx ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
              }`}>
                 {isComp ? <CheckCircle2 size={13} /> : React.cloneElement(step.icon as React.ReactElement, { size: 13 })}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tight transition-colors whitespace-nowrap ${activeStep === idx ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Delete Selected Overlay */}
      {totalSelectedCount > 0 && !isLocked && (
        <div className="fixed bottom-32 left-[calc(144px+50%)] -translate-x-1/2 z-[100] flex justify-center pointer-events-none">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-4 pointer-events-auto">
             <div className="flex items-center gap-3">
                <Trash2 size={18} className="text-emerald-400" />
                <p className="text-sm font-black uppercase tracking-widest whitespace-nowrap">{totalSelectedCount} Selected</p>
             </div>
             <div className="h-8 w-px bg-white/20" />
             <div className="flex gap-3">
                <button onClick={() => setSelectedItems(new Set())} className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors whitespace-nowrap">Clear</button>
                <button onClick={() => setDeleteTarget({ type: 'bulk' })} className="px-8 py-2 bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-900/40 transition-all whitespace-nowrap">Delete Selected</button>
             </div>
          </div>
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar p-6 md:p-12 space-y-24 pb-32">
        
        {/* Externals Rate Configuration */}
        <section className="max-w-3xl mx-auto scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-12">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><TrendingUp size={24} /></div>
              Externals Rate Configuration
            </h3>

            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-8 items-end">
                 <div>
                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1 whitespace-nowrap">UK Region Factor</label>
                    <div className="relative group/select">
                      <select 
                        disabled={isLocked}
                        value={assessment.locationName || ''} 
                        onChange={e => handleLocationChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                      >
                        <option value="" disabled>Select Region...</option>
                        {Object.keys(REGIONAL_FACTORS).sort().map(region => (<option key={region} value={region}>{region}</option>))}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1 whitespace-nowrap">Factor Multiplier (%)</label>
                    <NumberInput disabled={isLocked} value={assessment.locationFactor || 1} step={0.01} suffix="%" paddingClass="py-4 px-3" onChange={val => updateExternals({ locationFactor: val })} />
                 </div>
              </div>

              <div className="grid grid-cols-12 gap-8 items-end">
                <div className="col-span-9">
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1 whitespace-nowrap">Building Category</label>
                  <div className="relative group/select">
                    <select 
                      disabled={isLocked}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 transition-all pr-12 disabled:opacity-50"
                      onChange={(e) => updateExternals({ categoryLabel: e.target.value })}
                      value={currentCategoryLabel}
                    >
                      {BUILDING_CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1 text-right whitespace-nowrap">Base Rate</label>
                  <div className="relative group/select">
                    <select 
                      disabled={isLocked}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 text-right pr-10 disabled:opacity-50"
                      value={currentBaseRate}
                      onChange={(e) => updateExternals({ baseRate: parseInt(e.target.value) })}
                    >
                      {getRateOptions(activeCategory).map(r => (
                        <option key={r} value={r}>£{formatNumber(r, 0)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Outbuildings Section */}
        <section ref={sectionRefs[0]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="outbuildings" title="Outbuildings Assessment" icon={<Hammer size={24} />} />

            <div className="space-y-6">
              {!isLocked && (
                <button onClick={() => addExternal('Outbuildings')} className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 px-6 py-3 rounded-2xl transition-all border border-emerald-100 shadow-sm whitespace-nowrap mb-6">
                  <Plus size={16} /> Add Building
                </button>
              )}
              <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner mb-8">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Description</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">GIA (m²)</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Rate (£/m²)</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Sum (£)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outbuildingsItems.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <tr key={item.id} onClick={() => !isLocked && toggleSelection(item.id)} className={`group transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50' : 'hover:bg-white'} ${isLocked ? 'cursor-default' : ''}`}>
                          <td className="px-6 py-3">
                            <input 
                              disabled={isLocked}
                              value={item.description} 
                              title={item.description}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { const next = (assessment.items || []).map(x => x.id === item.id ? {...x, description: e.target.value} : x); updateExternals({ items: next }); }}
                              className="w-full bg-transparent border-none text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300 truncate disabled:opacity-50" 
                              placeholder="e.g. Bin Store..." 
                            />
                          </td>
                          <td className="px-6 py-3 w-32" onClick={e => e.stopPropagation()}>
                            <NumberInput disabled={isLocked} value={item.quantity} paddingClass="py-1 px-2 text-center" maxDigits={5} allowDecimals={true} onChange={v => { const next = (assessment.items || []).map(x => x.id === item.id ? {...x, quantity: v} : x); updateExternals({ items: next }); }} />
                          </td>
                          <td className="px-6 py-3 w-32" onClick={e => e.stopPropagation()}>
                            <NumberInput disabled={isLocked} value={item.rate} paddingClass="py-1 px-2 text-right" maxDigits={6} prefix="£" onChange={v => { const next = (assessment.items || []).map(x => x.id === item.id ? {...x, rate: v} : x); updateExternals({ items: next }); }} />
                          </td>
                          <td className="px-6 py-3 w-36 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-900 whitespace-nowrap">£{formatNumber(item.quantity * item.rate, 2)}</span>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {outbuildingsItems.length > 0 && (
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800 space-y-6">
                   <div className="grid grid-cols-2 gap-12 items-center">
                      <div className="space-y-4">
                         <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Location Factor</span>
                            <span className="text-emerald-400 text-sm font-black whitespace-nowrap">{regionalFactorName} (x{formatNumber(regionalFactorValue, 2)})</span>
                         </div>
                         <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Base Total</span>
                            <span className="text-slate-300 text-sm font-black whitespace-nowrap">£{formatNumber(outbuildingsBaseSum, 2)}</span>
                         </div>
                      </div>
                      <div className="text-center bg-white/5 p-8 rounded-3xl border border-white/10">
                         <p className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1 whitespace-nowrap">Net Outbuilding Cost</p>
                         <h4 className="text-4xl font-black tracking-tighter whitespace-nowrap">£{formatNumber(outbuildingsNetTotal, 2)}</h4>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Anomalies Section */}
        <section ref={sectionRefs[1]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="anomalies" title="Anomalies Assessment" icon={<LayoutGrid size={24} />} />

            <div className="space-y-6">
              {!isLocked && (
                <button onClick={() => addExternal('Anomalies')} className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 px-6 py-3 rounded-2xl transition-all border border-emerald-100 shadow-sm whitespace-nowrap mb-6">
                  <Plus size={16} /> Add Anomaly
                </button>
              )}
              <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner mb-8">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Item Detail</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Unit</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">QTY / Area</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Net Cost (£)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {anomaliesItems.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      const isLockedItem = item.description.includes('£/m2') || item.description.includes('Parking') || item.description.includes('Footpath') || item.description.includes('Paving') || item.description.includes('Landscaping') || item.description.includes('Planting') || item.description.includes('Woodland');
                      
                      return (
                        <tr key={item.id} onClick={() => !isLocked && toggleSelection(item.id)} className={`group transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50' : 'hover:bg-white'} ${isLocked ? 'cursor-default' : ''}`}>
                          <td className="px-6 py-3">
                            <input 
                              disabled={isLocked}
                              value={item.description} 
                              title={item.description}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { const next = (assessment.items || []).map(x => x.id === item.id ? {...x, description: e.target.value} : x); updateExternals({ items: next }); }}
                              className="w-full bg-transparent border-none text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300 truncate disabled:opacity-50" 
                              placeholder="Item Detail..." 
                            />
                          </td>
                          <td className="px-6 py-3 w-20">
                            <select 
                              value={item.unit} 
                              disabled={isLockedItem || isLocked}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { const next = (assessment.items || []).map(x => x.id === item.id ? {...x, unit: e.target.value} : x); updateExternals({ items: next }); }}
                              className={`w-full bg-white border border-slate-100 rounded-lg py-1 px-1 text-[10px] font-black text-slate-900 appearance-none outline-none text-center whitespace-nowrap ${(isLockedItem || isLocked) ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                            >
                              {['m2', 'Lm', 'Nr'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-3 w-40" onClick={e => e.stopPropagation()}>
                            <NumberInput 
                                disabled={isLocked}
                                value={item.quantity} 
                                paddingClass="py-1 px-2 text-center" 
                                maxDigits={5} 
                                allowDecimals={item.unit !== 'Nr'} 
                                onChange={v => { const next = (assessment.items || []).map(x => x.id === item.id ? {...x, quantity: v} : x); updateExternals({ items: next }); }} 
                            />
                          </td>
                          <td className="px-6 py-3 w-40 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-900 whitespace-nowrap">£{formatNumber(item.quantity * item.rate * regionalFactorValue, 2)}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Rate: £{formatNumber(item.rate, 2)}</span>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {anomaliesItems.length > 0 && (
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800 space-y-6">
                   <div className="grid grid-cols-2 gap-12 items-center">
                      <div className="space-y-4">
                         <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Location Multiplier</span>
                            <span className="text-emerald-400 text-sm font-black whitespace-nowrap">{regionalFactorName} (x{formatNumber(regionalFactorValue, 2)})</span>
                         </div>
                         <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Anomalies Sum (Base)</span>
                            <span className="text-slate-300 text-sm font-black whitespace-nowrap">£{formatNumber(anomaliesBaseSum, 2)}</span>
                         </div>
                      </div>
                      <div className="text-center bg-white/5 p-8 rounded-3xl border border-white/10">
                         <p className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1 whitespace-nowrap">Adjusted Anomalies Cost</p>
                         <h4 className="text-4xl font-black tracking-tighter whitespace-nowrap">£{formatNumber(anomaliesNetTotal, 2)}</h4>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Summary Section */}
        <section ref={sectionRefs[2]} className="max-w-3xl mx-auto scroll-mt-32">
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
             <div className="bg-slate-900 text-white p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5"><ShieldCheck size={120} /></div>
                <h3 className="text-2xl font-black uppercase tracking-[0.3em] flex items-center gap-4 relative z-10 whitespace-nowrap">
                   <ShieldCheck className="text-emerald-400" size={32} /> Assessment Summary
                </h3>
             </div>

             <div className="p-12 space-y-12">
                <div className="space-y-6">
                   <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4 px-1 whitespace-nowrap">Valuation Breakdown</h4>
                   <div className="space-y-4 font-bold">
                      <div className="flex justify-between items-center text-sm text-slate-600">
                         <span className="whitespace-nowrap">Outbuildings Aggregate Value (Adjusted)</span>
                         <span className="text-slate-900 whitespace-nowrap">£{formatNumber(outbuildingsNetTotal, 2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-600">
                         <span className="whitespace-nowrap">Anomalous Items (Adjusted)</span>
                         <span className="text-slate-900 whitespace-nowrap">£{formatNumber(anomaliesNetTotal, 2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-3 border-t border-slate-100">
                         <span className="whitespace-nowrap">Total Net Externals Reinstatement</span>
                         <span className="text-lg whitespace-nowrap">£{formatNumber(totalExternalsNet, 2)}</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4 px-1 whitespace-nowrap">Fees & Provisions</h4>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-slate-900 whitespace-nowrap">Professional Fees</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Value: £{formatNumber(feesAmount, 2)}</span>
                         </div>
                         <div className="w-32">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Percentage %</p>
                             <select 
                                disabled={isLocked}
                                value={feesPercent} 
                                onChange={e => updateExternals({ fees: { ...(assessment.fees || { localAuthority: 0 }), professionalPercent: parseFloat(e.target.value) } })}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-black text-slate-900 outline-none appearance-none whitespace-nowrap disabled:opacity-50"
                             >
                                {DROPDOWN_INCREMENTS.map(opt => <option key={opt} value={opt}>{opt}%</option>)}
                             </select>
                         </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-slate-900 whitespace-nowrap">Local Authority Fees</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Fixed Provision</span>
                         </div>
                         <div className="w-40" onClick={e => e.stopPropagation()}>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Fee Value (£)</p>
                             <NumberInput disabled={isLocked} value={laFees} prefix="£" onChange={v => updateExternals({ fees: { ...(assessment.fees || { professionalPercent: 12.5 }), localAuthority: v } })} />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-6">
                   <div className="bg-slate-900 text-white rounded-[3.5rem] p-16 relative overflow-hidden shadow-2xl border border-slate-800 text-center space-y-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-transparent"></div>
                      <p className="text-emerald-400 text-[14px] font-black uppercase tracking-[0.5em] relative z-10 whitespace-nowrap">Total Externals Assessment</p>
                      <h2 className="text-8xl font-black tracking-tighter relative z-10 whitespace-nowrap">£{formatNumber(totalDayOneRCA, 0)}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 relative z-10 whitespace-nowrap">(Rounded for Day One Reinstatement Basis)</p>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </div>

      <div className="bg-white border-t border-slate-200 p-8 flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={onBack} className="flex items-center gap-2 px-10 py-4 text-slate-600 font-black uppercase tracking-widest text-[12px] hover:bg-slate-50 rounded-[2rem] transition-all border border-slate-200 shadow-sm whitespace-nowrap">Project Hub</button>
        <button onClick={handleFinalize} className={`flex items-center gap-3 px-12 py-4 text-white font-black uppercase tracking-[0.1em] text-[12px] rounded-[2rem] transition-all shadow-2xl whitespace-nowrap ${assessment.status === 'Completed' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-300' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'}`}>
          {assessment.status === 'Completed' ? 'Unlock for Editing' : 'Finalize Externals'}
        </button>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 whitespace-nowrap">
               {deleteTarget.type === 'bulk' ? 'Delete Selected?' : 'Delete Item?'}
            </h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
               {deleteTarget.type === 'bulk' 
                  ? `You are about to delete ${totalSelectedCount} selected items. This action cannot be undone.` 
                  : 'This action will remove the item forever. It cannot be undone.'}
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-xl border border-slate-200 transition-all whitespace-nowrap">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all whitespace-nowrap">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalsWizardPage;