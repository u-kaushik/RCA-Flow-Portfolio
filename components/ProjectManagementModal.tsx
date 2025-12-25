import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, Plus, FileSpreadsheet, Hash, Building2, Upload, Database, CheckCircle2, ArrowRight, PoundSterling, User, Calendar } from 'lucide-react';
import { Development } from '../types';

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  editingDevId: string | null;
  store: any;
  onSuccess?: (dev?: Development) => void;
}

type WizardStep = 'mode' | 'details-project' | 'import-upload' | 'import-verify';

interface ParsedBlock {
  id: string;
  name: string;
  addressLine: string;
  town: string;
  county: string;
  postcode: string;
  numberOfUnits: number;
}

const formatWithCommas = (val: string): string => {
  const parts = val.replace(/,/g, '').split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  isOpen,
  onClose,
  mode,
  editingDevId,
  store,
  onSuccess
}) => {
  const [wizardStep, setWizardStep] = useState<WizardStep>('mode');
  const [devName, setDevName] = useState('');
  const [devRef, setDevRef] = useState('');
  const [devCase, setDevCase] = useState('');
  const [devAddress, setDevAddress] = useState('');
  const [devTown, setDevTown] = useState('');
  const [devPostcode, setDevPostcode] = useState('');
  const [blockCountInput, setBlockCountInput] = useState<string>('1');
  const [rcaFee, setRcaFee] = useState<string>('0.00');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedBlocks, setParsedBlocks] = useState<ParsedBlock[]>([]);
  const [createdAt, setCreatedAt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingDevId) {
        const dev = store.developments.find((d: any) => d.id === editingDevId);
        if (dev) {
          setDevName(dev.name);
          setDevRef(dev.reference);
          setDevCase(dev.caseNumber || '');
          setDevAddress(dev.addressLine || '');
          setDevTown(dev.town || '');
          setDevPostcode(dev.postcode || '');
          setBlockCountInput(dev.blocks.length.toString());
          setRcaFee(formatWithCommas((dev.rcaFee || 0).toFixed(2)));
          setCreatedAt(dev.createdAt);
          setWizardStep('details-project');
        }
      } else {
        resetLocalState();
      }
    }
  }, [isOpen, mode, editingDevId]);

  useEffect(() => {
    if (wizardStep === 'import-verify') {
      setBlockCountInput(parsedBlocks.length.toString());
    }
  }, [parsedBlocks.length, wizardStep]);

  const resetLocalState = () => {
    setWizardStep('mode');
    setDevName('');
    setDevRef('');
    setDevCase('');
    setDevAddress('');
    setDevTown('');
    setDevPostcode('');
    setBlockCountInput('1');
    setRcaFee('0.00');
    setCreatedAt('');
    setParsedBlocks([]);
  };

  const handleClose = () => {
    onClose();
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const blocks: ParsedBlock[] = [];
    lines.forEach((line, idx) => {
      if (idx === 0 || !line.trim()) return;
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 1) {
        blocks.push({
          id: `pb-${Date.now()}-${idx}`,
          name: parts[0] || `Block ${idx}`,
          addressLine: parts[1] || '',
          town: parts[2] || '',
          county: parts[3] || '',
          postcode: parts[4] || '',
          numberOfUnits: parseInt(parts[5]) || 1
        });
      }
    });
    setParsedBlocks(blocks);
    setWizardStep('import-verify');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => parseCSV(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const updateParsedBlock = (id: string, updates: Partial<ParsedBlock>) => {
    setParsedBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleRcaFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    setRcaFee(formatWithCommas(raw));
  };

  const handleRcaFeeBlur = () => {
    const numericValue = parseFloat(rcaFee.replace(/,/g, '')) || 0;
    setRcaFee(formatWithCommas(numericValue.toFixed(2)));
  };

  const handleSave = () => {
    const feeValue = parseFloat(rcaFee.replace(/,/g, '')) || 0;
    if (mode === 'edit' && editingDevId) {
      const existing = store.developments.find((d: any) => d.id === editingDevId);
      if (existing) {
        store.updateDevelopment({
          ...existing,
          name: devName,
          reference: devRef,
          caseNumber: devCase,
          addressLine: devAddress,
          town: devTown,
          postcode: devPostcode,
          rcaFee: feeValue
        });
      }
      handleClose();
    } else {
      let finalDev;
      if (wizardStep === 'details-project') {
        const finalBlockCount = Math.max(1, parseInt(blockCountInput) || 1);
        finalDev = store.addDevelopment(devName, devRef, finalBlockCount, { status: 'Draft' }, {
          addressLine: devAddress,
          town: devTown,
          postcode: devPostcode,
          caseNumber: devCase,
          rcaFee: feeValue
        });
      } else if (wizardStep === 'import-verify') {
        finalDev = store.createDevelopmentFromImport(devName, devRef, parsedBlocks, {
          addressLine: devAddress,
          town: devTown,
          postcode: devPostcode,
          caseNumber: devCase,
          rcaFee: feeValue
        });
      }
      if (onSuccess) onSuccess(finalDev);
      handleClose();
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[500] flex items-center justify-center p-4 overflow-hidden">
      <div className={`bg-white rounded-[2.5rem] w-full overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${wizardStep === 'import-verify' ? 'max-w-6xl h-[85vh]' : 'max-w-3xl'}`}>
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            {(wizardStep !== 'mode' && mode === 'create' && wizardStep !== 'import-verify') && (
              <button onClick={() => setWizardStep('mode')} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500">
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'edit' ? 'Update Property Details' : wizardStep === 'import-verify' ? 'Map Building Structures' : 'Register New Property'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} className="text-slate-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {wizardStep === 'mode' && (
            <div className="grid grid-cols-2 gap-8">
              <button onClick={() => setWizardStep('details-project')} className="group flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all space-y-6">
                <div className="w-20 h-20 bg-slate-100 group-hover:bg-blue-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all">
                  <Plus size={32} />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-slate-900 uppercase text-sm tracking-widest mb-1">Manual Setup</h4>
                  <p className="text-xs font-medium text-slate-500">Define property attributes manually</p>
                </div>
              </button>
              <button onClick={() => setWizardStep('import-upload')} className="group flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all space-y-6">
                <div className="w-20 h-20 bg-slate-100 group-hover:bg-emerald-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-all">
                  <FileSpreadsheet size={32} />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-slate-900 uppercase text-sm tracking-widest mb-1">Bulk Schedule Imprint</h4>
                  <p className="text-xs font-medium text-slate-500">Auto-parse from building schedules</p>
                </div>
              </button>
            </div>
          )}

          {wizardStep === 'import-upload' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  setIsDragging(false); 
                  const f = e.dataTransfer.files[0]; 
                  if (f) { 
                    const r = new FileReader(); 
                    r.onload = (ev) => parseCSV(ev.target?.result as string); 
                    r.readAsText(f); 
                  } 
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-3 border-dashed rounded-[2.5rem] py-20 flex flex-col items-center justify-center gap-6 transition-all cursor-pointer ${isDragging ? 'bg-emerald-50 border-emerald-500 scale-[0.98]' : 'border-slate-100 bg-slate-50 hover:border-emerald-400'}`}
              >
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all ${isDragging ? 'bg-emerald-600 text-white' : 'bg-white text-slate-300'}`}>
                  <FileSpreadsheet size={40} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 uppercase text-sm tracking-[0.2em]">Drop Building Schedule</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-2 uppercase tracking-widest">CSV: Name, Address, Town, County, Postcode, Units</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />
              </div>
            </div>
          )}

          {(wizardStep === 'details-project' || wizardStep === 'import-verify') && (
            <div className={`gap-12 ${wizardStep === 'import-verify' ? 'grid grid-cols-2' : 'flex flex-col'}`}>
              
              {/* Left Column: Development Details */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-1">Property Address</label>
                    <input 
                      type="text" 
                      value={devName} 
                      onChange={e => setDevName(e.target.value)} 
                      placeholder="e.g. 123 Sterling Heights Residency" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                      autoFocus 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-1">Scheme Number</label>
                      <input 
                        type="text" 
                        value={devRef} 
                        onChange={e => setDevRef(e.target.value)} 
                        placeholder="e.g. RCA-2025-LON" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Hash size={12} /> Case No.
                      </label>
                      <input 
                        type="text" 
                        value={devCase} 
                        onChange={e => setDevCase(e.target.value)} 
                        placeholder="e.g. CAS-4402" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Building2 size={12} /> Block Count
                      </label>
                      <input 
                        type="number" 
                        value={blockCountInput} 
                        readOnly={wizardStep === 'import-verify' || mode === 'edit'}
                        onChange={e => setBlockCountInput(e.target.value)} 
                        className={`w-full border rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${(wizardStep === 'import-verify' || mode === 'edit') ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200'}`} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <PoundSterling size={12} /> Internal RCA Fee (£)
                      </label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</span>
                        <input 
                          type="text" 
                          value={rcaFee} 
                          onChange={handleRcaFeeChange}
                          onBlur={handleRcaFeeBlur}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-10 pr-6 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                        />
                      </div>
                    </div>
                  </div>

                  {mode === 'edit' && (
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 bg-slate-50/50 p-6 rounded-3xl mt-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <User size={12} /> Created By
                        </label>
                        <p className="text-sm font-bold text-slate-700">{store.user?.firstName ? `${store.user.firstName} ${store.user.lastName}` : 'Senior Building Surveyor'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Calendar size={12} /> Registered On
                        </label>
                        <p className="text-sm font-bold text-slate-700">{formatDate(createdAt)}</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-[2rem] border border-blue-100 overflow-hidden">
                    <p className="text-[7.5px] font-bold text-blue-600 uppercase tracking-widest text-center whitespace-nowrap">
                      Internal RCA fees are administrative and separate from technical building valuations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Block Mapping (Only in import-verify step) */}
              {wizardStep === 'import-verify' && (
                <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
                      <Database size={20} className="text-emerald-500" /> Structure Calibration
                    </h3>
                    <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold uppercase tracking-widest">{parsedBlocks.length} Blocks Mapped</span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-4 space-y-4 min-h-[300px]">
                    {parsedBlocks.map((b, idx) => (
                      <div key={b.id} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 group hover:border-emerald-300 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={10} /> Block Asset #{idx + 1}
                          </span>
                          <button onClick={() => setParsedBlocks(prev => prev.filter(item => item.id !== b.id))} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-9 space-y-1">
                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest px-1">Reference Name</label>
                            <input 
                              value={b.name} 
                              onChange={e => updateParsedBlock(b.id, { name: e.target.value })} 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10" 
                            />
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest px-1">Units (Nr)</label>
                            <input 
                              type="number" 
                              value={b.numberOfUnits} 
                              onChange={e => updateParsedBlock(b.id, { numberOfUnits: parseInt(e.target.value) || 0 })} 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {parsedBlocks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
                        <Database size={40} className="mb-4 opacity-20" />
                        <p className="text-xs font-semibold uppercase tracking-widest">No blocks remaining</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4 shrink-0">
          <button onClick={handleClose} className="px-8 py-3 rounded-2xl text-[11px] font-semibold uppercase text-slate-500 tracking-widest hover:bg-white border border-transparent transition-colors">
            Cancel
          </button>
          {(wizardStep === 'details-project' || wizardStep === 'import-verify') && (
            <button onClick={handleSave} disabled={!devName || !devRef} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
              {mode === 'edit' ? 'Update Details' : 'Continue'} <CheckCircle2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagementModal;