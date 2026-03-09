import React, { useState } from 'react';

export default function DashboardHeader({ userRole, currentView, setCurrentView, user, openEditProfileModal, handleLogout }: any) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20"><span className="text-white font-bold">E</span></div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">EduFlow</h1>
        </div>
        <div className="flex gap-8 mt-8">
          {userRole !== 'STUDENT' && (<button onClick={() => setCurrentView('students')} className={`pb-3 font-bold text-sm border-b-2 transition-all ${currentView === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Student Analytics</button>)}
          <button onClick={() => setCurrentView('courses')} className={`pb-3 font-bold text-sm border-b-2 transition-all ${currentView === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Course Management</button>
        </div>
      </div>
      
      <div className="relative">
        <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 p-1.5 pr-4 bg-white border border-slate-200 rounded-full hover:shadow-md transition-all outline-none">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          <div className="text-left hidden sm:block"><span className="block text-xs font-bold text-slate-900 uppercase tracking-wide">{userRole}</span></div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden transform animate-slide-in-down">
              <div className="p-5 bg-slate-50 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                {userRole === 'STUDENT' && <button onClick={() => {openEditProfileModal(); setShowUserMenu(false);}} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors">⚙️ Manage Academic Profile</button>}
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1">🚪 Sign Out</button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}