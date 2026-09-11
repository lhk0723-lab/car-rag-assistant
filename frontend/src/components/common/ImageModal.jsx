import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ImageModal({ modalData, setModalData, handleModalPrev, handleModalNext }) {
  // 배율 상태 (100 ~ 500)
  const [scale, setScale] = useState(100);

  // 드래그(Pan) 이동 상태
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  // 사진이 바뀌거나 모달이 닫힐 때 줌과 위치 초기화
  useEffect(() => {
    setScale(100);
    setPosition({ x: 0, y: 0 });
  }, [modalData.index, modalData.isOpen]);

  if (!modalData.isOpen) return null;

  // 마우스 드래그 시작
  const handleMouseDown = (e) => {
    if (scale === 100) return; // 100%일 때는 드래그 필요 없음
    setIsDragging(true);
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  // 마우스 움직일 때 이미지 이동
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y
    });
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#0d1322] border border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 shadow-2xl overflow-hidden">
        
        {/* 상단 우측 닫기 버튼 */}
        <div className="absolute top-5 right-5 flex items-center gap-3 z-30">
          <span className="text-[11px] text-gray-400 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800 hidden sm:inline-block">
            {scale > 100 ? '✋ 확대된 상태에서 마우스로 이미지를 끌어당겨 보세요' : '💡 아래 슬라이더로 100% ~ 500% 확대가 가능합니다'}
          </span>
          <button 
            onClick={() => setModalData({ isOpen: false, list: [], index: 0 })}
            className="p-2.5 bg-gray-800/80 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 rounded-xl transition shadow"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 메인 이미지 영역 (드래그 지원) */}
        <div 
          className={`relative w-full flex-1 flex items-center justify-center overflow-hidden my-2 select-none ${scale > 100 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {modalData.list.length > 1 && scale === 100 && (
            <button 
              onClick={handleModalPrev} 
              className="absolute left-4 p-3 bg-[#121826]/90 hover:bg-emerald-500 text-white hover:text-gray-950 border border-gray-700 rounded-full transition shadow-xl z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* 이미지 렌더링 (transform 적용) */}
<div className="w-full h-full flex items-center justify-center px-12 overflow-hidden">
  {(() => {
    const rawUrl = modalData.list[modalData.index] || "";
    const finalSrc = rawUrl.startsWith("http") ? rawUrl : `http://localhost:8000${rawUrl}`;
    return (
      <img 
        src={finalSrc} 
        alt="확대 이미지" 
        draggable="false"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale / 100})`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out'
        }}
        className="max-h-full max-w-full object-contain rounded-lg shadow-lg" 
      />
    );
  })()}
</div>

          {modalData.list.length > 1 && scale === 100 && (
            <button 
              onClick={handleModalNext} 
              className="absolute right-4 p-3 bg-[#121826]/90 hover:bg-emerald-500 text-white hover:text-gray-950 border border-gray-700 rounded-full transition shadow-xl z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* 하단 컨트롤 바 (슬라이더 및 인덱스) */}
        <div className="flex flex-wrap items-center justify-between w-full mt-3 pt-3 border-t border-gray-800/80 z-20 gap-4">
          
          {/* 사진 순번 뱃지 */}
          {modalData.list.length > 1 ? (
            <div className="text-xs text-emerald-400 font-bold bg-[#090d16] px-4 py-2 rounded-xl border border-gray-800">
              {modalData.index + 1} / {modalData.list.length} 번째 사진
            </div>
          ) : <div />}

          {/* 슬라이드 줌 컨트롤러 (100% ~ 500%) */}
          <div className="flex items-center gap-3 bg-[#090d16] px-4 py-2 rounded-xl border border-gray-800 mx-auto">
            <ZoomOut className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => { setScale(100); setPosition({x:0, y:0}); }} title="기본 크기로 초기화" />
            <input 
              type="range" 
              min="100" 
              max="500" 
              step="10" 
              value={scale} 
              onChange={(e) => {
                const newScale = Number(e.target.value);
                setScale(newScale);
                if (newScale === 100) setPosition({ x: 0, y: 0 }); // 100%로 돌아오면 위치 초기화
              }}
              className="w-36 accent-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-emerald-400 w-12 text-right">{scale}%</span>
            
            <button 
              onClick={() => { setScale(100); setPosition({ x: 0, y: 0 }); }}
              className="ml-2 p-1.5 bg-gray-800 hover:bg-emerald-500 hover:text-gray-950 text-gray-300 rounded-lg transition text-[11px] flex items-center gap-1"
              title="초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 초기화
            </button>
          </div>

          <div className="w-20 hidden sm:block" /> {/* 우측 균형 맞춤용 공백 */}
        </div>

      </div>
    </div>
  );
}