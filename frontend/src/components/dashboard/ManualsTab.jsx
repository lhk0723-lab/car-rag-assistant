import React, { useRef, useEffect } from 'react';
import { FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';

function ThumbnailScrollBox({ imgList, currentIdx, onSelectThumb }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const buttons = containerRef.current.querySelectorAll('button');
      const selectedEl = buttons[currentIdx];
      if (selectedEl) {
        selectedEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  }, [currentIdx]);

  return (
    <div className="w-full mt-3 pt-2 border-t border-gray-800/80">
      <div className="w-full overflow-x-auto pb-1 no-scrollbar" ref={containerRef}>
        <div className="flex items-center gap-2 px-3 min-w-max justify-start">
          {imgList.map((thumb, tIdx) => (
            <button
              key={tIdx}
              type="button"
              onClick={() => onSelectThumb(tIdx)}
              className={`w-12 h-10 rounded-lg overflow-hidden border-2 transition shrink-0 ${currentIdx === tIdx ? 'border-emerald-400 scale-105 shadow-md ring-2 ring-emerald-500/20' : 'border-gray-700 opacity-60 hover:opacity-100'}`}
            >
              <img src={thumb.startsWith('http') ? thumb : `http://localhost:8000/${thumb}`} alt="썸네일" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ManualsTab({
  carModel,
  manualQuery,
  setManualQuery,
  executeManualSearch,
  searchingManual,
  manualResults,
  slideIndexes,
  handlePrevSlide,
  handleNextSlide,
  setSlideIndexes,
  openImageModal
}) {
  // 💡 메인 스크롤 박스 참조를 위한 useRef
  const scrollContainerRef = useRef(null);

  // 💡 데이터가 변경될 때 렌더링 직후 스크롤을 무조건 맨 위(0)로 강제 고정
  useEffect(() => {
    if (manualResults.length > 0 && scrollContainerRef.current) {
      // 레이아웃이 완전히 그려진 직후 안전하게 맨 위로 이동하도록 틱 조절
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      });
    }
  }, [manualResults]);

  const formatImgUrl = (img) => {
    if (!img || typeof img !== 'string' || img.trim() === '') return null;
    return img.startsWith('http') ? img : `http://localhost:8000/${img}`;
  };

  const allImages = [];
  manualResults.forEach(res => {
    res.steps?.forEach(step => {
      const rawImg = step.images || step.image_list || step.image || step.image_url || step.photo_url;
      if (Array.isArray(rawImg)) {
        rawImg.forEach(img => {
          const formatted = formatImgUrl(img);
          if (formatted) allImages.push(formatted);
        });
      } else {
        const formatted = formatImgUrl(rawImg);
        if (formatted) allImages.push(formatted);
      }
    });
  });

  return (
    <div 
      ref={scrollContainerRef} 
      className="flex-1 flex flex-col bg-[#0d1322]/70 border border-gray-800/80 rounded-2xl shadow-2xl p-6 overflow-y-auto space-y-6"
    >
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="text-emerald-400" /> {carModel} 정비 매뉴얼
        </h3>
        <p className="text-xs text-gray-400 mt-1">자주 찾는 소모품 버튼을 클릭하거나 직접 검색하여 정비 가이드를 즉시 확인하세요.</p>
      </div>

      <div className="bg-[#090d16] p-4 rounded-xl border border-gray-800 space-y-2.5">
        <span className="text-xs font-semibold text-emerald-400">🔥 자주 찾는 소모품 빠른 선택</span>
        <div className="flex flex-wrap gap-2 pt-1">
          {['와이퍼', '엔진오일', '스파크플러그', '먼지필터', '에어클리너', '브레이크 패드', '냉각수', '배터리'].map((item, idx) => (
            <button
              key={idx}
              onClick={() => executeManualSearch(item)}
              className="px-4 py-2 bg-[#121826] hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-400 border border-gray-800 rounded-xl text-xs text-gray-300 font-medium transition shadow-sm"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <input 
          type="text" 
          value={manualQuery} 
          onChange={(e) => setManualQuery(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && executeManualSearch()}
          placeholder="(예: 먼지필터 교체방법)" 
          className="flex-1 bg-[#090d16] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none" 
        />
        <button onClick={() => executeManualSearch()} disabled={searchingManual} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl transition flex items-center gap-2">
          <Search className="w-4 h-4" /> 
        </button>
      </div>

      {searchingManual && <div className="text-center py-10 text-emerald-400 text-xs animate-pulse">매뉴얼 RAG 데이터베이스를 불러오는 중입니다...</div>}

      {manualResults.length > 0 && !searchingManual && (
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-gray-300">📖 매뉴얼 검색 결과</h4>
          {manualResults.map((res, idx) => (
            <div key={idx} className="bg-[#090d16] p-5 rounded-xl border border-emerald-500/30 space-y-3 shadow-lg">
              <h4 className="text-emerald-400 font-bold text-base">📌 {res.title}</h4>
              {res.steps?.map((step, sIdx) => {
                let imgList = [];
                const rawImg = step.images || step.image_list || step.image || step.image_url || step.photo_url;
                if (Array.isArray(rawImg)) {
                  imgList = rawImg.map(img => formatImgUrl(img)).filter(Boolean);
                } else {
                  const formatted = formatImgUrl(rawImg);
                  if (formatted) imgList = [formatted];
                }

                const slideKey = `manual-${idx}-${sIdx}`;
                const currentIdx = slideIndexes[slideKey] || 0;
                const activeImg = imgList[currentIdx];

                return (
                  <div key={sIdx} className="bg-[#121826] p-4 rounded-lg border border-gray-800 space-y-3 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-semibold">Step {step.step_number || sIdx + 1}</span>
                      <span>{step.description || step.action}</span>
                    </div>
                    
                    {imgList.length > 0 && (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/50 p-3 flex flex-col items-center mt-2">
                        <div className="relative w-full h-56 flex justify-center items-center bg-black/40 rounded-xl overflow-hidden">
                          {imgList.length > 1 && (
                            <>
                              <button 
                                type="button" 
                                onClick={() => handlePrevSlide(slideKey, imgList.length)} 
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-700/80 rounded-full transition shadow-md z-20"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleNextSlide(slideKey, imgList.length)} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-700/80 rounded-full transition shadow-md z-20"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          
                          <img 
                            src={activeImg} 
                            alt="매뉴얼 도해" 
                            onClick={() => {
                              const globalIdx = allImages.indexOf(activeImg);
                              openImageModal(allImages, globalIdx !== -1 ? globalIdx : 0);
                            }}
                            className="w-full h-full object-contain cursor-zoom-in rounded transition-all duration-300" 
                          />
                        </div>

                        {imgList.length > 1 && (
                          <ThumbnailScrollBox 
                            imgList={imgList}
                            currentIdx={currentIdx}
                            onSelectThumb={(tIdx) => setSlideIndexes(prev => ({ ...prev, [slideKey]: tIdx }))}
                          />
                        )}

                        <div className="flex items-center justify-end text-[11px] px-1 mt-2 w-full">
                          <span className="text-emerald-400 font-medium">총 {imgList.length}장의 사진 중 {currentIdx + 1}번째</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}