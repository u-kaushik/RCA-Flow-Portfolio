import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Settings, LogOut, Building2, Box, FileText, ChevronDown, ChevronRight, MoreVertical, Archive, Trash2, Edit3, Star, Copy, CheckCircle2, GripVertical, BarChart3, Hammer, Menu, X } from 'lucide-react';
import { User, Development, Block, UserRole } from '../types';

interface SidebarProps {
  activePage: string;
  activeDevelopment: Development | null;
  activeBlock: Block | null;
  developments: Development[];
  reports?: any[];
  onNavigate: (page: any) => void;
  onSelectDevelopment: (dev: Development) => void;
  onSelectBlock: (dev: Development, block: Block) => void;
  onSelectExternals: (dev: Development) => void;
  onEditDevelopment: (dev: Development) => void;
  onDuplicateDevelopment: (devId: string) => void;
  onArchiveDevelopment: (devId: string) => void;
  onDeleteDevelopment: (devId: string) => void;
  onToggleFavourite: (devId: string) => void;
  onUpdateDevelopment?: (dev: Development) => void;
  user: User;
  onLogout: () => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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
  onDuplicateDevelopment,
  onArchiveDevelopment,
  onDeleteDevelopment,
  onToggleFavourite,
  onUpdateDevelopment,
  user,
  onLogout,
  activeMenuId,
  setActiveMenuId,
  mobileOpen,
  onMobileClose
}) => {
  const [expandedDevId, setExpandedDevId] = useState<string | null>(activeDevelopment?.id || null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = user.roleType === UserRole.DEPT_HEAD;

  useEffect(() => {
    if (activeDevelopment) {
      setExpandedDevId(activeDevelopment.id);
    }
  }, [activeDevelopment?.id]);

  const toggleMenu = (e: React.MouseEvent, devId: string) => {
    e.stopPropagation();
    const uniqueId = `sidebar-${devId}`;
    if (activeMenuId === uniqueId) {
      setActiveMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      // Ensure the menu displays near the button that triggered it
      setMenuPos({ top: rect.bottom + 8, left: rect.left });
      setActiveMenuId(uniqueId);
    }
  };

  const handleBlockDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.setData('text/plain', blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBlockDrop = (e: React.DragEvent, devId: string, targetBlockId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === targetBlockId) {
      setDraggedBlockId(null);
      return;
    }

    const dev = developments.find(d => d.id === devId);
    if (!dev || !onUpdateDevelopment) {
      setDraggedBlockId(null);
      return;
    }

    const blocks = [...dev.blocks];
    const sourceIdx = blocks.findIndex(b => b.id === sourceId);
    const targetIdx = blocks.findIndex(b => b.id === targetBlockId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedBlock] = blocks.splice(sourceIdx, 1);
      blocks.splice(targetIdx, 0, movedBlock);
      onUpdateDevelopment({ ...dev, blocks });
    }
    setDraggedBlockId(null);
  };

  const closeMobile = () => onMobileClose?.();

  const handleNavigate = (page: any) => {
    onNavigate(page);
    closeMobile();
  };

  const handleSelectDev = (dev: Development) => {
    onSelectDevelopment(dev);
    setExpandedDevId(dev.id);
    closeMobile();
  };

  const handleSelectBlock = (dev: Development, block: Block) => {
    onSelectBlock(dev, block);
    closeMobile();
  };

  const handleSelectExternals = (dev: Development) => {
    onSelectExternals(dev);
    closeMobile();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

    <aside className={`
      bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0 font-inter overflow-x-hidden
      fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:relative lg:translate-x-0 lg:z-30
    `}>
      <div className="p-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold italic shadow-lg shadow-blue-900/40 shrink-0">R</div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-tight">RCA Wizard</h1>
            {isAdmin && (
              <div className="mt-2.5 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md text-[8px] font-semibold uppercase tracking-widest border border-blue-500/30 w-fit">
                Admin Account
              </div>
            )}
          </div>
        </div>
        <button onClick={closeMobile} className="lg:hidden p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto custom-scrollbar pb-6">
        <div className="space-y-1">
          <button
            onClick={() => handleNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
              activePage === 'dashboard' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="font-bold text-sm">Calculation Center</span>
          </button>

          <button
            onClick={() => handleNavigate('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
              activePage === 'analytics' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <BarChart3 size={18} />
            <span className="font-bold text-sm">{isAdmin ? 'Team Insights' : 'My Productivity'}</span>
          </button>

          <button
            onClick={() => handleNavigate('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
              activePage === 'reports' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileText size={18} />
            <span className="font-bold text-sm">Report Center</span>
          </button>
        </div>

        <div className="h-10" />
        <p className="px-4 text-[9px] uppercase font-semibold text-slate-500 tracking-[0.2em] mb-3">Active Projects</p>
        
        <div className="space-y-1.5 px-1">
          {developments.filter(d => !d.isArchived).slice(0, 12).map((dev) => {
            const isSelected = activeDevelopment?.id === dev.id;
            const isExpanded = expandedDevId === dev.id;
            const uniqueMenuId = `sidebar-${dev.id}`;
            
            return (
              <div key={dev.id} className="space-y-1">
                <div className={`flex items-center rounded-xl transition-all ${isSelected ? 'bg-slate-800 ring-1 ring-slate-700 shadow-lg' : 'hover:bg-slate-800 group'}`}>
                  <button
                    onClick={() => handleSelectDev(dev)}
                    className="flex-1 flex items-center gap-3 px-4 py-2.5 min-w-0"
                  >
                    <Building2 size={14} className={isSelected ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'} />
                    <span className={`text-[11px] font-semibold truncate flex-1 text-left ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      {dev.name}
                    </span>
                  </button>
                  <div className="flex items-center pr-2 gap-0.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavourite(dev.id); }} 
                      className={`p-1 rounded hover:bg-white/10 transition-colors ${dev.isFavourite ? 'text-amber-500' : 'text-slate-700 group-hover:text-slate-500'}`}
                    >
                      <Star size={12} fill={dev.isFavourite ? "currentColor" : "none"} />
                    </button>
                    <button onClick={(e) => toggleMenu(e, dev.id)} className={`p-1 rounded transition-colors ${activeMenuId === uniqueMenuId ? 'bg-white/10 text-blue-400' : 'text-slate-700 group-hover:text-slate-500'}`}><MoreVertical size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setExpandedDevId(isExpanded ? null : dev.id); }} className="p-1 hover:bg-white/10 rounded transition-colors text-slate-700 group-hover:text-slate-500">{isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-5 pl-2 border-l border-slate-800 space-y-1 mt-1">
                    {dev.blocks.map(block => (
                      <div 
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleBlockDragStart(e, block.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleBlockDrop(e, dev.id, block.id)}
                        className={`flex items-center group/block rounded-lg transition-all ${draggedBlockId === block.id ? 'opacity-40' : 'hover:bg-white/5'}`}
                      >
                        <div className="p-1.5 cursor-grab text-slate-700 hover:text-slate-500">
                          <GripVertical size={10} />
                        </div>
                        <button 
                          onClick={() => handleSelectBlock(dev, block)}
                          className={`flex-1 flex items-center gap-2 px-1 py-1.5 text-left text-[10px] font-semibold transition-colors min-w-0 ${activeBlock?.id === block.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-200'}`}
                        >
                          <Box size={10} /> 
                          <span className="truncate flex-1">{block.name}</span>
                          {block.status === 'Completed' && <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />}
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center group/block rounded-lg transition-all hover:bg-white/5">
                        <div className="p-1.5 text-transparent">
                          <GripVertical size={10} />
                        </div>
                        <button 
                          onClick={() => handleSelectExternals(dev)}
                          className={`flex-1 flex items-center gap-2 px-1 py-1.5 text-left text-[10px] font-semibold transition-colors min-w-0 ${activePage === 'externals' && isSelected ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-200'}`}
                        >
                          <Hammer size={10} /> 
                          <span className="truncate flex-1">Site Externals</span>
                          {dev.externalsAssessment.status === 'Completed' && <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />}
                        </button>
                      </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Shared Context Menu Portal */}
      {activeMenuId && activeMenuId.startsWith('sidebar-') && (
        <div 
          ref={menuRef} 
          className="fixed w-48 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {developments.filter(d => `sidebar-${d.id}` === activeMenuId).map(dev => (
            <React.Fragment key={dev.id}>
              <button onClick={(e) => { e.stopPropagation(); onEditDevelopment(dev); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left">
                <Edit3 size={12} className="text-blue-500" /> EDIT DETAILS
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDuplicateDevelopment(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left">
                <Copy size={12} className="text-emerald-500" /> DUPLICATE
              </button>
              <button onClick={(e) => { e.stopPropagation(); onToggleFavourite(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left">
                <Star size={12} className="text-amber-500" fill={dev.isFavourite ? "currentColor" : "none"} /> {dev.isFavourite ? 'UNFAVOURITE' : 'FAVOURITE'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onArchiveDevelopment(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors uppercase tracking-widest text-left">
                <Archive size={12} className="text-slate-500" /> {dev.isArchived ? 'RESTORE' : 'ARCHIVE'}
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button onClick={(e) => { e.stopPropagation(); onDeleteDevelopment(dev.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-widest text-left">
                <Trash2 size={12} /> DELETE
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="mt-auto px-6 pb-6 pt-6 border-t border-slate-800 bg-slate-900/50">
        <button onClick={() => handleNavigate('settings')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all text-slate-500 mb-4">
          <Settings size={18} />
          <span className="font-bold text-sm">Settings</span>
        </button>
        <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-800/60 shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-slate-700 overflow-hidden border border-slate-600 shrink-0 shadow-xl">
             <img src={user.avatar} className="w-full h-full object-cover" alt="User avatar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-slate-100">{user.firstName} {user.lastName}</p>
            <p className="text-[9px] text-slate-500 truncate uppercase font-semibold tracking-widest">{user.company}</p>
          </div>
          <button onClick={onLogout} className="text-slate-600 hover:text-red-400 transition-all p-1.5 hover:bg-red-400/10 rounded-lg"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;