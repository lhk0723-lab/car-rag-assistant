import React, { useState } from 'react';

// 분리한 커스텀 훅 및 API 서비스 임포트
import { useUserSession } from '../hooks/useUserSession';
import { updateUserSetting, diagnosePart, sendChatMessage } from '../services/api';

// 컴포넌트 임포트
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import AssistantTab from '../components/dashboard/AssistantTab';
import ManualsTab from '../components/dashboard/ManualsTab';
import HistoryTab from '../components/dashboard/HistoryTab';
import SettingsTab from '../components/dashboard/SettingsTab';
import ImageModal from '../components/common/ImageModal';

export default function DashboardPage() {
  const { 
    nickname, 
    setNickname, 
    carModel, 
    setCarModel, 
    diagnosisHistory,
    currentUsername, 
    handleLogout, 
    saveHistoryItem,
    deleteHistoryItem 
  } = useUserSession();

  const [activeTab, setActiveTab] = useState('assistant');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [lastActivePart, setLastActivePart] = useState(null); 
  
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `안녕하세요! NEXUS AI 정비 어시스턴트입니다.\n하단 입력창에서 부품 사진을 첨부하고 [부품 이름 확인] 버튼을 누르거나, 정비 가이드를 질문해 보세요.` }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [modalData, setModalData] = useState({ isOpen: false, list: [], index: 0 });

  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState([]);
  const [searchingManual, setSearchingManual] = useState(false);

  const [newNickname, setNewNickname] = useState(nickname || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [selectedBrand, setSelectedBrand] = useState('Volvo');
  const [selectedModel, setSelectedModel] = useState('XC60');
  const [selectedYear, setSelectedYear] = useState('2024');

  const [slideIndexes, setSlideIndexes] = useState({});

  // 히스토리 다중 선택 상태 추가
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);

  // 히스토리 개별 선택 토글 핸들러
  const handleToggleSelectHistory = (id) => {
    setSelectedHistoryIds(prev => 
      prev.includes(id) ? prev.filter(itemid => itemid !== id) : [...prev, id]
    );
  };

  // 히스토리 전체 선택/해제 토글 핸들러
  const handleToggleSelectAll = (allIds) => {
    if (selectedHistoryIds.length === allIds.length) {
      setSelectedHistoryIds([]);
    } else {
      setSelectedHistoryIds(allIds);
    }
  };

  // 선택된 항목 일괄 삭제 핸들러
  const handleDeleteSelected = async () => {
    try {
      selectedHistoryIds.forEach(id => {
        deleteHistoryItem(id);
      });
      setSelectedHistoryIds([]);
    } catch (err) {
      console.error(err);
      alert('선택 삭제 중 오류가 발생했습니다.');
    }
  };

  // 전체 삭제 핸들러
  const handleDeleteAll = () => {
    diagnosisHistory.forEach(item => {
      deleteHistoryItem(item.id);
    });
    setSelectedHistoryIds([]);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    // 1. 비밀번호 변경 시도 시 현재 비밀번호 누락 체크
    if (newPassword && !currentPassword) {
      alert('현재 비밀번호를 입력해주세요.');
      return;
    }

    // 2. 새 비밀번호와 확인란 불일치 체크
    if (newPassword && newPassword !== confirmPassword) {
      alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const updatedCarModel = `${selectedBrand} ${selectedModel} (${selectedYear})`;

    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userUniqueId = savedUser.username || localStorage.getItem('username');
      
      if (!userUniqueId) {
        alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }
      
      const finalNickname = newNickname && newNickname.trim() ? newNickname.trim() : nickname;

      const response = await updateUserSetting({
        username: userUniqueId,
        current_password: currentPassword || null,
        new_password: newPassword || null,
        new_nickname: finalNickname
      });

      if (response.success) {
        const updatedUser = {
          ...savedUser,
          username: userUniqueId,
          nickname: response.data.nickname
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('nickname', response.data.nickname);
        localStorage.setItem('carModel', updatedCarModel);

        setNickname(response.data.nickname);
        setCarModel(updatedCarModel);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        alert('설정이 성공적으로 저장되었습니다.');
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || err.message;
      alert(`설정 저장 중 오류가 발생했습니다: ${errorMsg}`);
    }
  };

  // [수정 완료] 이력 선택 시 해당 부품의 맥락(lastActivePart)도 함께 복원되도록 개선
  const handleSelectHistoryItem = async (item) => {
    setActiveTab('assistant');

    // 공통으로 활용할 수 있는 부품 이름 추출 (타이틀이나 카테고리 정보 활용)
    const targetPart = item.detected_part || item.manualData?.manual_data?.category || item.title;
    if (item.type === '부품 진단' || item.type === '정비 가이드') {
      setLastActivePart(targetPart);
    } else {
      setLastActivePart(null);
    }

    // 1. 이미지가 포함된 진단 이력인 경우
    if (item.image) {
      setMessages([
        { sender: 'user', text: `${item.title} 진단 기록 보기`, image: item.image },
        { sender: 'ai', text: item.detailText || `[이력 보기] ${item.title}에 대한 진단 기록입니다.` }
      ]);
      return;
    }

    // 2. 백엔드에서 steps 데이터가 함께 넘어온 경우 처리 (새로고침 직후 대응)
    if (item.steps && item.steps.length > 0) {
      const manualMsg = {
        sender: 'ai',
        type: 'manual',
        title: item.title || item.detected_part || '정비 가이드',
        steps: item.steps,
        manual_data: {
          title: item.title,
          category: item.detected_part,
          steps: item.steps
        }
      };
      setMessages([
        { sender: 'user', text: item.title || '정비 가이드 다시 보기' },
        manualMsg
      ]);
      return;
    }

    // 3. 기존에 저장된 manualData가 있는 경우
    if (item.manualData) {
      setMessages([
        { sender: 'user', text: item.title || '정비 가이드 다시 보기' },
        item.manualData 
      ]);
      return;
    }

    // 4. 상세 텍스트(detailText)만 있는 일반 문의/검색 이력인 경우
    if (item.detailText) {
      setMessages([
        { sender: 'user', text: item.title || '문의 이력 다시 보기' },
        { sender: 'ai', text: item.detailText }
      ]);
      return;
    }

    // 5. 예외 처리
    setMessages([
      { sender: 'user', text: item.title || '이력 보기' },
      { sender: 'ai', text: '저장된 상세 내용이 없습니다.' }
    ]);
  };

  const handlePrevSlide = (key, maxLen) => {
    setSlideIndexes(prev => {
      const cur = prev[key] || 0;
      const nextIdx = cur === 0 ? maxLen - 1 : cur - 1;
      return { ...prev, [key]: nextIdx };
    });
  };

  const handleNextSlide = (key, maxLen) => {
    setSlideIndexes(prev => {
      const cur = prev[key] || 0;
      const nextIdx = cur === maxLen - 1 ? 0 : cur + 1;
      return { ...prev, [key]: nextIdx };
    });
  };

  const openImageModal = (imgList, index = 0) => {
    const formattedList = imgList.map(img => {
      if (!img) return '';
      if (img.startsWith('blob:') || img.startsWith('http')) {
        return img;
      }
      return `http://localhost:8000${img.startsWith('/') ? '' : '/'}${img}`;
    });
    setModalData({ isOpen: true, list: formattedList, index });
  };

  const handleModalPrev = () => {
    setModalData(prev => ({
      ...prev,
      index: prev.index === 0 ? prev.list.length - 1 : prev.index - 1
    }));
  };

  const handleModalNext = () => {
    setModalData(prev => ({
      ...prev,
      index: prev.index === prev.list.length - 1 ? 0 : prev.index + 1
    }));
  };

  const handleSendMessage = async (e, forceAction = null) => {
    if (e) e.preventDefault();
    const actionType = forceAction || (selectedImage ? 'diagnose' : 'chat');

    if (!inputMessage.trim() && !selectedImage) return;

    const userText = inputMessage.trim();
    const currentImagePreview = previewUrl;
    const hasImage = !!selectedImage;

    const newMsgList = [...messages, { 
      sender: 'user', 
      text: userText || '부품 이미지 확인을 요청했습니다.',
      image: currentImagePreview 
    }];
    setMessages(newMsgList);

    setInputMessage('');
    setSelectedImage(null);
    setPreviewUrl(null);
    setLoading(true);

    try {
      if (hasImage || actionType === 'diagnose') {
        const formData = new FormData();
        if (selectedImage) formData.append('file', selectedImage);
        
        if (currentUsername) {
          formData.append('username', currentUsername);
        }

        const diagData = await diagnosePart(formData);

        if (diagData.success && diagData.detected_part) {
          const partName = diagData.detected_part;
          setLastActivePart(partName); 
          
          const permanentImageUrl = diagData.image_url 
            ? (diagData.image_url.startsWith('http') ? diagData.image_url : `http://localhost:8000${diagData.image_url}`) 
            : currentImagePreview;
          
          const aiResponseText = `🔍 [부품 인식 결과] 업로드하신 부품은 **${partName}**로 확인되었습니다. (${carModel} 맞춤)\n교체 방법을 원하시면 "교체 방법"이라고 입력해 주세요!`;
          
          const updatedMsgList = [...messages, { 
            sender: 'user', 
            text: userText || '부품 이미지 확인을 요청했습니다.',
            image: permanentImageUrl 
          }];
          
          setMessages([...updatedMsgList, { sender: 'ai', text: aiResponseText }]);

          saveHistoryItem({ 
            type: '부품 진단', 
            title: partName, 
            date: new Date().toLocaleString(), 
            image: permanentImageUrl, 
            detailText: aiResponseText 
          });
        } else {
          setLastActivePart(null);
          setMessages([...newMsgList, { sender: 'ai', text: diagData.message || '부품을 명확히 인식하지 못했습니다.' }]);
        }
      } else {
        // [수정 완료] 완전히 새로운 주제(예: 와이퍼, 오일 등)를 입력하면 이전 부품 맥락을 끊어주어 타이틀이 꼬이지 않도록 개선
        const isNewTopic = 
          userText.includes('와이퍼') || 
          userText.includes('오일') || 
          userText.includes('타이어') || 
          userText.includes('배터리') ||
          userText.includes('브레이크');

        const isShortFollowUp = 
            !isNewTopic && (
                userText.includes('교체') || 
                userText.includes('교환') || 
                userText.includes('바꾸') || 
                userText.includes('방법') || 
                userText.includes('알려줘')
            );

        let activePartToUse = undefined;

        if (isShortFollowUp && lastActivePart) {
            activePartToUse = lastActivePart; 
            setLastActivePart(null); 
        } else {
            setLastActivePart(null); 
        }

        // 타이틀 조합: 새로운 주제이거나 일반 검색이면 사용자 입력 텍스트를 그대로 사용
        const calculatedHistoryTitle = (activePartToUse && isShortFollowUp)
          ? `${activePartToUse} (${userText})` 
          : userText;

        const chatData = await sendChatMessage(userText, activePartToUse, carModel, currentUsername, calculatedHistoryTitle);

        if (chatData.success && chatData.manual_data) {
          const manual = chatData.manual_data;
          
          if (chatData.matched_category) {
            setLastActivePart(chatData.matched_category);
          }
          
          const manualMsg = { 
            sender: 'ai', 
            type: 'manual', 
            title: manual.title || manual.category || userText,
            steps: manual.steps || [],
            manual_data: manual 
          };
          
          setMessages([...newMsgList, manualMsg]);
          
          saveHistoryItem({ 
            type: '정비 가이드', 
            title: calculatedHistoryTitle, 
            date: new Date().toLocaleString(), 
            manualData: manualMsg 
          });
        } else {
          const plainText = chatData.message || '답변을 생성하지 못했습니다.';
          setMessages([...newMsgList, { sender: 'ai', text: plainText }]);
          saveHistoryItem({ type: '일반 문의', title: userText, date: new Date().toLocaleString(), detailText: plainText });
        }
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMsgList, { sender: 'ai', text: `[오류 발생] ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const executeManualSearch = async (queryKeyword) => {
    const keyword = (queryKeyword || manualQuery).trim();
    if (!keyword) return;

    setManualQuery(keyword);
    setSearchingManual(true);
    try {
      const data = await sendChatMessage(keyword, undefined, carModel, currentUsername);
      if (data.success && data.manual_data) {
        setManualResults([data.manual_data]);
        saveHistoryItem({ type: '매뉴얼 검색', title: keyword, date: new Date().toLocaleString(), detailText: data.manual_data.title });
      } else {
        setManualResults([{ title: `${keyword} 가이드`, steps: [{ step_number: 1, description: data.message || '관련 매뉴얼 조각을 찾지 못했습니다.' }] }]);
      }
    } catch (err) {
      console.error(err);
      alert('매뉴얼 검색 중 오류가 발생했습니다.');
    } finally {
      setSearchingManual(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#090d16] text-gray-100 font-sans overflow-hidden">
      
      {/* 💡 Sidebar에 isOpen 및 onClose 전달 */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        carModel={carModel}
        handleLogout={handleLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 💡 Header에 onOpenSidebar 전달 */}
        <Header 
          carModel={carModel} 
          nickname={nickname} 
          handleLogout={handleLogout} 
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="flex-1 p-6 flex flex-col overflow-hidden bg-[#090d16]">
          
          {activeTab === 'assistant' && (
            <AssistantTab 
              carModel={carModel}
              messages={messages}
              loading={loading}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              previewUrl={previewUrl}
              setSelectedImage={setSelectedImage}
              setPreviewUrl={setPreviewUrl}
              handleSendMessage={handleSendMessage}
              openImageModal={openImageModal}
              slideIndexes={slideIndexes}
              handlePrevSlide={handlePrevSlide}
              handleNextSlide={handleNextSlide}
              setSlideIndexes={setSlideIndexes}
              lastActivePart={lastActivePart}
            />
          )}

          {activeTab === 'manuals' && (
            <ManualsTab 
              carModel={carModel}
              manualQuery={manualQuery}
              setManualQuery={setManualQuery}
              executeManualSearch={executeManualSearch}
              searchingManual={searchingManual}
              manualResults={manualResults}
              slideIndexes={slideIndexes}
              handlePrevSlide={handlePrevSlide}
              handleNextSlide={handleNextSlide}
              setSlideIndexes={setSlideIndexes}
              openImageModal={openImageModal}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab 
              diagnosisHistory={diagnosisHistory} 
              onDeleteItem={deleteHistoryItem} 
              onSelectItem={handleSelectHistoryItem} 
              selectedHistoryIds={selectedHistoryIds}
              onToggleSelectHistory={handleToggleSelectHistory}
              onToggleSelectAll={handleToggleSelectAll}
              onDeleteSelected={handleDeleteSelected}
              onDeleteAll={handleDeleteAll}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              newNickname={newNickname}
              setNewNickname={setNewNickname}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              handleSaveSettings={handleSaveSettings}
            />
          )}

        </main>
      </div>

      <ImageModal 
        modalData={modalData} 
        setModalData={setModalData} 
        handleModalPrev={handleModalPrev} 
        handleModalNext={handleModalNext} 
      />

    </div>
  );
}