// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

/**
 * 1. 로그인 API (필요시 기존 코드 확인)
 */
export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
    return response.data;
};

/**
 * 2. 회원가입 API (필요시 기존 코드 확인)
 */
export const registerUser = async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
    return response.data;
};

/**
 * 3. 유저 정보(닉네임, 비밀번호 등) 수정 API
 */
export const updateUserSetting = async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/api/user/update`, userData);
    return response.data;
};

/**
 * 4. 부품 이미지 진단 API
 */
export const diagnosePart = async (formData) => {
    const response = await fetch(`${API_BASE_URL}/api/diagnose`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || '부품 인식 중 오류가 발생했습니다.');
    return data;
};

/**
 * 5. 챗봇 및 매뉴얼 검색 API (carModel 파라미터 포함)
 */
export const sendChatMessage = async (message, partName = null, carModel = null) => {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message, 
            part_name: partName,
            car_model: carModel // 👈 다차종 구분을 위해 차종 정보 전송
        }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || '요청 처리 중 오류가 발생했습니다.');
    return data;
};