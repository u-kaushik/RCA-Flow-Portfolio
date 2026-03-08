import React, { useState } from 'react';
import { User as UserType, AuthType, UserPreferences, UserRole, TeamMemberStats } from '../types';
import { Shield, Mail, Building, Key, AlertCircle, TrendingUp, ChevronDown, UserCircle, Users, Target, PoundSterling, Lock, Send, CheckCircle2, UserPlus, X, Anchor } from 'lucide-react';

interface SettingsPageProps {
  user: UserType;
  onUpdate: (user: UserType) => void;
  store?: any; 
}

const REGIONS = [
  'Inner London', 'Outer London', 'South East (excluding London)', 'South West', 'West Midlands', 
  'East Midlands', 'East of England', 'Wales', 'North West', 'Yorkshire and Humberside', 
  'North East', 'Scotland', 'Northern Ireland'
];

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdate, store }) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [role, setRole] = useState(user.role || 'Surveyor');
  const [company, setCompany] = useState(user.company);
  const [resetSent, setResetSent] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const [prefs, setPrefs] = useState<UserPreferences>(user.preferences || {
    defaultRegion: 'Outer London',
    defaultLocationFactor: 1.0,
    defaultLevelCount: 3,
    defaultUpliftTypes: ['Access', 'Listed Building']
  });

  const isAdmin = user.roleType === UserRole.DEPT_HEAD;
  const isGoogleAuth = user.authType === AuthType.GOOGLE;

  const handleSave = () => {
    onUpdate({ ...user, firstName, lastName, role, company, preferences: prefs });
  };

  const updatePref = (updates: Partial<UserPreferences>) => {
    setPrefs(prev => ({ ...prev, ...updates }));
  };

  const handleSendResetEmail = () => {
    setResetSent(true);
    setTimeout(() => setResetSent(false), 5000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    setTimeout(() => {
      setIsInviting(false);
      setInviteEmail('');
      alert(`Invitation sent to ${inviteEmail}`);
    }, 1000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto pb-32 font-inter relative">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">Account Settings</h1>
      <p className="text-slate-500 mb-6 sm:mb-10 font-medium text-sm sm:text-base">Manage your professional profile and application defaults.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div className="md:col-span-2 space-y-6 sm:space-y-8">
          
          {/* Profile Section */}
          <section className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200 p-5 sm:p-8 md:p-10">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3">
              <Shield size={20} className="text-blue-600" />
              Profile Information
            </h3>

            <div className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full border rounded-2xl py-3.5 px-5 outline-none transition-all text-slate-900 font-bold bg-slate-50 border-slate-200 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full border rounded-2xl py-3.5 px-5 outline-none transition-all text-slate-900 font-bold bg-slate-50 border-slate-200 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Role / Position</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                     <UserCircle size={18} />
                   </div>
                   <input 
                    type="text" 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-5 outline-none transition-all text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10"
                    placeholder="e.g. Chartered Surveyor"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Company Name</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                     <Building size={18} />
                   </div>
                   <input 
                    type="text" 
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-5 outline-none transition-all text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Company Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Email Address</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                     {isGoogleAuth ? <Lock size={18} /> : <Mail size={18} />}
                   </div>
                   <input 
                    type="email" 
                    value={user.email}
                    readOnly={isGoogleAuth}
                    className={`w-full border rounded-2xl py-3.5 pl-12 pr-5 font-bold transition-all ${
                      isGoogleAuth 
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed italic select-none' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                  />
                  {isGoogleAuth && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                       <span className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-200 px-2 py-1 rounded-md">Account Locked</span>
                    </div>
                  )}
                </div>
              </div>

              {!isGoogleAuth && (
                <div className="flex items-center justify-start -mt-5">
                   <button 
                     onClick={handleSendResetEmail}
                     disabled={resetSent}
                     className={`flex items-center gap-2 px-4 py-0 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all ${
                       resetSent 
                        ? 'text-emerald-600 bg-emerald-50' 
                        : 'text-slate-400 hover:text-blue-600 bg-transparent hover:bg-blue-50/50'
                     }`}
                   >
                     {resetSent ? <><CheckCircle2 size={14} /> Reset Link Sent</> : <><Send size={14} /> Send Password Reset Email</>}
                   </button>
                </div>
              )}
            </div>
          </section>

          {/* Defaults Section */}
          <section className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200 p-5 sm:p-8 md:p-10">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3">
              <TrendingUp size={20} className="text-blue-600" />
              Surveyor Defaults
            </h3>
            <p className="text-xs font-semibold text-slate-400 mb-6 sm:mb-10 uppercase tracking-widest leading-relaxed">
              Configure global presets used when registering new building blocks.
            </p>

            <div className="space-y-6 sm:space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Default UK Region</label>
                    <div className="relative group/select">
                      <select 
                        value={prefs.defaultRegion}
                        onChange={e => updatePref({ defaultRegion: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10"
                      >
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Location Factor Multiplier</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={prefs.defaultLocationFactor}
                      onChange={e => updatePref({ defaultLocationFactor: parseFloat(e.target.value) || 1.0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Initial Level Count</label>
                    <input 
                      type="number" 
                      value={prefs.defaultLevelCount}
                      onChange={e => updatePref({ defaultLevelCount: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2 px-1">Project Base Rate</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">£</span>
                      <input 
                        type="number" 
                        defaultValue={2600}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-10 pr-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      />
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Admin Team Section */}
          {isAdmin && store && (
            <section className="bg-slate-900 text-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-slate-800 p-5 sm:p-8 md:p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
               <div className="flex items-center justify-between mb-8 relative z-10">
                 <div>
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <Users size={24} className="text-blue-400" />
                      Team Management
                    </h3>
                    <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-[0.2em] mt-1">Department Oversight</p>
                 </div>
               </div>

               <div className="space-y-4 mb-10 relative z-10">
                  {store.teamMembers.map((member: TeamMemberStats) => (
                    <div key={member.userId} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                             <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white">{member.name}</p>
                             <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{member.role}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Status</p>
                            <div className="flex items-center gap-1.5 justify-end">
                               <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                               <span className="text-[10px] font-bold text-slate-400">{member.status}</span>
                            </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="relative z-10 pt-8 border-t border-white/10">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Invite New Member</h4>
                  <form onSubmit={handleInvite} className="flex gap-3">
                    <div className="relative flex-1">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="email" 
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="surveyor@company.com"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isInviting || !inviteEmail}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      {isInviting ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Send Invite</>}
                    </button>
                  </form>
               </div>
            </section>
          )}

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave}
              className="bg-slate-900 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-bold uppercase text-[11px] sm:text-[12px] tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 w-full sm:w-auto"
            >
              Update All Settings
            </button>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
           <div className="bg-slate-900 text-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden shadow-2xl">
              <div className="relative z-10 text-center">
                 <div className="w-24 h-24 bg-slate-700 rounded-[2rem] mx-auto mb-6 border-2 border-slate-600 overflow-hidden shadow-2xl">
                    <img src={user.avatar || `https://picsum.photos/seed/${user.id}/100/100`} alt={firstName} className="w-full h-full object-cover" />
                 </div>
                 <h4 className="font-bold text-2xl tracking-tight leading-none mb-2">{firstName} {lastName}</h4>
                 <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-[0.2em] mb-2">{role}</p>
                 <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">{user.company}</p>
                 <div className="mt-8 inline-block px-4 py-2 bg-slate-800 rounded-xl text-[9px] uppercase font-semibold tracking-[0.2em] text-blue-400 border border-slate-700 shadow-inner">
                   {user.authType} VERIFIED
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[70px] opacity-20 -mr-16 -mt-16"></div>
           </div>

           <div className="bg-blue-600 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 text-center">
                 <h4 className="font-semibold text-xs uppercase tracking-widest mb-4 opacity-70">Security Protocol</h4>
                 <p className="text-[10px] font-medium opacity-80 leading-relaxed">
                   Your profile and preferences are encrypted and synchronized across the enterprise grid using standard bank-grade protocols.
                 </p>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl -mb-12 -mr-12"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Internal utility for the form
const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`lucide lucide-loader-2 ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default SettingsPage;