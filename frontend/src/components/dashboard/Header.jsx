import React from 'react';
import { ShieldCheck, Menu } from 'lucide-react';

export default function Header({ nickname, onOpenSidebar }) {
  return (
    <header className="w-full h-16 bg-[#0d1322]/95 backdrop-blur-md px-4 md:px-8 flex items-center justify-between z-30 shrink-0">
      
      
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={onOpenSidebar}
          className="md:hidden h-10 w-10 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition flex items-center justify-center shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center">
          <span className="text-white font-black tracking-widest text-lg">
            NEXUS
          </span>
        </div>
      </div>

      
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-[#121826] px-3.5 py-1.5 rounded-full border border-gray-800">
          <div className="w-7 h-7 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-xs font-bold text-gray-950 shadow-inner shrink-0">
            {nickname ? nickname.slice(0, 1) : 'U'}
          </div>
          <span className="text-xs md:text-sm font-medium text-gray-200 truncate">
            <strong className="text-emerald-400">{nickname}</strong> 님
          </span>
        </div>
      </div>

    </header>
  );
}