import React from 'react';
import { FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
  // 현재 화면에 보여지는 모든 매뉴얼 결과의 이미지를 하나의 배열로 통합 추출
  const allImages = [];
  manualResults.forEach(res => {
    res.steps?.forEach(step => {
      const rawImg = step.images || step.image_list || step.image || step.image_url || step.photo_url;
      if (Array.isArray(rawImg)) {
        rawImg.forEach(img => {
          if (img && typeof img === 'string' && img.trim() !== '') {
            allImages.push(img.startsWith('http') ? img : `http://localhost:8000/${img}`);
          }
        });
      } else if (typeof rawImg === 'string' && rawImg.trim() !== '') {
        allImages.push(rawImg.startsWith('http') ? rawImg : `http://localhost:8000/${rawImg}`);
      }
    });
  });

  return (
    <div className="flex-1 flex flex-col bg-[#0d1322]/70 border border-gray-800/80 rounded-2xl shadow-2xl p-6 overflow-y-auto space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="text-emerald-400" /> {carModel} 정비 매뉴얼 아카이브
        </h3>
        <p className="text-xs text-gray-400 mt-1">자주 찾는 소모품 버튼을 클릭하거나 직접 검색하여 공식 정비 가이드를 즉시 확인하세요.</p>
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
          placeholder="정확한 검색어를 입력하세요 (예: 먼지필터 교체방법 등)" 
          className="flex-1 bg-[#090d16] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none" 
        />
        <button onClick={() => executeManualSearch()} disabled={searchingManual} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl transition flex items-center gap-2">
          <Search className="w-4 h-4" /> 검색
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
                  imgList = rawImg;
                } else if (typeof rawImg === 'string' && rawImg.trim() !== '') {
                  imgList = [rawImg];
                }
                const slideKey = `manual-${idx}-${sIdx}`;
                const currentIdx = slideIndexes[slideKey] || 0;

                return (
                  <div key={sIdx} className="bg-[#121826] p-4 rounded-lg border border-gray-800 space-y-3 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-semibold">Step {step.step_number || sIdx + 1}</span>
                      <span>{step.description || step.action}</span>
                    </div>
                    
                    {imgList.length > 0 && (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/50 p-2 flex flex-col items-center mt-2">
                        <div className="w-full flex items-center justify-between">
                          {imgList.length > 1 && (
                            <button type="button" onClick={() => handlePrevSlide(slideKey, imgList.length)} className="p-2 bg-[#090d16] hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-700 rounded-lg transition shadow z-10">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}
                          <div className="flex-1 flex justify-center overflow-hidden px-2">
                            <img 
                              src={imgList[currentIdx].startsWith('http') ? imgList[currentIdx] : `http://localhost:8000/${imgList[currentIdx]}`} 
                              alt="매뉴얼 도해" 
                              onClick={() => {
                                const clickedImgPath = imgList[currentIdx];
                                const formattedPath = clickedImgPath.startsWith('http') ? clickedImgPath : `http://localhost:8000/${clickedImgPath}`;
                                const globalIdx = allImages.indexOf(formattedPath);
                                openImageModal(allImages, globalIdx !== -1 ? globalIdx : 0);
                              }}
                              className="max-h-44 object-contain cursor-zoom-in rounded" 
                            />
                          </div>
                          {imgList.length > 1 && (
                            <button type="button" onClick={() => handleNextSlide(slideKey, imgList.length)} className="p-2 bg-[#090d16] hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-700 rounded-lg transition shadow z-10">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {imgList.length > 1 && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-800/80 w-full overflow-x-auto pb-1 justify-center">
                            {imgList.map((thumb, tIdx) => (
                              <button
                                key={tIdx}
                                type="button"
                                onClick={() => setSlideIndexes(prev => ({ ...prev, [slideKey]: tIdx }))}
                                className={`w-12 h-10 rounded-lg overflow-hidden border-2 transition shrink-0 ${currentIdx === tIdx ? 'border-emerald-400 scale-105 shadow-md' : 'border-gray-700 opacity-60 hover:opacity-100'}`}
                              >
                                <img src={thumb.startsWith('http') ? thumb : `http://localhost:8000/${thumb}`} alt="썸네일" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
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