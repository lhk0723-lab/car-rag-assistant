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
  // 1. 커스텀 훅을 통한 세션 및 상태 관리
  const { 
    nickname, 
    setNickname, 
    carModel, 
    setCarModel, 
    diagnosisHistory, 
    handleLogout, 
    saveHistoryItem 
  } = useUserSession();

  const [activeTab, setActiveTab] = useState('assistant');
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // 💡 상태 충돌을 막기 위해 부품 기억 상태를 'lastActivePart' 하나로 완전 통합
  const [lastActivePart, setLastActivePart] = useState(null); 
  
  // 💡 원본 초기 메시지 완벽 보존
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `안녕하세요! NEXUS AI 정비 어시스턴트입니다.\n하단 입력창에서 부품 사진을 첨부하고 [부품 이름 확인] 버튼을 누르거나, 정비 가이드를 질문해 보세요.` }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [modalData, setModalData] = useState({ isOpen: false, list: [], index: 0 });

  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState([]);
  const [searchingManual, setSearchingManual] = useState(false);

  // 설정 탭 입력값 상태
  const [newNickname, setNewNickname] = useState(nickname || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [selectedBrand, setSelectedBrand] = useState('Volvo');
  const [selectedModel, setSelectedModel] = useState('XC60');
  const [selectedYear, setSelectedYear] = useState('2024');

  const [slideIndexes, setSlideIndexes] = useState({});

  // 2. 설정 저장 함수 (서비스 API 활용)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!newNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const updatedCarModel = `${selectedBrand} ${selectedModel} (${selectedYear})`;

    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUsername = savedUser.username || localStorage.getItem('username') || nickname;

      const response = await updateUserSetting({
        username: currentUsername,
        current_password: currentPassword || null,
        new_password: newPassword || null,
        new_nickname: newNickname.trim()
      });

      if (response.success) {
        const updatedUser = {
          ...savedUser,
          username: currentUsername,
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
    const formattedList = imgList.map(img => img.startsWith('http') ? img : `http://localhost:8000/${img}`);
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

  // 3. 메시지 전송 및 진단 처리 (단일 통합 상태 활용)
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

        const diagData = await diagnosePart(formData);

        if (diagData.success && diagData.detected_part) {
          const partName = diagData.detected_part;
          setLastActivePart(partName); // 💡 이미지 진단 성공 시 최신 부품으로 갱신
          
          const aiResponseText = `🔍 [부품 인식 결과] 업로드하신 부품은 **${partName}**로 확인되었습니다. (${carModel} 맞춤)\n교체 방법을 원하시면 "${partName} 교체 방법"이라고 입력해 주세요!`;
          setMessages([...newMsgList, { sender: 'ai', text: aiResponseText }]);

          saveHistoryItem({ type: '부품 진단', title: partName, date: new Date().toLocaleString(), image: currentImagePreview, detailText: aiResponseText });
        } else {
          setMessages([...newMsgList, { sender: 'ai', text: diagData.message || '부품을 명확히 인식하지 못했습니다.' }]);
        }
      } else {
        // 💡 가장 최근에 기억된 부품(lastActivePart)과 차종(carModel)을 함께 전송
        const chatData = await sendChatMessage(userText, lastActivePart || undefined, carModel);

        if (chatData.success && chatData.manual_data) {
          const manual = chatData.manual_data;
          
          // 💡 텍스트 질의/검색으로 새로운 부품/카테고리가 매칭되었다면 최신 값으로 즉시 덮어쓰기
          if (chatData.matched_category) {
            setLastActivePart(chatData.matched_category);
          }
          
          const manualMsg = { 
            sender: 'ai', 
            type: 'manual', 
            title: manual.title || chatData.matched_category || userText,
            steps: manual.steps || []
          };
          setMessages([...newMsgList, manualMsg]);
          saveHistoryItem({ type: '정비 가이드', title: userText, date: new Date().toLocaleString(), manualData: manualMsg });
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

  // 4. 매뉴얼 검색 실행 (car_model 함께 전달)
  const executeManualSearch = async (queryKeyword) => {
    const keyword = (queryKeyword || manualQuery).trim();
    if (!keyword) return;

    setManualQuery(keyword);
    setSearchingManual(true);
    try {
      const data = await sendChatMessage(keyword, undefined, carModel);
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
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} carModel={carModel} />

      <div className="flex-1 flex flex-col min-w-0">
        
        <Header carModel={carModel} nickname={nickname} handleLogout={handleLogout} />

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
            <HistoryTab diagnosisHistory={diagnosisHistory} />
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