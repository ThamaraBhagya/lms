import React, { useState } from 'react';
import Toast from './Toast';

interface AuthProps {
  handleLogin: (e: React.FormEvent, email: string, pass: string) => void;
  handleRegister: (e: React.FormEvent, data: any) => void;
  toast: any;
}

export default function AuthScreen({ handleLogin, handleRegister, toast }: AuthProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regData, setRegData] = useState({ firstName: "", lastName: "", email: "", password: "", role: "STUDENT" });

  return (
    <main className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <Toast toast={toast} />
      
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/40 z-10 relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-600/30"><span className="text-white font-bold text-xl">E</span></div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">EduFlow</h1>
          <p className="text-slate-600 mt-2 text-sm font-medium">Next-Generation Learning Analytics</p>
        </div>

        <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl mb-8 border border-white/60 shadow-sm">
          <button onClick={() => setAuthMode('login')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}>Sign In</button>
          <button onClick={() => setAuthMode('register')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}>Register</button>
        </div>
        
        {authMode === 'login' ? (
          <form onSubmit={(e) => handleLogin(e, email, password)} className="space-y-5" autoComplete="off">
            <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 transition-all shadow-sm" required /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 transition-all shadow-sm" required /></div>
            <button type="submit" className="w-full mt-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-95">Access Dashboard</button>
          </form>
        ) : (
          <form onSubmit={(e) => handleRegister(e, regData)} className="space-y-4" autoComplete="off">
             <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">First Name</label><input type="text" required onChange={(e) => setRegData({...regData, firstName: e.target.value})} className="w-full bg-white/60 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Last Name</label><input type="text" required onChange={(e) => setRegData({...regData, lastName: e.target.value})} className="w-full bg-white/60 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            </div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label><input type="email" required autoComplete="off" onChange={(e) => setRegData({...regData, email: e.target.value})} className="w-full bg-white/60 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label><input type="password" required minLength={6} autoComplete="new-password" onChange={(e) => setRegData({...regData, password: e.target.value})} className="w-full bg-white/60 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Role</label><select onChange={(e) => setRegData({...regData, role: e.target.value})} className="w-full bg-white/60 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"><option value="STUDENT">Student</option><option value="LECTURER">Lecturer / Faculty</option></select></div>
            <button type="submit" className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all active:scale-95">Create Account</button>
          </form>
        )}
      </div>
    </main>
  );
}