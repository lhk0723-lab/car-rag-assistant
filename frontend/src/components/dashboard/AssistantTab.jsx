import React, { useRef, useEffect } from 'react';
import { User, ImageIcon, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';


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
              <img 
                src={thumb.startsWith('http') ? thumb : `http://localhost:8000/${thumb}`} 
                alt="썸네일" 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AssistantTab({
  carModel,
  messages,
  loading,
  inputMessage,
  setInputMessage,
  previewUrl,
  setSelectedImage,
  setPreviewUrl,
  handleSendMessage,
  openImageModal,
  slideIndexes,
  handlePrevSlide,
  handleNextSlide,
  setSlideIndexes,
  lastActivePart
}) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0 && chatContainerRef.current) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = 0;
        }
      });
    }
  }, [messages]);

  const formatImgUrl = (img) => {
    if (!img || typeof img !== 'string' || img.trim() === '') return null;
    return img.startsWith('http') ? img : `http://localhost:8000/${img}`;
  };

  const scrollToUserQuery = () => {
    if (chatContainerRef.current) {
      const userMessageNodes = chatContainerRef.current.querySelectorAll('.user-message-item');
      if (userMessageNodes.length > 0) {
        const lastUserMsg = userMessageNodes[userMessageNodes.length - 1];
        lastUserMsg.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  };

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setSelectedImage(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !previewUrl) return;
    
    handleSendMessage(e, null);
    setTimeout(scrollToUserQuery, 250);
  };

  return (
    
    <div className="flex-1 flex flex-col bg-[#0d1322]/70 border border-gray-800/80 rounded-2xl shadow-2xl py-6 overflow-hidden">
      
      
      <div className="px-6 pb-4 border-b border-gray-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {carModel} AI 어시스턴트
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            사진 업로드 시 부품 이름 확인, 텍스트 입력 시 RAG 정비 가이드를 제공합니다.
          </p>
        </div>
      </div>

      
      <div className="mx-6 my-4 px-4 py-3 bg-[#090d16] rounded-xl border border-gray-800 flex items-center gap-2 text-xs text-gray-400">
        <span className="text-amber-400/90 text-sm">⚠️</span>
        <span className="font-medium">본 AI 가이드는 참고용이며, 작업 중 발생하는 차량 손상이나 안전사고에 대한 책임은 사용자에게 있습니다.</span>
      </div>

      
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-6 px-6">
        {messages.map((msg, index) => {
          const allMessageImages = [];
          if (msg.type === 'manual' && msg.steps) {
            msg.steps.forEach(st => {
              const rImg = st.images || st.image_list || st.image || st.image_url || st.photo_url;
              if (Array.isArray(rImg)) {
                rImg.forEach(img => {
                  const formatted = formatImgUrl(img);
                  if (formatted) allMessageImages.push(formatted);
                });
              } else {
                const formatted = formatImgUrl(rImg);
                if (formatted) allMessageImages.push(formatted);
              }
            });
          }

          const isUser = msg.sender === 'user';

          return (
            <div 
              key={index} 
              className={`message-item ${isUser ? 'user-message-item pt-2 pb-1 flex flex-row-reverse' : 'w-full'} flex items-start gap-3`}
            >
              {isUser && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-500 text-gray-950 font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}

              <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-md ${isUser ? 'bg-emerald-600 text-gray-950 font-medium rounded-tr-none max-w-[85%]' : 'bg-[#121826] text-gray-200 border border-gray-800/80 rounded-xl w-full'}`}>
                {msg.image && (
                  <div className="mb-3">
                    <img 
                      src={msg.image} 
                      alt="첨부" 
                      onClick={() => openImageModal([msg.image], 0)} 
                      className="rounded-lg max-h-40 object-cover cursor-pointer hover:opacity-90 transition" 
                    />
                  </div>
                )}
                
                {msg.type === 'manual' ? (
                  <div className="space-y-4">
                    <p className="font-bold text-emerald-400 border-b border-gray-800 pb-2 text-sm">📌 [정비 가이드: {msg.title}]</p>
                    
                    {(() => {
                      const meta = msg.manual_data || msg;
                      if (!(meta.estimated_time || meta.difficulty || meta.tools_required || meta.recommended_interval)) return null;
                      
                      return (
                        <div className="bg-[#090d16]/90 p-4 rounded-xl border border-emerald-500/30 space-y-2 text-xs">
                          {meta.estimated_time && (
                            <div className="grid grid-cols-[84px_1fr] items-start gap-3">
                              <span className="text-emerald-400 font-semibold text-left whitespace-nowrap">작업 시간</span>
                              <span className="text-gray-200 text-left">{meta.estimated_time}</span>
                            </div>
                          )}

                          {meta.difficulty && (
                            <div className="grid grid-cols-[84px_1fr] items-start gap-3 pt-1.5 border-t border-gray-800/80">
                              <span className="text-emerald-400 font-semibold text-left whitespace-nowrap">작업 난이도</span>
                              <span className="text-gray-200 text-left">{meta.difficulty}</span>
                            </div>
                          )}

                          {meta.tools_required && meta.tools_required.length > 0 && (
                            <div className="grid grid-cols-[84px_1fr] items-start gap-3 pt-1.5 border-t border-gray-800/80">
                              <span className="text-emerald-400 font-semibold text-left whitespace-nowrap">필요 공구</span>
                              <span className="text-gray-200 text-left">{Array.isArray(meta.tools_required) ? meta.tools_required.join(', ') : meta.tools_required}</span>
                            </div>
                          )}

                          {meta.recommended_interval && (
                            <div className="grid grid-cols-[84px_1fr] items-start gap-3 pt-1.5 border-t border-gray-800/80">
                              <span className="text-emerald-400 font-semibold text-left whitespace-nowrap">교체 주기</span>
                              <span className="text-gray-300 text-left">{meta.recommended_interval}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {msg.steps.map((step, sIdx) => {
                      let imgList = [];
                      const rawImg = step.images || step.image_list || step.image || step.image_url || step.photo_url;
                      if (Array.isArray(rawImg)) {
                        imgList = rawImg.map(img => formatImgUrl(img)).filter(Boolean);
                      } else {
                        const formatted = formatImgUrl(rawImg);
                        if (formatted) imgList = [formatted];
                      }
                      
                      const slideKey = `${index}-${sIdx}`;
                      const currentIdx = slideIndexes[slideKey] || 0;
                      const activeImg = imgList[currentIdx];

                      return (
                        <div key={sIdx} className="bg-[#090d16]/80 p-4 rounded-xl border border-gray-800 space-y-3">
                          <p className="font-semibold text-gray-100 text-sm">Step {step.step_number || sIdx + 1}: {step.description || step.action}</p>
                          
                          {imgList.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/50 p-3 flex flex-col items-center">
                                <div className="relative w-full h-56 flex justify-center items-center bg-black/40 rounded-xl overflow-hidden">
                                  {imgList.length > 1 && (
                                    <>
                                      <button 
                                        type="button" 
                                        onClick={() => handlePrevSlide(slideKey, imgList.length)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-700/80 rounded-full transition shadow-md z-20"
                                        title="이전 사진"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => handleNextSlide(slideKey, imgList.length)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-700/80 rounded-full transition shadow-md z-20"
                                        title="다음 사진"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}

                                  <img 
                                    src={activeImg} 
                                    alt="작업 가이드 사진" 
                                    onClick={() => {
                                      const globalIdx = allMessageImages.indexOf(activeImg);
                                      openImageModal(allMessageImages, globalIdx !== -1 ? globalIdx : 0);
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="whitespace-pre-line">{msg.text}</div>
                )}
              </div>
            </div>
          );
        })}
        {loading && <div className="text-gray-400 text-xs animate-pulse">AI가 내용을 분석하고 있습니다...</div>}
      </div>

      
      <form onSubmit={handleTextSubmit} className="mt-4 pt-4 px-6 border-t border-gray-800/80 flex flex-col gap-2.5">
        {previewUrl && (
          <div className="flex items-center justify-between bg-[#090d16] px-4 py-2.5 rounded-xl border border-emerald-500/40 shadow-md">
            <div className="flex items-center gap-3">
              <img src={previewUrl} alt="미리보기" className="w-12 h-12 object-cover rounded-lg border border-emerald-500/30 cursor-pointer" onClick={() => openImageModal([previewUrl], 0)} />
              <div>
                <span className="text-xs text-emerald-400 font-bold block">부품 이미지 첨부완료</span>
                <span className="text-[11px] text-gray-400">우측의 전송 버튼을 눌러 정밀 부품 이름을 확인하세요.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-rose-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <label className="p-3 bg-[#090d16] hover:bg-gray-800 text-gray-400 hover:text-emerald-400 border border-gray-800 rounded-xl cursor-pointer transition flex items-center gap-1.5 text-xs font-medium" title="사진 첨부하기">
            <ImageIcon className="w-5 h-5" />
            <span className="hidden sm:inline">사진 첨부</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
          <input 
  type="text" 
  value={inputMessage} 
  onChange={(e) => setInputMessage(e.target.value)} 
  placeholder="입력 예시 : [부품 이름] 교체 방법" 
  className="flex-1 bg-[#090d16] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white" 
/>
          <button type="submit" disabled={loading} className="p-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl transition shadow">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}