// src/hooks/useUserSession.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useUserSession() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [carModel, setCarModel] = useState('Volvo XC60 (2024)');
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);

  // 초기 로컬스토리지 로드 및 인증 검증
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    let storedNickname = '';

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        storedNickname = parsed.nickname;
      } catch (e) {
        storedNickname = localStorage.getItem('nickname');
      }
    } else {
      storedNickname = localStorage.getItem('nickname');
    }

    const storedCarModel = localStorage.getItem('carModel') || 'Volvo XC60 (2024)';

    if (!storedNickname) {
      navigate('/login', { replace: true });
    } else {
      setNickname(storedNickname);
      setCarModel(storedCarModel);

      const savedHistory = JSON.parse(localStorage.getItem(`history_${storedNickname}`) || '[]');
      setDiagnosisHistory(savedHistory);
    }
  }, [navigate]);

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // 히스토리 아이템 저장 및 갱신 함수
  const saveHistoryItem = (item, currentNickname) => {
    const targetNickname = currentNickname || nickname;
    if (!targetNickname) return;
    
    setDiagnosisHistory(prev => {
      const updated = [item, ...prev];
      localStorage.setItem(`history_${targetNickname}`, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    nickname,
    setNickname,
    carModel,
    setCarModel,
    diagnosisHistory,
    setDiagnosisHistory,
    handleLogout,
    saveHistoryItem
  };
}