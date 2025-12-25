import React, { useState } from 'react';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { AuthType, User, UserRole } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDevLogin = () => {
    onLogin({
      id: 'dev-user',
      firstName: 'Senior',
      lastName: 'Surveyor',
      role: 'Chartered Building Surveyor',
      roleType: UserRole.DEPT_HEAD,
      company: 'BuiltTech Global',
      tenantId: 'tenant-123',
      email: 'dev@survey.com',
      authType: AuthType.EMAIL,
      avatar: 'https://picsum.photos/seed/dev/100/100'
    });
  };

  const handleGoogleLogin = () => {
    onLogin({
      id: 'google-user',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Surveyor',
      roleType: UserRole.SURVEYOR,
      company: 'Surveyor Partners',
      tenantId: 'tenant-123',
      email: 'j.doe@gmail.com',
      authType: AuthType.GOOGLE,
      avatar: 'https://picsum.photos/seed/google/100/100'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden font-inter">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-6">
              <span className="text-3xl font-black text-white italic">R</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">RCA Wizard</h1>
            <p className="text-slate-500 mt-2 font-medium">Professional Surveying & Valuation</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-2 px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-900 font-bold"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-2 px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-900 font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold uppercase text-[11px] tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
              <LogIn size={18} />
              Sign In
            </button>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-4 text-slate-400">Or continue with</span>
              </div>
            </div>

            <button onClick={handleGoogleLogin} className="w-full bg-white border border-slate-200 text-slate-700 rounded-2xl py-4 font-bold uppercase text-[11px] tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
              <Chrome size={20} className="text-red-500" />
              Sign in with Google
            </button>

            <button onClick={handleDevLogin} className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold uppercase text-[11px] tracking-[0.2em] hover:bg-blue-700 transition-all mt-8 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
              One-click Admin Login
            </button>
          </div>
        </div>
        <p className="text-center mt-10 text-slate-500 text-[10px] font-semibold uppercase tracking-widest opacity-50">
          &copy; 2025 RCA Wizard Pro. Enterprise Grid.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;