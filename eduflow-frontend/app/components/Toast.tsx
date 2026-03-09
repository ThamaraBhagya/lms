import React from 'react';

interface ToastProps {
  toast: { msg: string; type: 'success' | 'error' } | null;
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl text-sm font-bold text-white transition-all z-50 animate-slide-in-down ${toast.type === 'error' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-slate-900 shadow-slate-900/20'}`}>
      {toast.msg}
    </div>
  );
}