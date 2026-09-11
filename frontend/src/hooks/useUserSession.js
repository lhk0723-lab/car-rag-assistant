// src/hooks/useUserSession.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserHistory, deleteHistoryItemApi } from '../services/api';

export function useUserSession() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [carModel, setCarModel] = useState('Volvo XC60 (2024)');
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);
  const [currentUsername, setCurrentUsername] = useState('');

  // 초기 로컬스토리지 로드 및 인증 검증 + 백엔드 DB 이력 불러오기
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    let storedNickname = '';
    let storedUsername = '';

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        storedNickname = parsed.nickname;
        // ⭐ 핵심: 닉네임이 username 자리를 대체하지 않도록 고유 아이디(username)만 정확히 추출
        storedUsername = parsed.username || localStorage.getItem('username');
      } catch (e) {
        storedNickname = localStorage.getItem('nickname');
        storedUsername = localStorage.getItem('username');
      }
    } else {
      storedNickname = localStorage.getItem('nickname');
      storedUsername = localStorage.getItem('username');
    }

    const storedCarModel = localStorage.getItem('carModel') || 'Volvo XC60 (2024)';

    // 고유 아이디가 없으면 로그인 페이지로 이동
    if (!storedUsername) {
      navigate('/login', { replace: true });
    } else {
      setNickname(storedNickname || storedUsername);
      setCarModel(storedCarModel);
      setCurrentUsername(storedUsername); // 👈 고정된 진짜 로그인 아이디 유지

      // ⭐ 백엔드 DB에서 해당 유저의 진단 이력 불러오기 (고유 username 기준)
      fetchUserHistory(storedUsername)
        .then(res => {
          if (res.success && res.history) {
            const formattedHistory = res.history.map(item => ({
              id: item.id,
              type: item.type || '부품 진단',
              title: item.title || item.detected_part || '진단 기록',
              date: item.created_at || item.date || new Date().toLocaleString(),
              image: item.image_url || item.image || null,
              detailText: item.message || item.detailText || ''
            }));
            setDiagnosisHistory(formattedHistory);
          }
        })
        .catch(err => {
          console.error("이력 불러오기 실패:", err);
        });
    }
  }, [navigate]);

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // 히스토리 아이템 저장 및 갱신 함수
  const saveHistoryItem = (item) => {
    const newItemWithId = {
      id: item.id || Date.now() + Math.random().toString(36).substr(2, 9),
      ...item
    };
    setDiagnosisHistory(prev => [newItemWithId, ...prev]);
  };

  // 이력 삭제 함수
  const deleteHistoryItem = async (historyId) => {
    if (!historyId) {
      alert('삭제할 항목의 고유 ID가 없습니다.');
      return;
    }

    try {
      const response = await deleteHistoryItemApi(historyId, currentUsername);
      if (response && response.success) {
        setDiagnosisHistory(prev => prev.filter(item => item.id !== historyId));
      } else {
        alert(response?.message || '이력 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error("이력 삭제 중 오류 발생:", err);
      alert('이력 삭제 중 서버 오류가 발생했습니다.');
    }
  };

  return {
    nickname,
    setNickname,
    carModel,
    setCarModel,
    diagnosisHistory,
    setDiagnosisHistory,
    currentUsername,
    handleLogout,
    saveHistoryItem,
    deleteHistoryItem
  };
}