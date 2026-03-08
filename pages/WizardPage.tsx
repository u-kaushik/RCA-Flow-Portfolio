import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Trash2, Plus, Info, MapPin, Hash, X, Ruler, PoundSterling, Hammer, ChevronDown, LayoutGrid, Building2, TrendingUp, ShieldCheck, AlertTriangle, Loader2, Undo2, CheckCircle2, Circle, FileDown, Database } from 'lucide-react';
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

const BUILDING_CATEGORIES = [
  { label: 'Flats/ Apartments - Low Rise 1-3 Storeys', minRate: 2100, maxRate: 2500 },
  { label: 'Flats/ Apartments - Medium Rise 4-10 Storeys', minRate: 2600, maxRate: 3400 },
  { label: 'Flats/ Apartments - High Rise 11-20 Storeys', minRate: 3500, maxRate: 5000 },
  { label: 'Houses - Terraced', minRate: 1500, maxRate: 3000 },
  { label: 'Houses - Semi Detached', minRate: 1500, maxRate: 3000 },
  { label: 'Houses - Detached', minRate: 1500, maxRate: 3000 },
  { label: 'Commercial Unit', minRate: 1000, maxRate: 5000 },
];

const LEVEL_OPTIONS = [
  '(0) Ground', '(1) First', '(2) Second', '(3) Third', '(4) Fourth', '(5) Fifth', '(6) Sixth', '(7) Seventh', '(8) Eighth', '(9) Ninth', '(10) Tenth',
  '(11) Eleventh', '(12) Twelfth', '(13) Thirteenth', '(14) Fourteenth', '(15) Fifteenth', '(16) Sixteenth', '(17) Seventeenth', '(18) Eighteenth', '(19) Nineteenth', '(20) Twentieth'
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
    }
    setLocalValue(raw);
    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (raw === '') {
      onChange(0);
    }
  };

  const adjust = (e: React.MouseEvent, dir: 1 | -1) => {
    e.stopPropagation();
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
        onBlur={() => setLocalValue(formatNumber(value, allowDecimals ? 2 : 0))}
        onFocus={(e) => { e.target.select(); }}
        disabled={disabled}
        className={`w-full bg-transparent ${paddingClass} text-sm font-bold text-slate-900 outline-none border-none disabled:cursor-not-allowed`}
      />
      {suffix && <span className="pr-1 text-slate-400 font-bold text-sm">{suffix}</span>}
      <div className="flex flex-col border-l border-slate-100 shrink-0">
        <button tabIndex={-1} disabled={disabled} onClick={(e) => adjust(e, 1)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors border-b border-slate-100 disabled:opacity-30">
          <ChevronDown className="rotate-180" size={10} />
        </button>
        <button tabIndex={-1} disabled={disabled} onClick={(e) => adjust(e, -1)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-30">
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
  const [selectedFloors, setSelectedFloors] = useState<Set<string>>(new Set());
  const [selectedAdjustments, setSelectedAdjustments] = useState<Set<string>>(new Set());
  const [selectedAnomalies, setSelectedAnomalies] = useState<Set<string>>(new Set());
  const [showDeleteWarning, setShowDeleteWarning] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const [block, setBlock] = useState<Block | null>(activeBlock);

  useEffect(() => { if (activeBlock) setBlock(activeBlock); }, [activeBlock?.id]);

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

  const updateBlock = (updates: Partial<Block>) => {
    if (!block || (block.status === 'Completed' && !updates.status)) return;
    const newBlock = { ...block, ...updates };
    setBlock(newBlock);
    onUpdateDevelopment({ ...development, blocks: development.blocks.map(b => b.id === block.id ? newBlock : b) });
  };

  const toggleSelection = (id: string, type: 'floor' | 'adj' | 'anom') => {
    if (block?.status === 'Completed') return;
    if (type === 'floor') { const next = new Set(selectedFloors); if (next.has(id)) next.delete(id); else next.add(id); setSelectedFloors(next); }
    else if (type === 'adj') { const next = new Set(selectedAdjustments); if (next.has(id)) next.delete(id); else next.add(id); setSelectedAdjustments(next); }
    else if (type === 'anom') { const next = new Set(selectedAnomalies); if (next.has(id)) next.delete(id); else next.add(id); setSelectedAnomalies(next); }
  };

  const performBulkDelete = () => {
    if (!block) return;
    updateBlock({ 
      floors: block.floors.filter(f => !selectedFloors.has(f.id)), 
      adjustments: block.adjustments.filter(a => !selectedAdjustments.has(a.id)), 
      anomalies: block.anomalies.filter(an => !selectedAnomalies.has(an.id)) 
    }); 
    setSelectedFloors(new Set()); 
    setSelectedAdjustments(new Set()); 
    setSelectedAnomalies(new Set());
    setShowDeleteWarning(false);
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
  const totalGIA = block.floors.reduce((acc, f) => acc + (f.gia || 0), 0);
  const buildingCostExact = block.floors.reduce((acc, f) => acc + (((block.buildingRate.ratesPerFloor[f.level] || currentGlobalBaseRate) * block.buildingRate.locationFactor) * f.gia), 0);
  const anomaliesRawTotal = block.anomalies.reduce((acc, a) => acc + (a.quantity * a.rate), 0);
  const anomaliesAdjustedTotalExact = anomaliesRawTotal * block.buildingRate.locationFactor;
  const upliftsPercent = block.adjustments.reduce((acc, a) => acc + (a.uplift || 0), 0);
  const netAdjustmentAmountExact = buildingCostExact * (upliftsPercent / 100);
  const revisedNetBuildingCostExact = buildingCostExact + netAdjustmentAmountExact;
  const demolitionCostExact = totalGIA * block.demolitionRate;
  
  const subTotalNetRebuildingExact = revisedNetBuildingCostExact + demolitionCostExact + anomaliesAdjustedTotalExact;
  
  const professionalFeeAmountExact = subTotalNetRebuildingExact * (block.fees.professionalPercent / 100);
  const localAuthorityFeesExact = block.fees.localAuthority;
  const totalFeesExact = professionalFeeAmountExact + localAuthorityFeesExact;
  
  const totalReinstatementCostExact = subTotalNetRebuildingExact + totalFeesExact;
  const totalReinstatementCostRounded = roundUpToNearestThousand(totalReinstatementCostExact);

  const totalSelectedCount = selectedFloors.size + selectedAdjustments.size + selectedAnomalies.size;

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-10">
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3 sm:gap-4">
        <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-inner ${(block.completedSections || []).includes(id) ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{Icon}</div>
        {title}
      </h3>
      <button
        onClick={() => { const cur = block.completedSections || []; updateBlock({ completedSections: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] }); }}
        disabled={isLocked}
        className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-[10px] uppercase tracking-widest transition-all border shrink-0 ${ (block.completedSections || []).includes(id) ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
      >
        {(block.completedSections || []).includes(id) ? <><CheckCircle2 className="inline mr-2" size={14} /> Done</> : <><Circle className="inline mr-2" size={14} /> Mark Done</>}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 font-inter">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80 no-print">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button onClick={onBack} className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 border border-slate-200 shrink-0"><ChevronLeft size={20} /></button>
          <div className="flex flex-col min-w-0"><h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">{block.name}</h2><p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-widest truncate">{development.name}</p></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
             {isSaving ? <><Loader2 size={12} className="text-blue-500 animate-spin" /><span className="text-[12px] font-semibold uppercase text-blue-500 tracking-wider">Syncing</span></> : <><div className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span className="text-[12px] font-semibold uppercase text-slate-500 tracking-wider">Saved</span></>}
          </div>
          <button disabled={!canUndo || isLocked} onClick={onUndo} className="p-2 rounded-xl border text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"><Undo2 size={18} /></button>
        </div>
      </div>

      {/* Anchor Navigation */}
      <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar scroll-smooth sticky top-[57px] sm:top-[73px] z-40 no-print">
        {steps.map((step, idx) => (
          <button key={idx} onClick={() => scrollToSection(idx)} className={`flex-1 min-w-[60px] sm:min-w-[90px] px-1 sm:px-2 py-3 sm:py-4 border-b-4 transition-all flex flex-col items-center justify-center gap-1 group ${activeStep === idx ? 'border-blue-600 bg-blue-50/20' : 'border-transparent text-slate-500'}`}>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all ${ (block.completedSections || []).includes(step.id) ? 'bg-green-600 text-white' : activeStep === idx ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>
              {(block.completedSections || []).includes(step.id) ? <CheckCircle2 size={12} /> : React.cloneElement(step.icon as React.ReactElement<any>, { size: 12 })}
            </div>
            <span className={`text-[8px] sm:text-[9px] font-semibold uppercase tracking-tight ${activeStep === idx ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</span>
          </button>
        ))}
      </div>

      {/* Delete Selection Overlay */}
      {totalSelectedCount > 0 && !isLocked && (
        <div className="fixed bottom-8 sm:bottom-32 left-1/2 lg:left-[calc(144px+50%)] -translate-x-1/2 z-[100] flex justify-center pointer-events-none no-print w-[calc(100%-2rem)] sm:w-auto">
          <div className="bg-slate-900 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center gap-4 sm:gap-8 animate-in slide-in-from-bottom-4 pointer-events-auto border border-slate-700 w-full sm:w-auto justify-between sm:justify-start">
             <div className="flex items-center gap-2 sm:gap-3">
                <Trash2 size={16} className="text-blue-400" />
                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest">{totalSelectedCount} Selected</p>
             </div>
             <div className="h-8 w-px bg-white/20 hidden sm:block" />
             <div className="flex gap-2 sm:gap-3">
                <button onClick={() => { setSelectedFloors(new Set()); setSelectedAdjustments(new Set()); setSelectedAnomalies(new Set()); }} className="px-3 sm:px-6 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">Clear</button>
                <button onClick={() => setShowDeleteWarning(true)} className="px-4 sm:px-8 py-2 bg-red-600 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-900/40 transition-all">Delete</button>
             </div>
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
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Selection?</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-normal">
              You are about to remove {totalSelectedCount} items from this block assessment. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteWarning(false)} className="flex-1 py-3 text-slate-500 font-semibold uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl border border-slate-100 transition-all">Cancel</button>
              <button onClick={performBulkDelete} className="flex-1 py-3 bg-red-600 text-white font-semibold uppercase text-[10px] tracking-widest hover:bg-red-700 rounded-xl shadow-lg transition-all">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar p-4 sm:p-8 md:p-12 space-y-12 sm:space-y-24 pb-32 no-print">
        
        {/* Section 1: Overview */}
        <section ref={sectionRefs[0]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="overview" title="Assessment Overview" icon={<Info size={22} />} />
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6 p-4 sm:p-8 bg-slate-50/50 rounded-xl sm:rounded-[2rem] border border-slate-100">
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={14} /> Development Context</h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-end">
                   <div className="sm:col-span-10">
                      <label className="block text-[10px] font-semibold text-slate-900 uppercase tracking-widest mb-1.5 px-1">Property Address</label>
                      <input disabled={isLocked} type="text" value={development.name} onChange={e => onUpdateDevelopment({ ...development, name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-3 sm:py-3.5 px-4 sm:px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                   </div>
                   <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-900 uppercase tracking-widest mb-1.5 px-1">Block Count</label>
                      <NumberInput disabled={true} allowDecimals={false} value={development.blocks.length} onChange={() => {}} className="w-full" maxDigits={2} paddingClass="py-3 sm:py-3.5 px-3" />
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-900 uppercase tracking-widest mb-1.5 px-1">Scheme Number</label>
                    <input disabled={isLocked} type="text" value={development.reference} onChange={e => onUpdateDevelopment({ ...development, reference: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-900 uppercase tracking-widest mb-1.5 px-1">Case Number</label>
                    <input disabled={isLocked} type="text" value={development.caseNumber || ''} onChange={e => onUpdateDevelopment({ ...development, caseNumber: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6 p-4 sm:p-8 border border-transparent">
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} /> Block Identifier Details</h4>
                <div>
                   <label className="block text-[10px] font-semibold text-slate-900 uppercase tracking-widest mb-1.5 px-1">Block Address</label>
                   <input disabled={isLocked} type="text" value={block.addressLine || ''} onChange={e => updateBlock({ addressLine: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 sm:py-3.5 px-4 sm:px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-900 uppercase tracking-widest mb-1.5 px-1">Town/City</label>
                    <input disabled={isLocked} type="text" value={block.town || ''} onChange={e => updateBlock({ town: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-900 uppercase tracking-widest mb-1.5 px-1">Postcode</label>
                    <input disabled={isLocked} type="text" value={block.postcode || ''} onChange={e => updateBlock({ postcode: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Building Rate & Area */}
        <section ref={sectionRefs[1]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8 sm:space-y-12">
            <SectionHeader id="rates" title="Building Rate & Area" icon={<TrendingUp size={22} />} />
            <div className="space-y-6 sm:space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 items-end">
                 <div>
                    <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">UK Region Factor</label>
                    <div className="relative group/select">
                      <select disabled={isLocked} value={block.buildingRate?.locationName || ''} onChange={e => { const r = e.target.value; updateBlock({ buildingRate: { ...block.buildingRate, locationName: r, locationFactor: REGIONAL_FACTORS[r] || 1.0 } }); }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
                        {Object.keys(REGIONAL_FACTORS).sort().map(region => (<option key={region} value={region}>{region}</option>))}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Multiplier (%)</label>
                    <NumberInput disabled={isLocked} value={block.buildingRate?.locationFactor || 1} step={0.01} suffix="%" paddingClass="py-4 px-3" onChange={val => updateBlock({ buildingRate: { ...block.buildingRate, locationFactor: val } })} />
                 </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8 items-end pt-6 border-t border-slate-100">
                <div className="sm:col-span-9">
                  <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Spon's 2025 Standard Category</label>
                  <div className="relative group/select">
                    <select disabled={isLocked} className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 pr-12 transition-all" onChange={(e) => setSelectedCategoryLabel(e.target.value)} value={selectedCategoryLabel}>
                      {BUILDING_CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1 sm:text-right">Base Rate</label>
                  <div className="relative group/select">
                    <select disabled={isLocked} className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 text-right pr-10 transition-all" value={currentGlobalBaseRate} onChange={(e) => { const newRate = parseInt(e.target.value); const nextRates = { ...block.buildingRate.ratesPerFloor }; block.floors.forEach(f => nextRates[f.level] = newRate); updateBlock({ buildingRate: { ...block.buildingRate, ratesPerFloor: nextRates } }); }}>
                      {getRateOptions(activeCategory).map(r => (<option key={r} value={r}>£{formatNumber(r, 0)}</option>))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Cost Breakdown */}
        <section ref={sectionRefs[2]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="breakdown" title="Building Cost Breakdown" icon={<PoundSterling size={22} />} />
            <div className="space-y-6">
              {!isLocked && (<button onClick={() => { const nextLvl = LEVEL_OPTIONS[block.floors.length] || `Level ${block.floors.length}`; updateBlock({ floors: [...block.floors, { id: Date.now().toString(), description: nextLvl, level: nextLvl, gia: 0, gfa: 0 }], buildingRate: { ...block.buildingRate, ratesPerFloor: { ...block.buildingRate.ratesPerFloor, [nextLvl]: currentGlobalBaseRate } } }); }} className="text-blue-600 font-semibold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-6 py-3 rounded-2xl transition-all border border-blue-100 shadow-sm mb-6"><Plus size={16} /> Add Building Level</button>)}
              <div className="bg-slate-50/50 rounded-xl sm:rounded-[2rem] border border-slate-200 overflow-x-auto shadow-inner mb-8">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-slate-100/50 border-b border-slate-200">
                    <tr><th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Level</th><th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] font-semibold text-slate-500 uppercase tracking-widest text-center">GIA (m²)</th><th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] font-semibold text-slate-500 uppercase tracking-widest text-right">Rate (£/m²)</th><th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] font-semibold text-slate-500 uppercase tracking-widest text-right">Sum (£)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {block.floors.map((floor) => (
                      <tr key={floor.id} onClick={() => toggleSelection(floor.id, 'floor')} className={`group transition-colors cursor-pointer ${selectedFloors.has(floor.id) ? 'bg-blue-100/50' : 'hover:bg-white'}`}>
                        <td className="px-6 py-3"><input disabled={isLocked} value={floor.description} onClick={e => e.stopPropagation()} onChange={e => { updateBlock({ floors: block.floors.map(f => f.id === floor.id ? {...f, description: e.target.value} : f) }); }} className="w-full bg-transparent border-none text-sm font-bold text-slate-900 outline-none truncate disabled:opacity-50" /></td>
                        <td className="px-6 py-3 w-40" onClick={e => e.stopPropagation()}><NumberInput disabled={isLocked} value={floor.gia} paddingClass="py-1 px-2 text-center" step={5} maxDigits={5} allowDecimals={true} onChange={v => { updateBlock({ floors: block.floors.map(f => f.id === floor.id ? {...f, gia: v} : f) }); }} /></td>
                        <td className="px-6 py-3 w-52" onClick={e => e.stopPropagation()}><NumberInput disabled={isLocked} value={block.buildingRate.ratesPerFloor[floor.level] || currentGlobalBaseRate} paddingClass="py-1 px-2 text-right" step={50} maxDigits={4} prefix="£" allowDecimals={false} onChange={v => { updateBlock({ buildingRate: {...block.buildingRate, ratesPerFloor: {...block.buildingRate.ratesPerFloor, [floor.level]: v}} }); }} /></td>
                        <td className="px-6 py-3 w-40 text-right"><span className="text-sm font-bold text-slate-900">£{formatNumber(((block.buildingRate.ratesPerFloor[floor.level] || currentGlobalBaseRate) * block.buildingRate.locationFactor) * floor.gia, 2)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-900 text-white p-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800">
                 <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-10 items-center relative z-10">
                    <div className="sm:col-span-5 space-y-6">
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-4"><span className="text-slate-500 text-[10px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Aggregate Area</span><span className="text-blue-400 text-lg font-bold">{totalGIA.toLocaleString()} m²</span></div>
                       <div className="flex flex-col gap-1"><span className="text-slate-500 text-[10px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Net Construction</span><span className="text-slate-300 text-lg font-bold">£{formatNumber(buildingCostExact, 2)}</span></div>
                    </div>
                    <div className="sm:col-span-7"><div className="bg-white/5 p-6 sm:p-10 md:p-14 rounded-xl sm:rounded-[2rem] border border-white/10 flex flex-col items-center justify-center text-center shadow-inner"><p className="text-blue-400 text-[11px] font-semibold uppercase tracking-[0.3em] mb-3 whitespace-nowrap">Building Asset Cost</p><h4 className="text-2xl sm:text-4xl font-bold tracking-tighter">£{formatNumber(buildingCostExact, 2)}</h4></div></div>
                 </div>
                 <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600 rounded-full blur-[100px] opacity-10 -mr-20 -mt-20"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Adjustments */}
        <section ref={sectionRefs[3]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="adjustments" title="Aggregate Adjustments" icon={<Hash size={22} />} />
            <div className="space-y-6">
               {!isLocked && (<button onClick={() => updateBlock({ adjustments: [...block.adjustments, { id: Date.now().toString(), type: 'Access', uplift: 0, reason: '' }] })} className="text-blue-600 font-semibold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-6 py-3 rounded-2xl transition-all border border-blue-100 shadow-sm mb-6"><Plus size={16} /> Add Uplift Factor</button>)}
               <div className="space-y-4">
                  {block.adjustments.map((adj) => (
                    <div key={adj.id} onClick={() => toggleSelection(adj.id, 'adj')} className={`p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border transition-all cursor-pointer ${selectedAdjustments.has(adj.id) ? 'bg-blue-100/50 border-blue-200' : 'bg-white border-slate-200'}`}>
                         <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4 items-center w-full">
                            <div className="col-span-2 sm:col-span-3" onClick={e => e.stopPropagation()}><select disabled={isLocked} value={adj.type} onChange={e => { updateBlock({ adjustments: block.adjustments.map(x => x.id === adj.id ? {...x, type: e.target.value} : x) }); }} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 sm:px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-700 outline-none">{ADJUSTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div className="col-span-2 sm:col-span-4" onClick={e => e.stopPropagation()}><input disabled={isLocked} value={adj.reason} onChange={e => { updateBlock({ adjustments: block.adjustments.map(x => x.id === adj.id ? {...x, reason: e.target.value} : x) }); }} placeholder="Rationale..." className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 sm:px-4 text-xs font-medium text-slate-900 outline-none" /></div>
                            <div className="col-span-1 sm:col-span-2" onClick={e => e.stopPropagation()}><NumberInput disabled={isLocked} value={adj.uplift} step={0.5} suffix="%" paddingClass="py-2 px-2" className="text-center w-full sm:w-32" maxDigits={3} onChange={v => { updateBlock({ adjustments: block.adjustments.map(x => x.id === adj.id ? {...x, uplift: v} : x) }); }} /></div>
                            <div className="col-span-1 sm:col-span-3 text-right"><p className="text-sm font-bold text-slate-900">£{formatNumber(buildingCostExact * (adj.uplift / 100), 2)}</p></div>
                         </div>
                    </div>
                  ))}
                  <div className="bg-slate-900 text-white p-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800">
                     <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-10 items-center relative z-10">
                        <div className="sm:col-span-5 space-y-6">
                           <div className="flex flex-col gap-1 border-b border-white/5 pb-4"><span className="text-slate-500 text-[10px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Total Adjustment</span><span className="text-blue-400 text-lg font-bold">{formatNumber(upliftsPercent, 1)}%</span></div>
                           <div className="flex flex-col gap-1"><span className="text-slate-500 text-[10px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Revised Adjustment</span><span className="text-slate-300 text-lg font-bold">£{formatNumber(netAdjustmentAmountExact, 2)}</span></div>
                        </div>
                        <div className="sm:col-span-7"><div className="bg-white/5 p-6 sm:p-10 md:p-14 rounded-xl sm:rounded-[2rem] border border-white/10 flex flex-col items-center justify-center text-center shadow-inner"><p className="text-blue-400 text-[11px] font-semibold uppercase tracking-[0.3em] mb-3 whitespace-nowrap">Revised Net Building Cost</p><h4 className="text-2xl sm:text-4xl font-bold tracking-tighter">£{formatNumber(revisedNetBuildingCostExact, 2)}</h4></div></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Section 5: Demolition */}
        <section ref={sectionRefs[4]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="demolition" title="Demolition & Clearance" icon={<Hammer size={22} />} />
            <div className="space-y-6">
               <div className="bg-slate-900 text-white p-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800">
                 <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-10 items-center relative z-10">
                    <div className="sm:col-span-5 space-y-6">
                       <div className="space-y-2">
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">Benchmark Rate</label>
                          <NumberInput disabled={isLocked} value={block.demolitionRate || 85} step={5} prefix="£" paddingClass="py-3 px-3" onChange={v => updateBlock({ demolitionRate: v })} />
                       </div>
                       <div className="pt-4 border-t border-white/5 space-y-1">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Calculation Basis</p>
                          <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">£{block.demolitionRate} per m² * {totalGIA.toLocaleString()} m² Aggregate Area</p>
                       </div>
                    </div>
                    <div className="sm:col-span-7"><div className="bg-white/5 p-6 sm:p-10 md:p-14 rounded-xl sm:rounded-[2rem] border border-white/10 flex flex-col items-center justify-center text-center shadow-inner"><p className="text-blue-400 text-[11px] font-semibold uppercase tracking-[0.3em] mb-3 whitespace-nowrap">Demolition Aggregate</p><h4 className="text-2xl sm:text-4xl font-bold tracking-tighter">£{formatNumber(demolitionCostExact, 2)}</h4></div></div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* Section 6: Anomalies */}
        <section ref={sectionRefs[5]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200">
            <SectionHeader id="anomalies" title="Anomalous Items" icon={<LayoutGrid size={22} />} />
            <div className="space-y-6">
              <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner mb-8">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {block.anomalies.map((anom) => (
                        <React.Fragment key={anom.id}>
                          <tr onClick={() => toggleSelection(anom.id, 'anom')} className={`group transition-colors cursor-pointer border-t border-slate-100 ${selectedAnomalies.has(anom.id) ? 'bg-amber-100/50' : 'hover:bg-white'}`}>
                            <td className="px-6 pt-4 pb-2"><input disabled={isLocked} value={anom.item} onClick={e => e.stopPropagation()} onChange={e => { updateBlock({ anomalies: block.anomalies.map(x => x.id === anom.id ? {...x, item: e.target.value} : x) }); }} className="w-full bg-transparent border-none text-sm font-bold text-slate-900 outline-none truncate disabled:opacity-50" /></td>
                            <td className="px-6 pt-4 pb-2 text-right"><span className="text-lg font-bold text-slate-900">£{formatNumber(anom.quantity * anom.rate * block.buildingRate.locationFactor, 2)}</span></td>
                          </tr>
                          <tr onClick={() => toggleSelection(anom.id, 'anom')} className={`group transition-colors cursor-pointer ${selectedAnomalies.has(anom.id) ? 'bg-amber-100/50' : 'hover:bg-white'}`}>
                            <td colSpan={2} className="px-6 pb-4 pt-1">
                               <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center gap-2"><span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Qty:</span><NumberInput disabled={isLocked} value={anom.quantity} paddingClass="py-1 px-2 text-center" className="w-24" maxDigits={5} step={1} allowDecimals={anom.unit !== 'Nr'} onChange={v => { updateBlock({ anomalies: block.anomalies.map(x => x.id === anom.id ? {...x, quantity: v} : x) }); }} /></div>
                                  <div className="flex items-center gap-2"><span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Rate:</span><NumberInput disabled={isLocked} value={anom.rate} paddingClass="py-1 px-2 text-right" className="w-40" maxDigits={8} step={50} prefix="£" onChange={v => { updateBlock({ anomalies: block.anomalies.map(x => x.id === anom.id ? {...x, rate: v} : x) }); }} /></div>
                               </div>
                            </td>
                          </tr>
                        </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-900 text-white p-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800">
                 <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-10 items-center relative z-10">
                    <div className="sm:col-span-5 space-y-4">
                       <div className="flex flex-col gap-1 border-b border-white/5 pb-3"><span className="text-slate-500 text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap">Regional Coefficient</span><span className="text-amber-400 text-sm font-bold">x{formatNumber(block.buildingRate.locationFactor, 2)} Applied</span></div>
                       <div className="flex flex-col gap-1"><span className="text-slate-500 text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap">Anomalies Base Sum</span><span className="text-slate-300 text-sm font-bold">£{formatNumber(anomaliesRawTotal, 2)}</span></div>
                    </div>
                    <div className="col-span-7"><div className="text-center bg-white/5 p-14 rounded-3xl border border-white/10 shadow-inner px-10"><p className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] mb-2 whitespace-nowrap">Adjusted Anomalies Cost</p><h4 className="text-4xl font-bold tracking-tighter whitespace-nowrap">£{formatNumber(anomaliesAdjustedTotalExact, 2)}</h4></div></div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Final Summary */}
        <section ref={sectionRefs[6]} className="max-w-3xl mx-auto space-y-8 scroll-mt-32">
          <div className="bg-white rounded-2xl sm:rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
             <div className="bg-slate-900 text-white p-6 sm:p-10 md:p-12 relative overflow-hidden"><ShieldCheck className="text-blue-400 inline mr-3 sm:mr-4" size={24} /><h3 className="text-lg sm:text-2xl font-bold uppercase tracking-widest sm:tracking-[0.3em] inline">Assessment Maturity</h3></div>
             <div className="p-5 sm:p-8 md:p-12 space-y-8 sm:space-y-12">
                <div className="space-y-6">
                   <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4 px-1">Total Construction Aggregate</h4>
                   <div className="space-y-4 font-bold text-sm">
                      <div className="flex justify-between items-center text-slate-600"><span>Revised Net Building Cost</span><span className="text-slate-900">£{formatNumber(revisedNetBuildingCostExact, 2)}</span></div>
                      <div className="flex justify-between items-center text-slate-600"><span>Demolition & Site Clearance</span><span className="text-slate-900">£{formatNumber(demolitionCostExact, 2)}</span></div>
                      <div className="flex justify-between items-center text-slate-600"><span>Aggregate Anomalies</span><span className="text-slate-900">£{formatNumber(anomaliesAdjustedTotalExact, 2)}</span></div>
                      <div className="flex justify-between items-center font-bold text-slate-900 pt-3 border-t border-slate-100"><span className="whitespace-nowrap">Sub-Total Net Construction Cost</span><span className="text-lg">£{formatNumber(subTotalNetRebuildingExact, 2)}</span></div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4 px-1">Professional Fees & Provisions</h4>
                   
                   <div className="grid grid-cols-2 gap-6 mb-4">
                      <div>
                         <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-1">Professional Fees (%)</label>
                         <NumberInput disabled={isLocked} allowDecimals={true} value={block.fees.professionalPercent} onChange={v => updateBlock({ fees: { ...block.fees, professionalPercent: v } })} maxDigits={2} paddingClass="py-3 px-3" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-1">Local Authority Fees (£)</label>
                         <NumberInput disabled={isLocked} allowDecimals={false} value={block.fees.localAuthority} onChange={v => updateBlock({ fees: { ...block.fees, localAuthority: v } })} maxDigits={5} prefix="£" paddingClass="py-3 px-3" />
                      </div>
                   </div>

                   <div className="space-y-4 font-bold text-sm">
                      <div className="flex justify-between items-center text-slate-600"><span>Professional Fees ({block.fees.professionalPercent}%)</span><span className="text-slate-900">£{formatNumber(professionalFeeAmountExact, 2)}</span></div>
                      <div className="flex justify-between items-center text-slate-600"><span>Local Authority & Statutory Fees</span><span className="text-slate-900">£{formatNumber(localAuthorityFeesExact, 2)}</span></div>
                      <div className="flex justify-between items-center font-bold text-slate-900 pt-3 border-t border-slate-100"><span className="whitespace-nowrap">Total Fees</span><span className="text-lg">£{formatNumber(totalFeesExact, 2)}</span></div>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">TOTAL REINSTATEMENT COST ON DAY ONE BASIS</p>
                      <p className="text-2xl font-bold text-slate-900">£{formatNumber(totalReinstatementCostExact, 2)}</p>
                   </div>
                </div>

                <div className="pt-6">
                   <div className="bg-slate-900 text-white rounded-2xl sm:rounded-[3.5rem] p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl border border-slate-800 text-center space-y-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent"></div>
                      <p className="text-blue-400 text-[10px] sm:text-[14px] font-semibold uppercase tracking-widest sm:tracking-[0.5em] relative z-10">TOTAL REINSTATEMENT COST</p>
                      <h2 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter relative z-10">£{formatNumber(totalReinstatementCostRounded, 0)}</h2>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 relative z-10">(Rounded Up To Nearest £1,000)</p>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 p-4 sm:p-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] no-print">
        <button onClick={onBack} className="px-6 sm:px-10 py-3 sm:py-4 text-slate-600 font-semibold uppercase tracking-widest text-[11px] sm:text-[12px] hover:bg-slate-50 rounded-xl sm:rounded-[2rem] border border-slate-200 transition-all text-center">Project Hub</button>
        <button onClick={() => { const next = isLocked ? 'Draft' : 'Completed'; updateBlock({ status: next }); if (next === 'Completed') onBack(); }} className={`px-6 sm:px-12 py-3 sm:py-4 text-white font-semibold uppercase tracking-widest sm:tracking-[0.1em] text-[11px] sm:text-[12px] rounded-xl sm:rounded-[2rem] transition-all shadow-2xl text-center ${isLocked ? 'bg-amber-600' : 'bg-slate-900 hover:bg-slate-800'}`}>
           {isLocked ? <><Undo2 className="inline mr-2" size={16} /> Unlock Block</> : <><CheckCircle2 className="inline mr-2" size={16} /> Verify Block</>}
        </button>
      </div>
    </div>
  );
};

export default WizardPage;