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

const steps = [
  { id: 'calibration', title: 'Calibration', icon: <TrendingUp size={13} /> },
  { id: 'outbuildings', title: 'Outbuildings', icon: <Hammer size={13} /> },
  { id: 'anomalies', title: 'Anomalies', icon: <LayoutGrid size={13} /> },
  { id: 'summary', title: 'Summary', icon: <ShieldCheck size={13} /> }
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
  value, onChange, className = '', step = 1, prefix, suffix, allowDecimals = true, paddingClass = 'py-2.5 px-3', maxDigits, disabled 
}) => {
  const [localValue, setLocalValue] = useState<string>(formatNumber(value, allowDecimals ? 2 : 0));
  useEffect(() => {
    const currentNumeric = parseFloat(localValue.replace(/,/g, '')) || 0;
    if (value !== currentNumeric) setLocalValue(formatNumber(value, allowDecimals ? 2 : 0));
  }, [value, allowDecimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    let raw = e.target.value.replace(/,/g, '');
    if (!allowDecimals) raw = raw.replace(/[^0-9]/g, '');
    else raw = raw.replace(/[^0-9.]/g, '');
    setLocalValue(raw);
    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(parsed)) onChange(parsed);
    else if (raw === '') onChange(0);
  };

  const adjust = (e: React.MouseEvent, dir: 1 | -1) => {
    e.stopPropagation();
    if (disabled) return;
    const current = value || 0;
    const next = Math.max(0, current + (step * dir));
    onChange(next);
  };

  return (
    <div className={`flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {prefix && <span className="pl-3 text-slate-400 font-bold text-sm">{prefix}</span>}
      <input type="text" value={localValue} onChange={handleChange} onBlur={() => setLocalValue(formatNumber(value, allowDecimals ? 2 : 0))} onFocus={(e) => e.target.select()} disabled={disabled} className={`w-full bg-transparent ${paddingClass} text-sm font-bold text-slate-900 outline-none border-none`} />
      {suffix && <span className="pr-1 text-slate-400 font-bold text-sm">{suffix}</span>}
      <div className="flex flex-col border-l border-slate-100 shrink-0">
        <button tabIndex={-1} disabled={disabled} onClick={(e) => adjust(e, 1)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 transition-colors border-b border-slate-100 disabled:opacity-30">
          <ChevronDown className="rotate-180" size={10} />
        </button>
        <button tabIndex={-1} disabled={disabled} onClick={(e) => adjust(e, -1)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-30">
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
}> = ({ development, onBack, onUpdateDevelopment }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteWarning, setShowDeleteWarning] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const assessment = development.externalsAssessment;
  const isLocked = assessment.status === 'Completed';

  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollPos = container.scrollTop + 250;
      let currentIdx = 0;
      sectionRefs.forEach((ref, idx) => { if (ref.current && scrollPos >= ref.current.offsetTop) currentIdx = idx; });
      setActiveStep(currentIdx);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    const target = sectionRefs[idx].current;
    if (target && scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: target.offsetTop - 160, behavior: 'smooth' });
  };

  const currentBaseRate = assessment.baseRate || 2600;
  const currentCategoryLabel = assessment.categoryLabel || BUILDING_CATEGORIES[0].label;
  const activeCategory = BUILDING_CATEGORIES.find(c => c.label === currentCategoryLabel) || BUILDING_CATEGORIES[0];

  const updateExternals = (updates: Partial<ExternalsAssessment>) => {
    if (isLocked && !updates.status) return;
    onUpdateDevelopment({ ...development, externalsAssessment: { ...assessment, ...updates } });
  };

  const handleFinalize = () => {
    const nextStatus = assessment.status === 'Completed' ? 'In Progress' : 'Completed';
    updateExternals({ status: nextStatus });
    if (nextStatus === 'Completed') onBack();
  };

  const performBulkDelete = () => {
    updateExternals({ items: assessment.items.filter(i => !selectedItems.has(i.id)) }); 
    setSelectedItems(new Set());
    setShowDeleteWarning(false);
  };

  const outbuildingsItems = (assessment.items || []).filter(i => i.category === 'Outbuildings');
  const anomaliesItems = (assessment.items || []).filter(i => i.category === 'Anomalies');
  const regionalFactorValue = assessment.locationFactor || 1.0;
  const outbuildingsBaseSum = outbuildingsItems.reduce((acc, i) => acc + (i.quantity * i.rate), 0);
  const outbuildingsNetTotal = outbuildingsBaseSum * regionalFactorValue;
  const anomaliesBaseSum = anomaliesItems.reduce((acc, i) => acc + (i.quantity * i.rate), 0);
  const anomaliesNetTotal = anomaliesBaseSum * regionalFactorValue;
  const totalExternalsNet = outbuildingsNetTotal + anomaliesNetTotal;
  const feesPercent = assessment.fees?.professionalPercent ?? 12.5;
  const laFees = assessment.fees?.localAuthority ?? 0;
  const totalDayOneRCA = totalExternalsNet + (totalExternalsNet * (feesPercent / 100)) + laFees;

  const toggleSelection = (id: string) => {
    if (isLocked) return;
    const next = new Set(selectedItems); if (next.has(id)) next.delete(id); else next.add(id); setSelectedItems(next);
  };

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-10">
      <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">{Icon}</div>
        {title}
      </h3>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 font-inter">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 border border-slate-200 transition-all"><ChevronLeft size={22} /></button>
          <div className="flex flex-col"><h2 className="text-xl font-bold text-slate-900 tracking-tight">Externals Assessment</h2><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{development.name}</p></div>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-xl text-right flex items-center gap-4 shadow-lg shadow-slate-200 transition-all">
           <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Total Externals</p>
           <p className="text-md font-bold text-emerald-400">£{formatNumber(totalDayOneRCA, 0)}</p>
        </div>
      </div>

      {/* Anchor Navigation */}
      <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar scroll-smooth sticky top-[73px] z-40 no-print">
        {steps.map((step, idx) => (
          <button key={idx} onClick={() => scrollToSection(idx)} className={`flex-1 min-w-[90px] px-2 py-4 border-b-4 transition-all flex flex-col items-center justify-center gap-1 group ${activeStep === idx ? 'border-emerald-600 bg-emerald-50/20' : 'border-transparent text-slate-500'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${ activeStep === idx ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
               {React.cloneElement(step.icon as React.ReactElement<any>, { size: 13 })}
            </div>
            <span className={`text-[9px] font-semibold uppercase tracking-tight ${activeStep === idx ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</span>
          </button>
        ))}
      </div>

      {/* Delete Selection Overlay */}
      {selectedItems.size > 0 && !isLocked && (
        <div className="fixed bottom-32 left-[calc(144px+50%)] -translate-x-1/2 z-[100] flex justify-center pointer-events-none no-print">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-4 pointer-events-auto border border-slate-700">
             <div className="flex items-center gap-3"><Trash2 size={18} className="text-emerald-400" /><p className="text-sm font-bold uppercase tracking-widest">{selectedItems.size} Selected</p></div>
             <div className="h-8 w-px bg-white/20" />
             <div className="flex gap-3"><button onClick={() => setSelectedItems(new Set())} className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">Clear</button><button onClick={() => setShowDeleteWarning(true)} className="px-8 py-2 bg-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 shadow-lg transition-all">Delete Selected</button></div>
          </div>
        </div>
      )}

      {/* Internal Deletion Warning */}
      {showDeleteWarning && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Provision?</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-normal">
              You are about to permanently remove {selectedItems.size} externals items. This action is irreversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteWarning(false)} className="flex-1 py-3 text-slate-500 font-semibold uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl border border-slate-100 transition-all">Cancel</button>
              <button onClick={performBulkDelete} className="flex-1 py-3 bg-red-600 text-white font-semibold uppercase text-[10px] tracking-widest hover:bg-red-700 rounded-xl shadow-lg transition-all">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar p-12 space-y-24 pb-32">
        {/* Rate Calibration */}
        <section ref={sectionRefs[0]} className="max-w-3xl mx-auto scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-12">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-4 transition-all"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><TrendingUp size={24} /></div>Rate Calibration</h3>
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-8 items-end">
                 <div>
                    <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">UK Region Factor</label>
                    <div className="relative group/select">
                      <select disabled={isLocked} value={assessment.locationName || ''} onChange={e => { const r = e.target.value; updateExternals({ locationName: r, locationFactor: REGIONAL_FACTORS[r] || 1.0 }); }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
                        <option value="" disabled>Select Region...</option>
                        {Object.keys(REGIONAL_FACTORS).sort().map(region => (<option key={region} value={region}>{region}</option>))}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Multiplier (%)</label>
                    <NumberInput disabled={isLocked} value={assessment.locationFactor || 1} step={0.01} suffix="%" paddingClass="py-4 px-3" onChange={val => updateExternals({ locationFactor: val })} />
                 </div>
              </div>
              <div className="grid grid-cols-12 gap-8 items-end pt-6 border-t border-slate-100">
                <div className="col-span-9">
                  <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Spon's Standard Category</label>
                  <div className="relative group/select">
                    <select disabled={isLocked} className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 pr-12 transition-all" onChange={(e) => updateExternals({ categoryLabel: e.target.value })} value={currentCategoryLabel}>
                      {BUILDING_CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1 text-right">Base Rate</label>
                  <div className="relative group/select">
                    <select disabled={isLocked} className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 text-right pr-10 transition-all" value={currentBaseRate} onChange={(e) => updateExternals({ baseRate: parseInt(e.target.value) })}>
                      {getRateOptions(activeCategory).map(r => (<option key={r} value={r}>£{formatNumber(r, 0)}</option>))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Outbuildings */}
        <section ref={sectionRefs[1]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="outbuildings" title="Outbuildings" icon={<Hammer size={24} />} />
            <div className="space-y-6">
              {!isLocked && (<button onClick={() => updateExternals({ items: [...assessment.items, { id: Date.now().toString(), category: 'Outbuildings', description: '', quantity: 0, rate: currentBaseRate, unit: 'm2' }] })} className="text-emerald-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 px-6 py-3 rounded-2xl transition-all border border-emerald-100 shadow-sm mb-6"><Plus size={16} /> Add Structure</button>)}
              <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner mb-8">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/50 border-b border-slate-200">
                    <tr><th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Description</th><th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">GIA (m²)</th><th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-right">Rate (£/m²)</th><th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-right">Sum (£)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outbuildingsItems.map((item) => (
                      <tr key={item.id} onClick={() => toggleSelection(item.id)} className={`group transition-colors cursor-pointer ${selectedItems.has(item.id) ? 'bg-emerald-100/60' : 'hover:bg-white'}`}>
                        <td className="px-6 py-3"><input disabled={isLocked} value={item.description} onClick={e => e.stopPropagation()} onChange={e => { updateExternals({ items: assessment.items.map(x => x.id === item.id ? {...x, description: e.target.value} : x) }); }} className="w-full bg-transparent border-none text-sm font-bold text-slate-900 outline-none transition-all" placeholder="Description..." /></td>
                        <td className="px-6 py-3 w-32" onClick={e => e.stopPropagation()}><NumberInput disabled={isLocked} value={item.quantity} step={5} paddingClass="py-1 px-2 text-center" onChange={v => { updateExternals({ items: assessment.items.map(x => x.id === item.id ? {...x, quantity: v} : x) }); }} /></td>
                        <td className="px-6 py-3 w-40" onClick={e => e.stopPropagation()}><NumberInput disabled={isLocked} value={item.rate} step={50} paddingClass="py-1 px-2 text-right" prefix="£" onChange={v => { updateExternals({ items: assessment.items.map(x => x.id === item.id ? {...x, rate: v} : x) }); }} /></td>
                        <td className="px-6 py-3 text-right"><span className="text-sm font-bold text-slate-900 transition-all">£{formatNumber(item.quantity * item.rate, 2)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-900 text-white p-14 rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800">
                 <div className="grid grid-cols-12 gap-10 items-center relative z-10">
                    <div className="col-span-5 space-y-4">
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3"><span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">Regional Factor</span><span className="text-emerald-400 text-sm font-bold">x{formatNumber(regionalFactorValue, 2)} Applied</span></div>
                       <div className="flex flex-col gap-1"><span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">Base Sum</span><span className="text-slate-300 text-sm font-bold">£{formatNumber(outbuildingsBaseSum, 2)}</span></div>
                    </div>
                    <div className="col-span-7"><div className="bg-white/5 p-14 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center text-center shadow-inner px-10"><p className="text-emerald-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-3 whitespace-nowrap">Net Outbuilding Cost</p><h4 className="text-4xl font-bold tracking-tighter whitespace-nowrap">£{formatNumber(outbuildingsNetTotal, 2)}</h4></div></div>
                 </div>
                 <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-600 rounded-full blur-[100px] opacity-10 -mr-20 -mt-20"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Anomalies */}
        <section ref={sectionRefs[2]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="anomalies" title="Anomalous Items" icon={<LayoutGrid size={24} />} />
            <div className="space-y-6">
              {!isLocked && (<button onClick={() => updateExternals({ items: [...assessment.items, { id: Date.now().toString(), category: 'Anomalies', description: '', quantity: 0, rate: 0, unit: 'Nr' }] })} className="text-emerald-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 px-6 py-3 rounded-2xl transition-all border border-emerald-100 shadow-sm mb-6"><Plus size={16} /> Add Provision</button>)}
              <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner mb-8">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {anomaliesItems.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr onClick={() => toggleSelection(item.id)} className={`group transition-colors cursor-pointer border-t border-slate-100 ${selectedItems.has(item.id) ? 'bg-emerald-100/60' : 'hover:bg-white'}`}>
                          <td className="px-6 pt-4 pb-2"><input disabled={isLocked} value={item.description} onClick={e => e.stopPropagation()} onChange={e => { updateExternals({ items: assessment.items.map(x => x.id === item.id ? {...x, description: e.target.value} : x) }); }} className="w-full bg-transparent border-none text-sm font-bold text-slate-900 outline-none transition-all" placeholder="Item detail..." /></td>
                          <td className="px-6 pt-4 pb-2 text-right"><span className="text-lg font-bold text-slate-900 transition-all">£{formatNumber(item.quantity * item.rate * regionalFactorValue, 2)}</span></td>
                        </tr>
                        <tr onClick={() => toggleSelection(item.id)} className={`${selectedItems.has(item.id) ? 'bg-emerald-100/60' : 'hover:bg-white'}`}>
                          <td colSpan={2} className="px-6 pb-4 pt-1">
                            <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-2"><span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Unit:</span><select value={item.unit} disabled={isLocked} onChange={e => { updateExternals({ items: assessment.items.map(x => x.id === item.id ? {...x, unit: e.target.value} : x) }); }} className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-900 outline-none transition-all">{['m2', 'Lm', 'Nr'].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                              <div className="flex items-center gap-2"><span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Qty:</span><NumberInput disabled={isLocked} value={item.quantity} step={1} paddingClass="py-1 px-2 text-center" className="w-24" onChange={v => { updateExternals({ items: assessment.items.map(x => x.id === item.id ? {...x, quantity: v} : x) }); }} /></div>
                              <div className="flex items-center gap-2"><span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Rate:</span><NumberInput disabled={isLocked} value={item.rate} step={50} paddingClass="py-1 px-2 text-right" className="w-40" prefix="£" onChange={v => { updateExternals({ items: assessment.items.map(x => x.id === item.id ? {...x, rate: v} : x) }); }} /></div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-900 text-white p-14 rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800">
                 <div className="grid grid-cols-12 gap-10 items-center relative z-10">
                    <div className="col-span-5 space-y-4">
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3"><span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">Location Multiplier</span><span className="text-emerald-400 text-sm font-bold">x{formatNumber(regionalFactorValue, 2)} Factor</span></div>
                       <div className="flex flex-col gap-1"><span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">Anomalies Base Sum</span><span className="text-slate-300 text-sm font-bold">£{formatNumber(anomaliesBaseSum, 2)}</span></div>
                    </div>
                    <div className="col-span-7"><div className="text-center bg-white/5 p-14 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center shadow-inner px-10"><p className="text-emerald-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-3 whitespace-nowrap">Adjusted Anomalies Cost</p><h4 className="text-4xl font-bold tracking-tighter whitespace-nowrap">£{formatNumber(anomaliesNetTotal, 2)}</h4></div></div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section ref={sectionRefs[3]} className="max-w-3xl mx-auto scroll-mt-32">
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden transition-all">
             <div className="bg-slate-900 text-white p-12 relative overflow-hidden transition-all"><ShieldCheck className="text-emerald-400 inline mr-4" size={32} /><h3 className="text-2xl font-bold uppercase tracking-[0.3em] inline">Assessment Maturity</h3></div>
             <div className="p-12 space-y-12 transition-all">
                <div className="space-y-6"><h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4 px-1">Valuation Breakdown</h4><div className="space-y-4 font-bold text-sm"><div className="flex justify-between items-center text-slate-600"><span>Outbuildings (Adjusted)</span><span className="text-slate-900">£{formatNumber(outbuildingsNetTotal, 2)}</span></div><div className="flex justify-between items-center text-slate-600"><span>Anomalies (Adjusted)</span><span className="text-slate-900">£{formatNumber(anomaliesNetTotal, 2)}</span></div><div className="flex justify-between items-center font-bold text-slate-900 pt-3 border-t border-slate-100"><span>Total Net Externals</span><span className="text-lg">£{formatNumber(totalExternalsNet, 2)}</span></div></div></div>
                <div className="pt-6">
                   <div className="bg-slate-900 text-white rounded-[3.5rem] p-16 relative overflow-hidden shadow-2xl border border-slate-800 text-center space-y-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-transparent"></div>
                      <p className="text-emerald-400 text-[14px] font-bold uppercase tracking-[0.5em] relative z-10">Externals Reinstatement Value</p>
                      <h2 className="text-8xl font-bold tracking-tighter relative z-10 transition-all">£{formatNumber(totalDayOneRCA, 0)}</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 relative z-10">(Day One Basis)</p>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </div>

      <div className="bg-white border-t border-slate-200 p-8 flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-all">
        <button onClick={onBack} className="px-10 py-4 text-slate-600 font-bold uppercase tracking-widest text-[12px] hover:bg-slate-50 rounded-[2rem] border border-slate-200 transition-all">Project Hub</button>
        <button onClick={handleFinalize} className={`px-12 py-4 text-white font-bold uppercase tracking-[0.1em] text-[12px] rounded-[2rem] transition-all shadow-2xl ${isLocked ? 'bg-amber-600' : 'bg-slate-900'}`}>{isLocked ? 'Unlock' : 'Finalize Externals'}</button>
      </div>
    </div>
  );
};

export default ExternalsWizardPage;