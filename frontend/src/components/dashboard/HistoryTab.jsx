import React from 'react';
import { History } from 'lucide-react';

export default function HistoryTab({ diagnosisHistory }) {
  return (
    <div className="flex-1 flex flex-col bg-[#0d1322]/70 border border-gray-800/80 rounded-2xl shadow-2xl p-6 overflow-y-auto space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <History className="text-emerald-400" /> 정비 진단 및 검색 이력
      </h3>
      <div className="space-y-3">
        {diagnosisHistory.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">저장된 진단 이력이 없습니다.</p>
        ) : (
          diagnosisHistory.map((item, index) => (
            <div key={index} className="p-4 bg-[#090d16] border border-gray-800 rounded-xl flex items-center justify-between shadow">
              <div>
                <span className="text-[11px] text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">{item.type}</span>
                <h4 className="text-sm font-semibold text-gray-200 mt-1.5">{item.title}</h4>
                <span className="text-[11px] text-gray-500 mt-1 block">{item.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}