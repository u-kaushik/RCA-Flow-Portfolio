import React, { useState } from 'react';
import { User as UserType, AuthType, UserPreferences } from '../types';
import { Shield, Mail, Building, Key, AlertCircle, TrendingUp, LayoutGrid, Hash, Ruler, Info, ChevronDown, UserCircle } from 'lucide-react';

interface SettingsPageProps {
  user: UserType;
  onUpdate: (user: UserType) => void;
}

const REGIONS = [
  'Inner London', 'Outer London', 'South East (excluding London)', 'South West', 'West Midlands', 
  'East Midlands', 'East of England', 'Wales', 'North West', 'Yorkshire and Humberside', 
  'North East', 'Scotland', 'Northern Ireland'
];

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdate }) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [role, setRole] = useState(user.role || 'Surveyor');
  const [company, setCompany] = useState(user.company);
  const [prefs, setPrefs] = useState<UserPreferences>(user.preferences || {
    defaultRegion: 'Outer London',
    defaultLocationFactor: 1.0,
    defaultLevelCount: 3,
    defaultUpliftTypes: ['Access', 'Listed Building']
  });

  const isGoogleAuth = user.authType === AuthType.GOOGLE;

  const handleSave = () => {
    onUpdate({ ...user, firstName, lastName, role, company, preferences: prefs });
  };

  const updatePref = (updates: Partial<UserPreferences>) => {
    setPrefs(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto pb-32">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
      <p className="text-slate-500 mb-10">Manage your professional profile and application defaults.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              Profile Information
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    disabled={isGoogleAuth}
                    className={`w-full border rounded-xl py-3 px-4 outline-none transition-all text-slate-900 font-bold ${
                      isGoogleAuth ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    disabled={isGoogleAuth}
                    className={`w-full border rounded-xl py-3 px-4 outline-none transition-all text-slate-900 font-bold ${
                      isGoogleAuth ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role / Position</label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                     <UserCircle size={18} />
                   </div>
                   <input 
                    type="text" 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Surveyor"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                     <Building size={18} />
                   </div>
                   <input 
                    type="text" 
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    disabled={isGoogleAuth}
                    className={`w-full border rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-slate-900 font-bold ${
                      isGoogleAuth ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                     <Mail size={18} />
                   </div>
                   <input 
                    type="email" 
                    value={user.email}
                    disabled
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Key size={20} className="text-blue-600" />
              Security
            </h3>
            
            {isGoogleAuth ? (
              <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 text-blue-800 border border-blue-100">
                 <AlertCircle size={20} className="shrink-0" />
                 <div>
                    <p className="font-bold text-sm">Federated Authentication</p>
                    <p className="text-xs opacity-80 mt-1">You are signed in via Google. Please manage your password and account security settings through your Google Account portal.</p>
                 </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <p className="text-sm text-slate-500 font-medium">Regularly update your password to maintain security standards.</p>
                 <button className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">
                    Change Password
                 </button>
              </div>
            )}
          </section>

          {/* Surveyor Defaults */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Surveyor Defaults
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-8 uppercase tracking-widest leading-relaxed">
              Configure global presets used when registering new building blocks.
            </p>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Default UK Region</label>
                    <div className="relative group/select">
                      <select 
                        value={prefs.defaultRegion}
                        onChange={e => updatePref({ defaultRegion: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10"
                      >
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Location Factor (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={prefs.defaultLocationFactor}
                      onChange={e => updatePref({ defaultLocationFactor: parseFloat(e.target.value) || 1.0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Initial Level Count</label>
                    <input 
                      type="number" 
                      value={prefs.defaultLevelCount}
                      onChange={e => updatePref({ defaultLevelCount: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Project Base Rate</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">£</span>
                      <input 
                        type="number" 
                        defaultValue={2600}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      />
                    </div>
                  </div>
               </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Update All Settings
            </button>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden">
              <div className="relative z-10 text-center">
                 <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 border-2 border-slate-600 overflow-hidden shadow-2xl">
                    <img src={user.avatar || `https://picsum.photos/seed/${user.id}/100/100`} alt={firstName} className="w-full h-full object-cover" />
                 </div>
                 <h4 className="font-black text-xl tracking-tight">{firstName} {lastName}</h4>
                 <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-1 mb-2">{role}</p>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{user.company}</p>
                 <div className="mt-6 inline-block px-4 py-1.5 bg-slate-800 rounded-full text-[9px] uppercase font-black tracking-[0.2em] text-blue-400 border border-slate-700">
                   {user.authType} Verified
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16"></div>
           </div>

           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
             <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-900 mb-6">Support Resources</h4>
             <ul className="space-y-4">
               {[
                 { label: 'Help Center', icon: <Info size={14} /> },
                 { label: 'Standard Rates Guide', icon: <TrendingUp size={14} /> },
                 { label: 'Report Builder Docs', icon: <FileBadge size={14} /> },
                 { label: 'Contact Support', icon: <Mail size={14} /> }
               ].map(item => (
                 <li key={item.label} className="text-sm text-slate-500 hover:text-blue-600 cursor-pointer font-bold transition-all flex items-center gap-3">
                   <span className="text-slate-300 group-hover:text-blue-400">{item.icon}</span>
                   {item.label}
                 </li>
               ))}
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

const FileBadge: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4c0-1.1.9-2 2-2h8.5L20 7.5V22H4z"/><polyline points="14 2 14 8 20 8"/><path d="M16.1 13H7.9"/><path d="M16.1 17H7.9"/><path d="M10.1 9H7.9"/></svg>
);

export default SettingsPage;