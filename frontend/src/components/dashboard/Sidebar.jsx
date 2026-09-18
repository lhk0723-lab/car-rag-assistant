import React from 'react';
import { Wrench, Sparkles, FileText, History, Settings, LogOut, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, carModel, handleLogout, isOpen, onClose }) {
  return (
    <>
      {/* 모바일 백드롭 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* 사이드바 본체 */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        -left-[1px] md:left-0
        w-64 bg-[#0d1322] border-r border-gray-800 
        flex flex-col justify-between shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* 상단 로고 박스 영역 */}
          <div className="flex items-center justify-between px-4 py-4 bg-[#131b2e] border-b border-gray-800 shadow-lg">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 bg-emerald-500 rounded-xl shadow-md text-gray-950 font-black shrink-0 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-lg font-black tracking-widest leading-none m-0 p-0 text-white">NEXUS</h1>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5">
            <button onClick={() => { setActiveTab('assistant'); onClose?.(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'assistant' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
              <Sparkles className="w-5 h-5" /> AI 정비 어시스턴트
            </button>
            <button onClick={() => { setActiveTab('manuals'); onClose?.(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'manuals' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
              <FileText className="w-5 h-5" /> 정비 매뉴얼 검색
            </button>
            <button onClick={() => { setActiveTab('history'); onClose?.(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'history' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
              <History className="w-5 h-5" /> 정비 진단 이력
            </button>
            <button onClick={() => { setActiveTab('settings'); onClose?.(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
              <Settings className="w-5 h-5" /> 시스템 설정
            </button>
          </nav>
        </div>

        {/* 하단 차량 정보 및 로그아웃 영역 */}
        <div className="p-3 m-3 bg-[#090d16] rounded-xl border border-gray-800 shadow-inner space-y-3">
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between">
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

          {/* 하단 로그아웃 버튼 */}
<button 
  type="button"
  onClick={handleLogout}
  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition cursor-pointer relative z-50"
>
  <LogOut className="w-3.5 h-3.5" /> 로그아웃
</button>
        </div>
      </aside>
    </>
  );
}