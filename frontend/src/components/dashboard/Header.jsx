import React from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';

export default function Header({ carModel, nickname, handleLogout }) {
  return (
    <header className="h-16 bg-[#0d1322]/60 backdrop-blur-md border-b border-gray-800/80 px-8 flex items-center justify-between z-10">
      <h2 className="text-sm font-semibold tracking-tight text-gray-200 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" /> 차량 정비 도우미 
        <span className="text-[11px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold">{carModel}</span>
      </h2>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5 bg-[#121826] px-3.5 py-1.5 rounded-full border border-gray-800">
          <div className="w-7 h-7 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-xs font-bold text-gray-950 shadow-inner">
            {nickname ? nickname.slice(0, 1) : 'U'}
          </div>
          <span className="text-sm font-medium text-gray-200"><strong className="text-emerald-400">{nickname}</strong> 님</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3.5 py-2 bg-[#121826] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 border border-gray-800 text-gray-300 text-xs font-medium rounded-xl transition duration-200">
          <LogOut className="w-3.5 h-3.5" /> 로그아웃
        </button>
      </div>
    </header>
  );
}