import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Trash2, Plus, Info, MapPin, Hash, X, Ruler, PoundSterling, Hammer, ChevronDown, LayoutGrid, Building2, TrendingUp, ShieldCheck, AlertTriangle, Loader2, Undo2, CheckCircle2, Circle } from 'lucide-react';
import { Development, Block, FloorArea, Anomaly, Adjustment } from '../types';

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

const LEVEL_OPTIONS = [
  '(0) Ground', '(1) First', '(2) Second', '(3) Third', '(4) Fourth', '(5) Fifth', '(6) Sixth', '(7) Seventh', '(8) Eighth', '(9) Ninth', '(10) Tenth',
  '(11) Eleventh', '(12) Twelfth', '(13) Thirteenth', '(14) Fourteenth', '(15) Fifteenth', '(16) Sixteenth', '(17) Seventeenth', '(18) Eighteenth', '(19) Nineteenth', '(20) Twentieth'
];

const BUILDING_CATEGORIES = [
  { label: 'Flats/ Apartments - Low Rise 1-3 Storeys', minRate: 2100, maxRate: 2500 },
  { label: 'Flats/ Apartments - Medium Rise 4-10 Storeys', minRate: 2600, maxRate: 3400 },
  { label: 'Flats/ Apartments - High Rise 11-20 Storeys', minRate: 3500, maxRate: 5000 },
  { label: 'Houses - Terraced', minRate: 1500, maxRate: 3000 },
  { label: 'Houses - Semi Detached', minRate: 1500, maxRate: 3000 },
  { label: 'Houses - Detached', minRate: 1500, maxRate: 3000 },
  { label: 'Commercial Unit', minRate: 1000, maxRate: 5000 },
];

const MASTER_ANOMALIES_KEYS = [
  'Fire Fighting Systems', 'Comms & Security Systems', 'Lift', 'Solar PV', 'Dry Risers', 'Door entry', 'Smoke Clearance'
];

const steps = [
  { id: 'overview', title: 'Overview', icon: <Info size={13} /> },
  { id: 'rates', title: 'Rates & Area', icon: <TrendingUp size={13} /> },
  { id: 'breakdown', title: 'Breakdown', icon: <PoundSterling size={13} /> },
  { id: 'adjustments', title: 'Adjustments', icon: <Hash size={13} /> },
  { id: 'demolition', title: 'Demolition', icon: <Hammer size={13} /> },
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

const ADJUSTMENT_TYPES = ['Access', 'Party Walls', 'Storey Height', 'Listed Building', 'Other'];
const ANOMALY_UNITS = ['m2', 'Lm', 'Nr'];
const DROPDOWN_INCREMENTS = Array.from({ length: 11 }, (_, i) => i * 5); // 0 to 50 in 5s

const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === 0) return decimals === 0 ? '0' : '0.00';
  return num.toLocaleString('en-GB', { 
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals 
  });
};

const roundUpToNearestThousand = (num: number): number => {
  return Math.ceil(num / 1000) * 1000;
};

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  step?: number;
  prefix?: string;
  suffix?: string;
  paddingClass?: string;
  allowDecimals?: boolean;
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
  paddingClass = 'py-2.5 px-3',
  allowDecimals = true,
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
    let raw = e.target.value.replace(/,/g, '');
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
    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
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
    <div className={`flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${className} ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
      {prefix && <span className="pl-3 text-slate-400 font-bold text-sm">{prefix}</span>}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled}
        className={`w-full bg-transparent ${paddingClass} text-sm font-bold text-slate-900 outline-none border-none disabled:cursor-not-allowed`}
      />
      {suffix && <span className="pr-3 text-slate-400 font-bold text-sm">{suffix}</span>}
      <div className="flex flex-col border-l border-slate-100 shrink-0">
        <button tabIndex={-1} disabled={disabled} onClick={() => adjust(1)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors border-b border-slate-100 disabled:opacity-30">
          <ChevronDown className="rotate-180" size={10} />
        </button>
        <button tabIndex={-1} disabled={disabled} onClick={() => adjust(-1)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-30">
          <ChevronDown size={10} />
        </button>
      </div>
    </div>
  );
};

const WizardPage: React.FC<{
  development: Development;
  activeBlock: Block | null;
  isSaving: boolean;
  onBack: () => void;
  onUpdateDevelopment: (dev: Development) => void;
  onUndo: () => void;
  canUndo: boolean;
  onExport: () => void;
  onSelectBlock?: (dev: Development, block: Block) => void; 
}> = ({ 
  development, 
  activeBlock, 
  isSaving,
  onBack, 
  onUpdateDevelopment,
  onUndo,
  canUndo,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'floor' | 'anomaly' | 'adjustment' | 'bulk', ids?: string[], id?: string } | null>(null);

  const [selectedFloors, setSelectedFloors] = useState<Set<string>>(new Set());
  const [selectedAdjustments, setSelectedAdjustments] = useState<Set<string>>(new Set());
  const [selectedAnomalies, setSelectedAnomalies] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = [
    useRef<HTMLDivElement>(null), // Overview
    useRef<HTMLDivElement>(null), // Rates & Area
    useRef<HTMLDivElement>(null), // Breakdown
    useRef<HTMLDivElement>(null), // Adjustments
    useRef<HTMLDivElement>(null), // Demolition
    useRef<HTMLDivElement>(null), // Anomalies
    useRef<HTMLDivElement>(null)  // Summary
  ];

  const [block, setBlock] = useState<Block | null>(activeBlock);

  useEffect(() => {
    if (activeBlock) setBlock(activeBlock);
  }, [activeBlock?.id]);

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

  const updateBlock = (updates: Partial<Block>) => {
    if (!block || block.status === 'Completed' && !updates.status) return;
    const newBlock = { ...block, ...updates };
    setBlock(newBlock);
    const newBlocks = (development.blocks || []).map(b => b.id === block.id ? newBlock : b);
    onUpdateDevelopment({ ...development, blocks: newBlocks });
  };

  const updateDevelopmentDetails = (updates: Partial<Development>) => {
    if (block?.status === 'Completed') return;
    onUpdateDevelopment({ ...development, ...updates });
  };

  const handleLocationChange = (region: string) => {
    if (block?.status === 'Completed') return;
    const factor = REGIONAL_FACTORS[region] || block?.buildingRate?.locationFactor || 1.0;
    updateBlock({ 
      buildingRate: { 
        ...(block?.buildingRate || { date: '', ratesPerFloor: {}, uniclassRate: '' }), 
        locationName: region,
        locationFactor: factor
      } 
    });
  };

  const toggleSectionCompletion = (sectionId: string) => {
    if (!block) return;
    const currentCompleted = block.completedSections || [];
    const isCompleted = currentCompleted.includes(sectionId);
    const nextCompleted = isCompleted 
      ? currentCompleted.filter(id => id !== sectionId)
      : [...currentCompleted, sectionId];
    updateBlock({ completedSections: nextCompleted });
  };

  const toggleSelection = (id: string, type: 'floor' | 'adj' | 'anom') => {
    if (block?.status === 'Completed') return;
    if (type === 'floor') {
      const next = new Set(selectedFloors);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelectedFloors(next);
    } else if (type === 'adj') {
      const next = new Set(selectedAdjustments);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelectedAdjustments(next);
    } else if (type === 'anom') {
      const next = new Set(selectedAnomalies);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelectedAnomalies(next);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget || !block || block.status === 'Completed') return;
    if (deleteTarget.type === 'bulk') {
      updateBlock({
        floors: block.floors.filter(f => !selectedFloors.has(f.id)),
        adjustments: block.adjustments.filter(a => !selectedAdjustments.has(a.id)),
        anomalies: block.anomalies.filter(a => !selectedAnomalies.has(a.id))
      });
      setSelectedFloors(new Set());
      setSelectedAdjustments(new Set());
      setSelectedAnomalies(new Set());
    } else if (deleteTarget.type === 'floor') {
      updateBlock({ floors: block.floors.filter(fl => fl.id !== deleteTarget.id) });
      const nextFloors = new Set(selectedFloors); nextFloors.delete(deleteTarget.id!); setSelectedFloors(nextFloors);
    } else if (deleteTarget.type === 'anomaly') {
      updateBlock({ anomalies: block.anomalies.filter(x => x.id !== deleteTarget.id) });
      const nextAnoms = new Set(selectedAnomalies); nextAnoms.delete(deleteTarget.id!); setSelectedAnomalies(nextAnoms);
    } else if (deleteTarget.type === 'adjustment') {
      updateBlock({ adjustments: block.adjustments.filter(x => x.id !== deleteTarget.id) });
      const nextAdjs = new Set(selectedAdjustments); nextAdjs.delete(deleteTarget.id!); setSelectedAdjustments(nextAdjs);
    }
    setDeleteTarget(null);
  };

  if (!block) return null;

  const isLocked = block.status === 'Completed';

  const currentGlobalBaseRate = (block.buildingRate.ratesPerFloor && Object.values(block.buildingRate.ratesPerFloor).length > 0 
    ? (Object.values(block.buildingRate.ratesPerFloor) as number[])[0] 
    : 2600);

  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState(
    BUILDING_CATEGORIES.find(c => currentGlobalBaseRate >= c.minRate && currentGlobalBaseRate <= c.maxRate)?.label || BUILDING_CATEGORIES[0].label
  );

  const activeCategory = BUILDING_CATEGORIES.find(c => c.label === selectedCategoryLabel) || BUILDING_CATEGORIES[0];
  const totalGIA = (block.floors || []).reduce((acc, f) => acc + (f.gia || 0), 0);
  
  const buildingCostExact = (block.floors || []).reduce((acc, f) => {
    const baseRate = (block.buildingRate?.ratesPerFloor?.[f.level] as number) || currentGlobalBaseRate;
    const adjustedRate = baseRate * (block.buildingRate?.locationFactor || 1);
    return acc + (adjustedRate * (f.gia || 0));
  }, 0);

  const anomaliesRawTotal = (block.anomalies || []).reduce((acc, a) => acc + (a.quantity * a.rate), 0);
  const anomaliesAdjustedTotalExact = anomaliesRawTotal * (block.buildingRate?.locationFactor || 1);
  const upliftsPercent = (block.adjustments || []).reduce((acc, a) => acc + (a.uplift || 0), 0);
  const netAdjustmentAmountExact = buildingCostExact * (upliftsPercent / 100);
  const revisedNetBuildingCostExact = buildingCostExact + netAdjustmentAmountExact;
  const demolitionCostExact = totalGIA * (block.demolitionRate || 0);
  
  const totalNetRebuildingIncludingDemolitionExact = revisedNetBuildingCostExact + anomaliesAdjustedTotalExact + demolitionCostExact;
  
  const professionalFeeAmountExact = totalNetRebuildingIncludingDemolitionExact * ((block.fees?.professionalPercent || 0) / 100);
  const localAuthorityFeesExact = block.fees?.localAuthority || 0;
  const totalFeesExact = professionalFeeAmountExact + localAuthorityFeesExact;
  
  const totalReinstatementCostExact = totalNetRebuildingIncludingDemolitionExact + totalFeesExact;
  const totalReinstatementCostRounded = roundUpToNearestThousand(totalReinstatementCostExact);

  const handleAddFloor = () => {
    if (isLocked) return;
    const nextIdx = block.floors.length;
    const nextLvl = LEVEL_OPTIONS[nextIdx] || `Level ${nextIdx}`;
    const nf = [...block.floors, { id: Date.now().toString(), description: nextLvl, level: nextLvl, gia: 0, gfa: 0 }];
    const nextRates = { ...block.buildingRate.ratesPerFloor, [nextLvl]: currentGlobalBaseRate };
    updateBlock({ floors: nf, buildingRate: { ...block.buildingRate, ratesPerFloor: nextRates } });
  };

  const handleFinalize = () => {
    const isNowCompleted = block.status !== 'Completed';
    const nextStatus = isNowCompleted ? 'Completed' : 'Draft';
    
    // If finalizing, auto-complete all sections
    const nextCompleted = isNowCompleted 
      ? steps.map(s => s.id)
      : block.completedSections;
      
    updateBlock({ 
      status: nextStatus,
      completedSections: nextCompleted
    });
    
    // Stay on page if unlocking, otherwise go back
    if (isNowCompleted) {
      onBack();
    }
  };

  const totalSelectedCount = selectedFloors.size + selectedAdjustments.size + selectedAnomalies.size;

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: React.ReactNode }) => {
    const isCompleted = (block.completedSections || []).includes(id);
    return (
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
          <div className={`p-3 rounded-2xl shadow-inner transition-colors ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            {Icon}
          </div>
          {title}
        </h3>
        <button 
          onClick={() => toggleSectionCompletion(id)}
          disabled={isLocked}
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
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{block.name}</h2>
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
             {isSaving ? <><Loader2 size={12} className="text-blue-500 animate-spin" /><span className="text-[12px] font-black uppercase text-blue-500 tracking-wider whitespace-nowrap">Syncing</span></> : <><div className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span className="text-[12px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">Saved</span></>}
          </div>
          <button disabled={!canUndo || isLocked} onClick={onUndo} className={`p-2 rounded-xl border transition-all ${canUndo && !isLocked ? 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-600' : 'text-slate-300 border-slate-100'}`}><Undo2 size={18} /></button>
        </div>
      </div>

      {/* Anchor Navigation */}
      <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar scroll-smooth sticky top-[73px] z-40">
        {steps.map((step, idx) => {
          const isComp = (block.completedSections || []).includes(step.id);
          return (
            <button 
              key={idx} 
              onClick={() => scrollToSection(idx)} 
              className={`flex-1 min-w-[90px] px-2 py-4 border-b-4 transition-all flex flex-col items-center justify-center gap-1 group ${activeStep === idx ? 'border-blue-600 bg-blue-50/20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                isComp ? 'bg-green-600 text-white shadow-lg shadow-green-200' :
                activeStep === idx ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
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
                <Trash2 size={18} className="text-red-400" />
                <p className="text-sm font-black uppercase tracking-widest whitespace-nowrap">{totalSelectedCount} Selected</p>
             </div>
             <div className="h-8 w-px bg-white/20" />
             <div className="flex gap-3">
                <button onClick={() => { setSelectedFloors(new Set()); setSelectedAdjustments(new Set()); setSelectedAnomalies(new Set()); }} className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors whitespace-nowrap">Clear</button>
                <button onClick={() => setDeleteTarget({ type: 'bulk' })} className="px-8 py-2 bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-900/40 transition-all whitespace-nowrap">Delete Selected</button>
             </div>
          </div>
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar p-6 md:p-12 space-y-24 pb-32">
        
        {/* Section 1: Overview */}
        <section ref={sectionRefs[0]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="overview" title="Assessment Overview" icon={<Info size={24} />} />
            
            <div className="space-y-10">
              <div className="space-y-6 p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 whitespace-nowrap"><Building2 size={14} /> Development Data</h4>
                
                <div className="grid grid-cols-12 gap-6 items-end">
                   <div className="col-span-10">
                      <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 px-1 whitespace-nowrap">Development Name</label>
                      <input disabled={isLocked} type="text" value={development.name} onChange={e => updateDevelopmentDetails({ name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50" />
                   </div>
                   <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 px-1 whitespace-nowrap">Units (Nr)</label>
                      <NumberInput disabled={isLocked} allowDecimals={false} value={block.numberOfUnits || 0} onChange={v => updateBlock({ numberOfUnits: Math.min(v, 99) })} className="w-full" maxDigits={2} paddingClass="py-3.5 px-3" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 px-1 whitespace-nowrap">Case Number</label>
                    <input disabled={isLocked} type="text" value={development.caseNumber || ''} onChange={e => updateDevelopmentDetails({ caseNumber: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 px-1 whitespace-nowrap">Property Ref</label>
                    <input disabled={isLocked} type="text" value={development.propertyReference || ''} onChange={e => updateDevelopmentDetails({ propertyReference: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-8 border border-transparent">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1 whitespace-nowrap"><MapPin size={14} /> Block Location</h4>
                
                <div>
                   <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 px-1 whitespace-nowrap">Block Name</label>
                   <input disabled={isLocked} type="text" value={block.name} onChange={e => updateBlock({ name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 px-1 whitespace-nowrap">Block Address</label>
                  <input disabled={isLocked} type="text" value={block.addressLine || ''} onChange={e => updateBlock({ addressLine: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50" placeholder="Street Address" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 px-1 whitespace-nowrap">Town/City</label>
                    <input disabled={isLocked} type="text" value={block.town || ''} onChange={e => updateBlock({ town: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50" placeholder="Town" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 px-1 whitespace-nowrap">Postcode</label>
                    <input disabled={isLocked} type="text" value={block.postcode || ''} onChange={e => updateBlock({ postcode: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50" placeholder="Postcode" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Building Rate & Area */}
        <section ref={sectionRefs[1]} className="max-w-3xl mx-auto scroll-mt-32 space-y-12">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-12">
            <SectionHeader id="rates" title="Building Rate Configuration" icon={<TrendingUp size={24} />} />

            <div className="space-y-10">
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1 whitespace-nowrap">Cost Methodology Source</label>
                <input disabled={isLocked} value={block.buildingRate?.uniclassRate} onChange={e => updateBlock({ buildingRate: { ...block.buildingRate, uniclassRate: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none disabled:opacity-50" placeholder="e.g. BCIS Standard Rates 2025" />
              </div>

              <div className="grid grid-cols-2 gap-8 items-end">
                 <div>
                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1 whitespace-nowrap">UK Region Factor</label>
                    <div className="relative group/select">
                      <select 
                        disabled={isLocked}
                        value={block.buildingRate?.locationName || ''} 
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
                    <NumberInput disabled={isLocked} value={block.buildingRate?.locationFactor || 1} step={0.01} suffix="%" paddingClass="py-4 px-3" onChange={val => updateBlock({ buildingRate: { ...block.buildingRate, locationFactor: val } })} />
                 </div>
              </div>

              <div className="grid grid-cols-12 gap-8 items-end">
                <div className="col-span-9">
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1 whitespace-nowrap">Building Category</label>
                  <div className="relative group/select">
                    <select 
                      disabled={isLocked}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 transition-all pr-12 disabled:opacity-50"
                      onChange={(e) => setSelectedCategoryLabel(e.target.value)}
                      value={selectedCategoryLabel}
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
                      value={currentGlobalBaseRate}
                      onChange={(e) => {
                        const newRate = parseInt(e.target.value);
                        const nextRates = { ...block.buildingRate.ratesPerFloor };
                        block.floors.forEach(f => { nextRates[f.level] = newRate; });
                        updateBlock({ buildingRate: { ...block.buildingRate, ratesPerFloor: nextRates } });
                      }}
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

            <div className="pt-12 border-t border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 px-1 whitespace-nowrap">
                  <Ruler size={22} className="text-blue-500" /> Site GIA Details
                </h4>
                <button disabled={isLocked} onClick={handleAddFloor} className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-6 py-3 rounded-2xl transition-all border border-blue-100 whitespace-nowrap disabled:opacity-50">
                  <Plus size={16} /> Add Level
                </button>
              </div>
              <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center whitespace-nowrap">Level Identification</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center whitespace-nowrap">GIA (m²)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {block.floors.map((f, i) => {
                      const isSelected = selectedFloors.has(f.id);
                      return (
                        <tr key={f.id} onClick={() => toggleSelection(f.id, 'floor')} className={`group transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-white'} ${isLocked ? 'pointer-events-none' : ''}`}>
                          <td className="px-8 py-4">
                            <div className="relative group/select max-w-full" onClick={e => e.stopPropagation()}>
                              <select 
                                disabled={isLocked}
                                value={f.level} 
                                onChange={e => {
                                  const nf = [...block.floors]; nf[i].level = e.target.value; updateBlock({ floors: nf });
                                }} 
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                              >
                                {LEVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </div>
                          </td>
                          <td className="px-8 py-4 w-56 text-right" onClick={e => e.stopPropagation()}>
                            <NumberInput disabled={isLocked} value={f.gia} paddingClass="py-2.5 px-4" maxDigits={5} onChange={val => {
                              const nf = [...block.floors]; nf[i].gia = val; updateBlock({ floors: nf });
                            }} className="text-right" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-10 rounded-[3rem] relative overflow-hidden shadow-2xl border border-slate-800">
               <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-20 -mr-40 -mt-40"></div>
               <div className="relative z-10 space-y-10">
                  <div className="grid grid-cols-3 gap-y-8 gap-x-12">
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                          <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">UK Region Factor</span>
                          <span className="text-blue-400 text-sm font-black whitespace-nowrap">{block.buildingRate.locationName || 'Standard'}</span>
                       </div>
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                          <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Factor Multiplier</span>
                          <span className="text-slate-300 text-sm font-black whitespace-nowrap">x{formatNumber(block.buildingRate.locationFactor, 2)}</span>
                       </div>
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                          <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Building Category</span>
                          <span className="text-slate-300 text-[10px] font-black italic truncate">{selectedCategoryLabel}</span>
                       </div>
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                          <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Base Rate</span>
                          <span className="text-slate-300 text-sm font-black whitespace-nowrap">£{formatNumber(currentGlobalBaseRate, 0)}/m²</span>
                       </div>
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                          <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Total Levels</span>
                          <span className="text-slate-300 text-sm font-black whitespace-nowrap">{block.floors.length} Levels</span>
                       </div>
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                          <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Total GIA</span>
                          <span className="text-slate-300 text-sm font-black whitespace-nowrap">{formatNumber(totalGIA, 0)} m²</span>
                       </div>
                  </div>
                  <div className="text-center pt-4 border-t border-white/10">
                    <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1 whitespace-nowrap">Effective Cost Rate</p>
                    <h4 className="text-5xl font-black tracking-tighter leading-tight whitespace-nowrap">£{formatNumber(currentGlobalBaseRate * (block.buildingRate.locationFactor || 1), 2)}/m²</h4>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Section 3: Rebuilding Breakdown */}
        <section ref={sectionRefs[2]} className="max-w-3xl mx-auto scroll-mt-32">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="breakdown" title="Rebuilding Breakdown" icon={<PoundSterling size={24} />} />
            <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-white/5 border-b border-white/10">
                       <th className="px-8 py-5 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center whitespace-nowrap">Level</th>
                       <th className="px-8 py-5 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center whitespace-nowrap">Base (£/m²)</th>
                       <th className="px-8 py-5 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center whitespace-nowrap">Area (m²)</th>
                       <th className="px-8 py-5 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center whitespace-nowrap">Sub-total</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {block.floors.map((f) => {
                        const base = (block.buildingRate.ratesPerFloor[f.level] as number) || currentGlobalBaseRate;
                        const factor = block.buildingRate.locationFactor || 1;
                        const adj = base * factor;
                        return (
                          <tr key={f.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-8 py-5 font-black text-white text-sm text-center whitespace-nowrap">{f.level}</td>
                            <td className="px-8 py-5 text-center text-slate-400 font-bold text-xs whitespace-nowrap">£{formatNumber(base, 0)}</td>
                            <td className="px-8 py-5 text-center text-white font-bold text-sm whitespace-nowrap">{formatNumber(f.gia, 2)}</td>
                            <td className="px-8 py-5 text-center font-black text-blue-400 text-sm whitespace-nowrap">£{formatNumber(adj * f.gia, 2)}</td>
                          </tr>
                        );
                     })}
                   </tbody>
                   <tfoot>
                     <tr className="bg-white/10">
                        <td colSpan={3} className="px-8 py-6 text-right text-[11px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">Aggregate Net Reinstatement</td>
                        <td className="px-8 py-6 text-center font-black text-blue-400 text-2xl tracking-tighter whitespace-nowrap">£{formatNumber(buildingCostExact, 2)}</td>
                     </tr>
                   </tfoot>
                 </table>
            </div>
          </div>
        </section>

        {/* Section 4: Adjustments */}
        <section ref={sectionRefs[3]} className="max-w-3xl mx-auto scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="adjustments" title="Uplifts & Adjustments" icon={<Hash size={24} />} />
            <div className="space-y-6">
               {!isLocked && (
                 <button onClick={() => updateBlock({ adjustments: [...block.adjustments, { id: Date.now().toString(), type: 'Other', reason: '', uplift: 0 }] })} className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-6 py-3 rounded-2xl transition-all border border-blue-100 shadow-sm whitespace-nowrap mb-6">
                   <Plus size={16} /> Add Adjustment
                 </button>
               )}
               <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                  <div className="col-span-3 text-center whitespace-nowrap">Type</div>
                  <div className="col-span-6 text-center whitespace-nowrap">Reasoning</div>
                  <div className="col-span-3 text-center whitespace-nowrap">Uplift (%)</div>
               </div>
               {block.adjustments.map((adj, i) => {
                 const isSelected = selectedAdjustments.has(adj.id);
                 return (
                   <div key={adj.id} onClick={() => !isLocked && toggleSelection(adj.id, 'adj')} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-blue-200'} ${isLocked ? 'cursor-default opacity-80' : ''}`}>
                      <div className="col-span-3" onClick={e => e.stopPropagation()}>
                         <select disabled={isLocked} value={adj.type} onChange={e => { const na = [...block.adjustments]; na[i].type = e.target.value; updateBlock({ adjustments: na }); }} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-2 focus:ring-blue-600/20 whitespace-nowrap disabled:opacity-50">
                            {ADJUSTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                      </div>
                      <div className="col-span-6" onClick={e => e.stopPropagation()}>
                         <input disabled={isLocked} value={adj.reason} onChange={e => { const na = [...block.adjustments]; na[i].reason = e.target.value; updateBlock({ adjustments: na }); }} placeholder="Reasoning..." className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50" />
                      </div>
                      <div className="col-span-3 flex justify-end" onClick={e => e.stopPropagation()}>
                         <NumberInput disabled={isLocked} value={adj.uplift} suffix="%" paddingClass="py-2 px-3" className="w-[140px]" onChange={v => { const na = [...block.adjustments]; na[i].uplift = v; updateBlock({ adjustments: na }); }} />
                      </div>
                   </div>
                 );
               })}
               <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-end gap-3 text-right">
                  <div className="flex flex-col gap-1.5 w-full max-w-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Total Percentage Adjustment:</span>
                      <span className="font-black text-slate-900 whitespace-nowrap">{formatNumber(upliftsPercent, 1)}%</span>
                    </div>
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Revised Net Adjustment:</span>
                      <span className="font-black text-slate-900 whitespace-nowrap">£{formatNumber(netAdjustmentAmountExact, 2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full max-w-md bg-slate-900 text-white p-6 rounded-3xl mt-2 shadow-xl border border-slate-800 whitespace-nowrap">
                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 mr-4 whitespace-nowrap">Revised Net Building Cost:</span>
                    <span className="font-black text-xl whitespace-nowrap">£{formatNumber(revisedNetBuildingCostExact, 2)}</span>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Section 5: Demolition */}
        <section ref={sectionRefs[4]} className="max-w-3xl mx-auto scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
             <SectionHeader id="demolition" title="Demolition & Site Clearance" icon={<Hammer size={24} />} />
             <div className="grid grid-cols-12 gap-8 items-stretch">
                <div className="col-span-5 flex flex-col justify-center gap-4">
                   <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1 px-1 whitespace-nowrap">Demolition Rate (£/m² GIA)</label>
                   <NumberInput disabled={isLocked} value={block.demolitionRate} prefix="£" className="w-full" paddingClass="py-4 px-3" onChange={v => updateBlock({ demolitionRate: v })} />
                </div>
                <div className="col-span-7 bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl"></div>
                   
                   <div className="z-10 text-center mb-2">
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 whitespace-nowrap">Total Estimated Demolition</p>
                      <p className="text-4xl font-black tracking-tighter whitespace-nowrap">£{formatNumber(demolitionCostExact, 2)}</p>
                   </div>
                   
                   <div className="z-10 flex items-center gap-4 pt-3 border-t border-white/5 w-full justify-center opacity-60">
                      <div className="flex flex-col items-center">
                         <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 whitespace-nowrap">Assessed GIA</p>
                         <p className="text-xs font-black text-white whitespace-nowrap">{formatNumber(totalGIA, 0)} m²</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Section 6: Anomalies */}
        <section ref={sectionRefs[5]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="anomalies" title="Anomalies Assessment" icon={<LayoutGrid size={24} />} />
            
            <div className="space-y-6">
              {!isLocked && (
                <button onClick={() => updateBlock({ anomalies: [...block.anomalies, { id: Date.now().toString(), item: '', quantity: 0, rate: 0, unit: 'Nr' }] })} className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-6 py-3 rounded-2xl transition-all border border-blue-100 shadow-sm whitespace-nowrap mb-6">
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
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Total (£)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {block.anomalies.map((anom, i) => {
                      const isSelected = selectedAnomalies.has(anom.id);
                      // Check if master item keyword exists to lock unit
                      const isMasterItem = MASTER_ANOMALIES_KEYS.some(k => anom.item.toLowerCase().includes(k.toLowerCase()));
                      return (
                        <tr key={anom.id} onClick={() => !isLocked && toggleSelection(anom.id, 'anom')} className={`group transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-white'} ${isLocked ? 'cursor-default' : ''}`}>
                          <td className="px-6 py-3">
                            <input 
                              disabled={isLocked}
                              value={anom.item} 
                              title={anom.item}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { const na = [...block.anomalies]; na[i].item = e.target.value; updateBlock({ anomalies: na }); }}
                              className="w-full bg-transparent border-none text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300 truncate disabled:opacity-50" 
                              placeholder="Describe item..." 
                            />
                          </td>
                          <td className="px-6 py-3 w-24">
                            <select 
                              value={anom.unit} 
                              disabled={isMasterItem || isLocked}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { const na = [...block.anomalies]; na[i].unit = e.target.value; updateBlock({ anomalies: na }); }} 
                              className={`w-full bg-white border border-slate-100 rounded-lg py-1 px-1 text-[10px] font-black text-slate-900 appearance-none outline-none text-center whitespace-nowrap ${(isMasterItem || isLocked) ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                            >
                              {ANOMALY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-3 w-40" onClick={e => e.stopPropagation()}>
                            <NumberInput disabled={isLocked} value={anom.quantity} allowDecimals={anom.unit !== 'Nr'} className="text-center" paddingClass="py-1 px-2" maxDigits={5} onChange={v => { const na = [...block.anomalies]; na[i].quantity = v; updateBlock({ anomalies: na }); }} />
                          </td>
                          <td className="px-6 py-3 w-40 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-900 whitespace-nowrap">£{formatNumber(anom.quantity * anom.rate, 2)}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Rate: £{formatNumber(anom.rate, 2)}</span>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {block.anomalies.length > 0 && (
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800">
                   <div className="relative z-10 grid grid-cols-2 gap-12 items-center">
                      <div className="space-y-4">
                         <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">UK Region Factor</span>
                            <span className="text-blue-400 text-sm font-black whitespace-nowrap">{block.buildingRate.locationName || 'Standard'}</span>
                         </div>
                         <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Regional Multiplier</span>
                            <span className="text-slate-300 text-sm font-black whitespace-nowrap">x{formatNumber(block.buildingRate.locationFactor || 1.0, 2)}</span>
                         </div>
                         <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Total Anomalies (Base)</span>
                            <span className="text-slate-300 text-sm font-black whitespace-nowrap">£{formatNumber(anomaliesRawTotal, 2)}</span>
                         </div>
                      </div>
                      <div className="text-center bg-white/5 p-8 rounded-3xl border border-white/10">
                         <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1 whitespace-nowrap">Effective Adjusted Cost</p>
                         <h4 className="text-4xl font-black tracking-tighter whitespace-nowrap">£{formatNumber(anomaliesAdjustedTotalExact, 2)}</h4>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 7: Final Summary */}
        <section ref={sectionRefs[6]} className="max-w-3xl mx-auto scroll-mt-32">
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
             <div className="bg-slate-900 text-white p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5"><ShieldCheck size={140} /></div>
                <h3 className="text-2xl font-black uppercase tracking-[0.3em] flex items-center gap-4 relative z-10 whitespace-nowrap">
                   <ShieldCheck className="text-blue-400" size={32} /> Block Summary
                </h3>
             </div>
             
             <div className="p-12 space-y-12">
                <div className="space-y-6">
                   <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4 px-1 whitespace-nowrap">Valuation Breakdown</h4>
                   
                   <div className="space-y-4 font-bold">
                      <div className="flex justify-between items-center text-sm text-slate-600">
                         <span className="whitespace-nowrap">Net Rebuilding Cost (excluding Adjustments)</span>
                         <span className="text-slate-900 whitespace-nowrap">£{formatNumber(buildingCostExact, 2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-600">
                         <span className="whitespace-nowrap">Specific Uplifts & Adjustments (+{upliftsPercent}%)</span>
                         <span className="text-slate-900 whitespace-nowrap">£{formatNumber(netAdjustmentAmountExact, 2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-600">
                         <span className="whitespace-nowrap">Estimated Demolition & Site Clearance</span>
                         <span className="text-slate-900 whitespace-nowrap">£{formatNumber(demolitionCostExact, 2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-600">
                         <span className="whitespace-nowrap">Anomalous Items (Adjusted)</span>
                         <span className="text-slate-900 whitespace-nowrap">£{formatNumber(anomaliesAdjustedTotalExact, 2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-3 border-t border-slate-100">
                         <span className="whitespace-nowrap">Total Net Rebuilding Cost, including Demolition</span>
                         <span className="text-lg whitespace-nowrap">£{formatNumber(totalNetRebuildingIncludingDemolitionExact, 2)}</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4 px-1 whitespace-nowrap">Fees & Statutory Costs</h4>
                   
                   <div className="space-y-6">
                      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-slate-900 whitespace-nowrap">Professional Fees</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Value: £{formatNumber(professionalFeeAmountExact, 2)}</span>
                         </div>
                         <div className="w-32">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Percentage %</p>
                             <select 
                                disabled={isLocked}
                                value={block.fees?.professionalPercent || 0} 
                                onChange={e => updateBlock({ fees: { ...block.fees, professionalPercent: parseInt(e.target.value) } })}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-black text-slate-900 outline-none appearance-none whitespace-nowrap disabled:opacity-50"
                             >
                                {DROPDOWN_INCREMENTS.map(opt => <option key={opt} value={opt}>{opt}%</option>)}
                             </select>
                         </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-slate-900 whitespace-nowrap">Statutory & Local Authority Fees</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Administrative Provision</span>
                         </div>
                         <div className="w-40">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Fee Value (£)</p>
                             <NumberInput disabled={isLocked} value={block.fees?.localAuthority || 0} prefix="£" paddingClass="py-2 px-3" onChange={v => updateBlock({ fees: { ...block.fees, localAuthority: v } })} />
                         </div>
                      </div>

                      <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-3 border-t border-slate-100">
                         <span className="whitespace-nowrap">Total Fees</span>
                         <span className="text-lg whitespace-nowrap">£{formatNumber(totalFeesExact, 2)}</span>
                      </div>
                   </div>
                </div>

                <div className="pt-6">
                   <div className="flex justify-between items-center text-sm font-black text-blue-600 uppercase tracking-widest mb-10">
                      <span className="whitespace-nowrap">Total Reinstatement Cost (Exact)</span>
                      <span className="text-2xl whitespace-nowrap">£{formatNumber(totalReinstatementCostExact, 2)}</span>
                   </div>

                   <div className="bg-slate-900 text-white rounded-[3.5rem] p-16 relative overflow-hidden shadow-2xl border border-slate-800 text-center space-y-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent"></div>
                      <p className="text-blue-400 text-[14px] font-black uppercase tracking-[0.5em] relative z-10 whitespace-nowrap">Day One Reinstatement Basis</p>
                      <h2 className="text-8xl font-black tracking-tighter relative z-10 whitespace-nowrap">£{formatNumber(totalReinstatementCostRounded, 0)}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 relative z-10 whitespace-nowrap">(Rounded to nearest £1,000)</p>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-slate-200 p-8 flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={onBack} className="flex items-center gap-2 px-10 py-4 text-slate-600 font-black uppercase tracking-widest text-[12px] hover:bg-slate-50 rounded-[2rem] transition-all border border-slate-200 shadow-sm whitespace-nowrap">Project Hub</button>
        <button onClick={handleFinalize} className={`flex items-center gap-3 px-12 py-4 text-white font-black uppercase tracking-[0.1em] text-[12px] rounded-[2rem] transition-all shadow-2xl whitespace-nowrap ${block.status === 'Completed' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-300' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'}`}>
           {block.status === 'Completed' ? 'Unlock for Editing' : 'Finalize Block'}
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
              <button onClick={() => { confirmDelete(); if (deleteTarget.type === 'bulk') { setSelectedFloors(new Set()); setSelectedAdjustments(new Set()); setSelectedAnomalies(new Set()); } }} className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all whitespace-nowrap">Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WizardPage;