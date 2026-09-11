import React from 'react';
import { History, Trash2, CheckSquare, Square } from 'lucide-react';

export default function HistoryTab({ 
  diagnosisHistory = [], 
  onDeleteItem, 
  onSelectItem, 
  selectedHistoryIds = [], 
  onToggleSelectHistory, 
  onToggleSelectAll, 
  onDeleteSelected, 
  onDeleteAll 
}) {
  const safeHistory = Array.isArray(diagnosisHistory) ? diagnosisHistory : [];
  const allIds = safeHistory.map(item => item.id);
  const isAllSelected = safeHistory.length > 0 && selectedHistoryIds.length === safeHistory.length;

  return (
    <div className="flex-1 flex flex-col bg-[#0d1322]/70 border border-gray-800/80 rounded-2xl shadow-2xl p-6 overflow-y-auto space-y-4">
      
      {/* 상단 타이틀 및 다중 제어 버튼 영역 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="text-emerald-400" /> 정비 진단 및 검색 이력
        </h3>

        {safeHistory.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* 전체 선택 버튼 */}
            <button
              onClick={() => onToggleSelectAll && onToggleSelectAll(allIds)}
              className="text-xs text-gray-300 hover:text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 bg-[#090d16] border border-gray-800 rounded-lg transition"
            >
              {isAllSelected ? <CheckSquare size={14} className="text-emerald-400" /> : <Square size={14} />}
              전체 선택 ({selectedHistoryIds.length}/{safeHistory.length})
            </button>

            {/* 선택 삭제 버튼 */}
            <button
              onClick={() => {
                if (selectedHistoryIds.length === 0) {
                  alert("선택된 이력이 없습니다.");
                  return;
                }
                if (window.confirm(`선택한 ${selectedHistoryIds.length}개의 이력을 정말 삭제하시겠습니까?`)) {
                  onDeleteSelected && onDeleteSelected();
                }
              }}
              className="text-xs text-red-400 hover:text-white hover:bg-red-500/20 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg transition flex items-center gap-1"
            >
              <Trash2 size={14} /> 선택 삭제
            </button>

            {/* 전체 삭제 버튼 */}
            <button
              onClick={() => {
                if (window.confirm("정말 모든 이력을 삭제하시겠습니까?")) {
                  onDeleteAll && onDeleteAll();
                }
              }}
              className="text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 bg-[#090d16] border border-gray-800 rounded-lg transition"
            >
              전체 삭제
            </button>
          </div>
        )}
      </div>

      {/* 이력 리스트 영역 */}
      <div className="space-y-3">
        {safeHistory.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">저장된 진단 이력이 없습니다.</p>
        ) : (
          safeHistory.map((item) => {
            const isSelected = selectedHistoryIds.includes(item.id);

            return (
              <div
                key={item.id || item.date}
                onClick={() => onSelectItem && onSelectItem(item)}
                className={`p-4 bg-[#090d16] border rounded-xl flex items-center justify-between shadow transition cursor-pointer group ${
                  isSelected ? 'border-emerald-500 bg-emerald-500/5' : 'border-gray-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* 개별 체크박스 */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectHistory && onToggleSelectHistory(item.id);
                    }}
                    className="text-gray-400 hover:text-emerald-400 transition"
                  >
                    {isSelected ? <CheckSquare size={18} className="text-emerald-400" /> : <Square size={18} />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                      {item.type || '부품 진단'}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-200 mt-1.5 truncate group-hover:text-emerald-300 transition">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-gray-500 block">{item.date}</span>
                  </div>
                </div>
                
                {/* 개별 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("정말 이 이력을 삭제하시겠습니까?")) {
                      onDeleteItem && onDeleteItem(item.id);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition ml-2"
                  title="이력 삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}