import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Settings, LogOut, Building2, Box, FileText, CheckCircle, Clock, ChevronDown, ChevronRight, Layout, Hammer, Lock, MoreVertical, Archive, Trash2, Edit3, Star } from 'lucide-react';
import { User, Development, Block } from '../types';

interface SidebarProps {
  activePage: 'dashboard' | 'wizard' | 'externals' | 'settings' | 'reports' | 'development';
  activeDevelopment: Development | null;
  activeBlock: Block | null;
  developments: Development[];
  onNavigate: (page: 'dashboard' | 'wizard' | 'externals' | 'settings' | 'reports' | 'development') => void;
  onSelectDevelopment: (dev: Development) => void;
  onSelectBlock: (dev: Development, block: Block) => void;
  onSelectExternals: (dev: Development) => void;
  onEditDevelopment: (dev: Development) => void;
  onArchiveDevelopment: (devId: string) => void;
  onDeleteDevelopment: (devId: string) => void;
  onToggleFavourite: (devId: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activePage, 
  activeDevelopment, 
  activeBlock, 
  developments,
  onNavigate, 
  onSelectDevelopment,
  onSelectBlock,
  onSelectExternals,
  onEditDevelopment,
  onArchiveDevelopment,
  onDeleteDevelopment,
  onToggleFavourite,
  user, 
  onLogout 
}) => {
  const [expandedDevId, setExpandedDevId] = useState<string | null>(activeDevelopment?.id || null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeDevelopment) {
      setExpandedDevId(activeDevelopment.id);
    }
  }, [activeDevelopment]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (e: React.MouseEvent, devId: string) => {
    e.stopPropagation();
    setExpandedDevId(prev => prev === devId ? null : devId);
  };

  const handleDevClick = (dev: Development) => {
    onSelectDevelopment(dev);
    setExpandedDevId(dev.id);
  };

  const toggleMenu = (e: React.MouseEvent, devId: string) => {
    e.stopPropagation();
    if (activeMenuId === devId) {
      setActiveMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, left: rect.left });
      setActiveMenuId(devId);
    }
  };

  const isCurrentProjectComplete = activeDevelopment 
    ? activeDevelopment.blocks.length > 0 && 
      activeDevelopment.blocks.every(b => b.status === 'Completed') &&
      activeDevelopment.externalsAssessment.status === 'Completed'
    : false;

  return (
    <aside className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0 relative z-30">
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-blue-900/40">R</div>
        <h1 className="text-xl font-black tracking-tight">RCA Wizard</h1>
      </div>

      <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto custom-scrollbar pb-6 overflow-x-visible">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
            activePage === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="font-bold text-sm tracking-wide">RCA Hub</span>
        </button>
        
        <div className="pt-8 pb-3">
          <div className="flex items-center justify-between px-4 mb-4">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.25em]">Active RCAs</p>
          </div>
          <div className="space-y-2">
            {developments.map((dev) => {
              const isSelected = activeDevelopment?.id === dev.id;
              const isExpanded = expandedDevId === dev.id;
              const devComplete = dev.blocks.length > 0 && 
                                 dev.blocks.every(b => b.status === 'Completed') && 
                                 dev.externalsAssessment.status === 'Completed';
              const isMenuOpen = activeMenuId === dev.id;
              
              return (
                <div key={dev.id} className="space-y-1">
                  <div className={`flex items-center rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-slate-800 ring-1 ring-slate-700 shadow-lg' 
                        : 'hover:bg-slate-800 group'
                    }`}>
                    <button
                      onClick={() => handleDevClick(dev)}
                      className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0"
                    >
                      <Building2 size={16} className={isSelected ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'} />
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black truncate tracking-tight">{dev.name}</p>
                          {devComplete && <CheckCircle size={10} className="text-green-500 shrink-0" />}
                          {dev.isFavourite && <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[8px] font-bold text-slate-500 truncate uppercase">{dev.reference}</p>
                      </div>
                    </button>
                    
                    <div className="flex items-center pr-2 gap-1">
                      <button 
                        onClick={(e) => toggleMenu(e, dev.id)}
                        className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${isMenuOpen ? 'text-blue-400' : 'text-slate-600'}`}
                      >
                        <MoreVertical size={14} />
                      </button>
                      <button 
                        onClick={(e) => toggleExpand(e, dev.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-slate-600"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-5 pl-4 border-l-2 border-slate-800 space-y-1.5 mt-2 animate-in slide-in-from-top-2 duration-300">
                      {dev.blocks.map(block => {
                        const isBlockActive = activeBlock?.id === block.id && activePage === 'wizard';
                        const isBlockCompleted = block.status === 'Completed';
                        return (
                          <button
                            key={block.id}
                            onClick={() => onSelectBlock(dev, block)}
                            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-all group ${
                              isBlockActive 
                                ? 'text-blue-400 bg-blue-400/5' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Box size={12} className={isBlockActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'} />
                            <span className="text-[11px] font-bold flex-1 truncate">{block.name}</span>
                            {isBlockCompleted && (
                              <div className="w-4 h-4 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                                <CheckCircle size={10} className="text-green-500" />
                              </div>
                            )}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => onSelectExternals(dev)}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-all group ${
                          activePage === 'externals' && activeDevelopment?.id === dev.id
                            ? 'text-emerald-400 bg-emerald-400/5' 
                            : 'text-slate-500 hover:text-emerald-400'
                        }`}
                      >
                        <Hammer size={12} className={activePage === 'externals' && activeDevelopment?.id === dev.id ? 'text-emerald-400' : 'text-slate-600 group-hover:text-emerald-400'} />
                        <span className="text-[11px] font-bold flex-1 truncate">Externals Assessment</span>
                        {dev.externalsAssessment.status === 'Completed' && (
                          <div className="w-4 h-4 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle size={10} className="text-green-500" />
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-8 pb-3 px-4">
           <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.25em] mb-4">Export Tools</p>
           <button
            onClick={() => isCurrentProjectComplete && onNavigate('reports')}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl transition-all ${
              isCurrentProjectComplete 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-400/20 hover:bg-blue-600/20' 
                : 'bg-slate-800/20 text-slate-600 cursor-not-allowed border border-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText size={18} />
              <span className="font-bold text-sm tracking-wide">Reporting</span>
            </div>
            {!isCurrentProjectComplete && <Lock size={14} className="opacity-40" />}
          </button>
        </div>
      </nav>

      {/* FIXED MENU OVERLAY */}
      {activeMenuId && (
        <div 
          ref={menuRef} 
          className="fixed w-48 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200 p-1.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {developments.filter(d => d.id === activeMenuId).map(dev => (
            <React.Fragment key={dev.id}>
              <button 
                onClick={(e) => { e.stopPropagation(); onEditDevelopment(dev); setActiveMenuId(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left"
              >
                <Edit3 size={12} className="text-blue-500" /> Edit Details
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavourite(dev.id); setActiveMenuId(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left"
              >
                <Star size={12} className="text-amber-500" fill={dev.isFavourite ? "currentColor" : "none"} /> {dev.isFavourite ? 'Unfavourite' : 'Favourite'}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onArchiveDevelopment(dev.id); setActiveMenuId(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left"
              >
                <Archive size={12} className="text-slate-500" /> {dev.isArchived ? 'Restore' : 'Archive'}
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteDevelopment(dev.id); setActiveMenuId(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-widest text-left"
              >
                <Trash2 size={12} /> Delete
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="mt-auto px-6 pb-6 pt-6 border-t border-slate-800 bg-slate-900/50">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-4 ${
            activePage === 'settings' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings size={18} />
          <span className="font-bold text-sm">Settings</span>
        </button>

        <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-800/60 shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-slate-700 overflow-hidden border border-slate-600 shrink-0 shadow-xl">
             <img src={user.avatar || `https://picsum.photos/seed/${user.id}/100/100`} alt={user.firstName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-slate-100">{user.firstName} {user.lastName}</p>
            <p className="text-[9px] text-slate-500 truncate uppercase font-black tracking-widest">{user.role}</p>
          </div>
          <button onClick={onLogout} className="text-slate-600 hover:text-red-400 transition-all p-1.5 hover:bg-red-400/10 rounded-lg">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;