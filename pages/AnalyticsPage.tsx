import React, { useState } from 'react';
import { TrendingUp, Users, PoundSterling, FileBox, Zap, ArrowUpRight, Search, Filter, FileText, ChevronDown } from 'lucide-react';
import { UserRole, TeamMemberStats } from '../types';

interface AnalyticsPageProps {
  store: any;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ store }) => {
  const [view, setView] = useState<'department' | 'personal'>('department');
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Online' | 'Offline'>('All');
  
  const isAdmin = store.user?.roleType === UserRole.DEPT_HEAD;
  
  const deptStats = store.getDepartmentStats();
  const personalStats = store.getPersonalStats();

  const activeView = (view === 'department' && isAdmin) ? 'department' : 'personal';

  const filteredTeam = deptStats.team.filter((member: TeamMemberStats) => {
    const matchesSearch = member.name.toLowerCase().includes(localSearch.toLowerCase()) || 
                         member.role.toLowerCase().includes(localSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto pb-32 font-inter">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Intelligence Console</h1>
          <p className="text-slate-600 mt-1 font-medium text-xs sm:text-sm">Tracking departmental throughput and fee generation.</p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 sm:gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-fit shrink-0">
            <button onClick={() => setView('department')} className={`px-3 sm:px-6 py-2 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all ${view === 'department' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Department</button>
            <button onClick={() => setView('personal')} className={`px-3 sm:px-6 py-2 rounded-xl font-semibold text-[10px] uppercase tracking-widest transition-all ${view === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>My Performance</button>
          </div>
        )}
      </header>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center"><PoundSterling size={20} /></div>
            <span className="hidden sm:flex items-center gap-1 text-emerald-500 text-xs font-bold"><ArrowUpRight size={14} /> 12%</span>
          </div>
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Gross Fees</p>
          <h4 className="text-xl sm:text-3xl font-bold text-slate-900">£{(activeView === 'department' ? deptStats.totalFees : personalStats.totalFees).toLocaleString()}</h4>
        </div>

        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center"><FileBox size={20} /></div>
            <span className="hidden sm:flex items-center gap-1 text-emerald-500 text-xs font-bold"><ArrowUpRight size={14} /> 4%</span>
          </div>
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">RCAs Finalized</p>
          <h4 className="text-xl sm:text-3xl font-bold text-slate-900">{activeView === 'department' ? deptStats.totalRCAs : personalStats.finalizedCount}</h4>
        </div>

        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center"><Zap size={20} /></div>
            <span className="hidden sm:flex items-center gap-1 text-slate-400 text-xs font-bold">Stable</span>
          </div>
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Avg. Throughput</p>
          <h4 className="text-xl sm:text-3xl font-bold text-slate-900">{activeView === 'department' ? '4.2d' : '3.8d'}</h4>
        </div>

        <div className="bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4 text-white">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center"><Users size={20} /></div>
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Team Members</p>
            <h4 className="text-xl sm:text-3xl font-bold text-white">{deptStats.memberCount}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Surveyor Productivity</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                <div className="relative flex-1 w-full">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search surveyors..."
                     value={localSearch}
                     onChange={(e) => setLocalSearch(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                   />
                </div>
                <div className="relative shrink-0 w-full sm:w-48">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl py-3 pl-4 pr-10 text-[10px] font-semibold uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Surveyor</th>
                    <th className="px-6 py-5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest text-center">Finalized</th>
                    <th className="px-6 py-5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest text-right">Total Fees</th>
                    <th className="px-10 py-5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest text-right">Last Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeam.map((member: TeamMemberStats) => (
                    <tr key={member.userId} className="hover:bg-slate-50/50 transition-all cursor-pointer group">
                      <td className="px-10 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative">
                            <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${member.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{member.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold">{member.rcasCompleted}</span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-slate-900 text-sm">
                        £{member.totalFeesGenerated.toLocaleString()}
                      </td>
                      <td className="px-10 py-5 text-right">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">{member.lastActive}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredTeam.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-20 text-center">
                        <Users size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching surveyors found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-blue-600 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <h4 className="text-sm font-bold uppercase tracking-[0.3em] mb-6 opacity-60">Insight summary</h4>
            <div className="space-y-8 relative z-10">
              <div>
                <p className="text-3xl font-bold mb-1">Top Tier</p>
                <p className="text-[11px] font-medium opacity-80 leading-relaxed">Emma Wilson is currently leading departmental fee generation with 15 finalized assessments this quarter.</p>
              </div>
              <div className="pt-6 border-t border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Quarterly Target</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest">82%</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <h4 className="font-bold text-[11px] uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-3">
               <TrendingUp size={16} className="text-emerald-500" /> Regional Hotspots
             </h4>
             <div className="space-y-6">
                {[
                  { region: 'Inner London', count: 42, color: 'bg-blue-500' },
                  { region: 'Outer London', count: 28, color: 'bg-emerald-500' },
                  { region: 'South East', count: 12, color: 'bg-amber-500' }
                ].map(item => (
                  <div key={item.region} className="space-y-2">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-700">{item.region}</span>
                       <span className="text-[10px] font-semibold text-slate-400">{item.count}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color}`} style={{ width: `${item.count}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;