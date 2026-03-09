import React, { useState } from 'react';
import Toast from './Toast';

export default function OnboardingScreen({ submitOnboarding, handleLogout, isOnboarding, toast }: any) {
  const [data, setData] = useState({ age: 20, admission: 120.0, tuition: 1, scholarship: 0, debtor: 0 });

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative">
      <Toast toast={toast} />
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700">
        <div className="text-center mb-8"><h1 className="text-3xl font-bold text-slate-900">Welcome to EduFlow</h1><p className="text-slate-500 mt-2">Please complete your academic profile.</p></div>
        <form onSubmit={(e) => submitOnboarding(e, data)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold mb-1">Age</label><input type="number" value={data.age} onChange={(e) => setData({...data, age: Number(e.target.value)})} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-semibold mb-1">Admission Score</label><input type="number" step="0.1" value={data.admission} onChange={(e) => setData({...data, admission: Number(e.target.value)})} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" required /></div>
          </div>
          <div><label className="block text-sm font-semibold mb-1">Tuition Status</label><select value={data.tuition} onChange={(e) => setData({...data, tuition: Number(e.target.value)})} className="w-full bg-slate-50 rounded-xl p-3 outline-none"><option value={1}>Up to Date</option><option value={0}>In Debt</option></select></div>
          <div><label className="block text-sm font-semibold mb-1">Scholarship</label><select value={data.scholarship} onChange={(e) => setData({...data, scholarship: Number(e.target.value)})} className="w-full bg-slate-50 rounded-xl p-3 outline-none"><option value={1}>Yes (Active)</option><option value={0}>No</option></select></div>
          <div><label className="block text-sm font-semibold mb-1">Institutional Debt</label><select value={data.debtor} onChange={(e) => setData({...data, debtor: Number(e.target.value)})} className="w-full bg-slate-50 rounded-xl p-3 outline-none"><option value={1}>Yes (Owes Money)</option><option value={0}>No (Clear)</option></select></div>
          <button type="submit" disabled={isOnboarding} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">{isOnboarding ? "Saving..." : "Complete Profile"}</button>
          <button type="button" onClick={handleLogout} className="w-full mt-2 text-slate-400 text-sm font-semibold hover:text-slate-600">Sign Out</button>
        </form>
      </div>
    </main>
  );
}