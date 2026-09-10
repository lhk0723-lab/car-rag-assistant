import React from 'react';
import { Wrench, Sparkles, FileText, History, Settings } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, carModel }) {
  return (
    <aside className="w-64 bg-[#0d1322] border-r border-gray-800/80 flex flex-col justify-between hidden md:flex shrink-0">
      <div>
        <div className="flex items-center gap-3.5 px-4 py-4 m-3 bg-[#131b2e] rounded-xl border border-emerald-500/30 shadow-lg">
          <div className="p-2.5 bg-emerald-500 rounded-xl shadow-md text-gray-950 font-black shrink-0 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-lg font-black tracking-widest leading-none m-0 p-0 text-white" style={{ color: '#ffffff' }}>NEXUS</h1>
            <span className="text-[11px] text-emerald-400 font-bold tracking-tight mt-1 block">AI Maintenance</span>
          </div>
        </div>

        <nav className="p-4 space-y-1.5">
          <button onClick={() => setActiveTab('assistant')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'assistant' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
            <Sparkles className="w-5 h-5" /> AI 정비 어시스턴트
          </button>
          <button onClick={() => setActiveTab('manuals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'manuals' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
            <FileText className="w-5 h-5" /> 정비 매뉴얼 검색
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'history' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
            <History className="w-5 h-5" /> 정비 진단 이력
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
            <Settings className="w-5 h-5" /> 시스템 설정
          </button>
        </nav>
      </div>

      <div className="p-4 m-4 bg-[#090d16] rounded-xl border border-gray-800/80 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">내 차량 모델</span>
          <span className="text-[11px] text-emerald-400 font-bold truncate max-w-[120px]">{carModel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">시스템 상태</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </div>
    </aside>
  );
}