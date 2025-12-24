import React, { useState } from 'react';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { AuthType, User } from '../types';

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
      company: 'BuildTech Surveys Ltd',
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
      company: 'Surveyor Partners',
      email: 'j.doe@gmail.com',
      authType: AuthType.GOOGLE,
      avatar: 'https://picsum.photos/seed/google/100/100'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
              <span className="text-3xl font-black text-white italic">R</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">RCA Wizard</h1>
            <p className="text-slate-500 mt-2">Professional Surveying & Valuation</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button className="w-full bg-slate-900 text-white rounded-xl py-3.5 font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <LogIn size={20} />
              Sign In
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl py-3.5 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Chrome size={20} className="text-red-500" />
              Sign in with Google
            </button>

            <button 
              onClick={handleDevLogin}
              className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-bold hover:bg-blue-700 transition-colors mt-8 flex items-center justify-center gap-2"
            >
              One-click Dev Login
            </button>
          </div>
        </div>
        <p className="text-center mt-8 text-slate-400 text-sm">
          &copy; 2025 RCA Wizard Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;