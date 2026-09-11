import React, { useRef } from 'react';
import { Bot, User, ImageIcon, X, Send, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

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
  lastActivePart // ⭐ 추가: 현재 기억된 부품 이름 전달받기
}) {
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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

  const handleDiagnoseClick = (e) => {
    handleSendMessage(e, 'diagnose');
    setTimeout(scrollToBottom, 100);
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
    <div className="flex-1 flex flex-col bg-[#0d1322]/70 border border-gray-800/80 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800/80 bg-[#0d1322] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20"><Bot className="w-5 h-5" /></div>
          <div>
            <h4 className="text-sm font-semibold text-white">AI 정비 어시스턴트 ({carModel} 맞춤 최적화)</h4>
            <p className="text-[11px] text-gray-400">
              {lastActivePart ? `현재 감지된 부품: [ ${lastActivePart} ] (이어서 질문하면 자동으로 조합됩니다)` : '사진 첨부 시 부품 이름 확인, 텍스트 입력 시 RAG 정비 가이드를 제공합니다.'}
            </p>
          </div>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg, index) => {
          const allMessageImages = [];
          if (msg.type === 'manual' && msg.steps) {
            msg.steps.forEach(st => {
              const rImg = st.images || st.image_list || st.image || st.image_url || st.photo_url;
              if (Array.isArray(rImg)) {
                rImg.forEach(img => {
                  if (img && typeof img === 'string' && img.trim() !== '') {
                    allMessageImages.push(img.startsWith('http') ? img : `http://localhost:8000/${img}`);
                  }
                });
              } else if (typeof rImg === 'string' && rImg.trim() !== '') {
                allMessageImages.push(rImg.startsWith('http') ? rImg : `http://localhost:8000/${rImg}`);
              }
            });
          }

          return (
            <div 
              key={index} 
              className={`message-item ${msg.sender === 'user' ? 'user-message-item pt-4 pb-2' : ''} flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-emerald-500 text-gray-950 font-bold' : 'bg-[#121826] text-emerald-400 border border-gray-800'}`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-md ${msg.sender === 'user' ? 'bg-emerald-600 text-gray-950 font-medium rounded-tr-none' : 'bg-[#121826] text-gray-200 border border-gray-800/80 rounded-tl-none'}`}>
                {msg.image && <div className="mb-3"><img src={msg.image} alt="첨부" onClick={() => openImageModal([msg.image], 0)} className="rounded-lg max-h-40 object-cover cursor-pointer hover:opacity-90 transition" /></div>}
                {msg.type === 'manual' ? (
                  <div className="space-y-4">
                    <p className="font-bold text-emerald-400 border-b border-gray-800 pb-2 text-sm">📌 [정비 가이드: {msg.title}]</p>
                    {msg.steps.map((step, sIdx) => {
                      let imgList = [];
                      const rawImg = step.images || step.image_list || step.image || step.image_url || step.photo_url;
                      if (Array.isArray(rawImg)) {
                        imgList = rawImg;
                      } else if (typeof rawImg === 'string' && rawImg.trim() !== '') {
                        imgList = [rawImg];
                      }
                      
                      const slideKey = `${index}-${sIdx}`;
                      const currentIdx = slideIndexes[slideKey] || 0;

                      return (
                        <div key={sIdx} className="bg-[#090d16]/80 p-4 rounded-xl border border-gray-800 space-y-3">
                          <p className="font-semibold text-gray-100 text-sm">Step {step.step_number || sIdx + 1}: {step.description || step.action}</p>
                          
                          {imgList.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/50 p-2 flex flex-col items-center">
                                <div className="w-full flex items-center justify-between">
                                  {imgList.length > 1 && (
                                    <button 
                                      type="button" 
                                      onClick={() => handlePrevSlide(slideKey, imgList.length)}
                                      className="p-2 bg-[#121826]/90 hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-700 rounded-lg transition shadow z-10"
                                      title="이전 사진 보기"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                  )}

                                  <div className="flex-1 flex justify-center overflow-hidden px-2">
                                    <img 
                                      src={imgList[currentIdx].startsWith('http') ? imgList[currentIdx] : `http://localhost:8000/${imgList[currentIdx]}`} 
                                      alt={`작업 가이드 사진 ${currentIdx + 1}`} 
                                      onClick={() => {
                                        const clickedImgPath = imgList[currentIdx];
                                        const formattedPath = clickedImgPath.startsWith('http') ? clickedImgPath : `http://localhost:8000/${clickedImgPath}`;
                                        const globalIdx = allMessageImages.indexOf(formattedPath);
                                        openImageModal(allMessageImages, globalIdx !== -1 ? globalIdx : 0);
                                      }}
                                      className="max-h-48 object-contain cursor-zoom-in rounded transition-all duration-300" 
                                    />
                                  </div>

                                  {imgList.length > 1 && (
                                    <button 
                                      type="button" 
                                      onClick={() => handleNextSlide(slideKey, imgList.length)}
                                      className="p-2 bg-[#121826]/90 hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-700 rounded-lg transition shadow z-10"
                                      title="다음 사진 보기"
                                    >
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
                                        <img 
                                          src={thumb.startsWith('http') ? thumb : `http://localhost:8000/${thumb}`} 
                                          alt={`썸네일 ${tIdx + 1}`} 
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                                <span>이미지를 클릭하면 큰 화면으로 확대됩니다.</span>
                                {imgList.length > 1 && <span className="text-emerald-400 font-medium">총 {imgList.length}장의 사진 중 {currentIdx + 1}번째</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : <div className="whitespace-pre-line">{msg.text}</div>}
              </div>
            </div>
          );
        })}
        {loading && <div className="text-gray-400 text-xs px-11 animate-pulse">AI가 내용을 분석하고 있습니다...</div>}
      </div>

      <form onSubmit={handleTextSubmit} className="p-4 border-t border-gray-800/80 bg-[#0d1322]/50 flex flex-col gap-2.5">
        {previewUrl && (
          <div className="flex items-center justify-between bg-[#090d16] px-4 py-2.5 rounded-xl border border-emerald-500/40 shadow-md">
            <div className="flex items-center gap-3">
              <img src={previewUrl} alt="미리보기" className="w-12 h-12 object-cover rounded-lg border border-emerald-500/30 cursor-pointer" onClick={() => openImageModal([previewUrl], 0)} />
              <div>
                <span className="text-xs text-emerald-400 font-bold block">부품 이미지 첨부완료</span>
                <span className="text-[11px] text-gray-400">아래 버튼을 눌러 정밀 부품 이름을 확인하세요.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={handleDiagnoseClick} 
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> 부품 이름 확인
              </button>
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
            placeholder={lastActivePart ? `${lastActivePart} 관련 내용을 질문해보세요 (예: 교체 방법)...` : `${carModel} 정비 관련 내용을 질문해보세요...`} 
            className="flex-1 bg-[#090d16] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white" 
          />
          <button type="submit" disabled={loading} className="p-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl transition shadow"><Send className="w-5 h-5" /></button>
        </div>
      </form>
    </div>
  );
}