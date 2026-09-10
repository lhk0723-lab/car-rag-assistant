import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Lock, User, Smile } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  // 모드(로그인 <-> 회원가입)를 전환할 때 입력 필드들을 비워주는 함수
  const handleToggleMode = () => {
    setIsSignup(!isSignup);
    setUsername('');
    setPassword('');
    setNickname('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (isSignup && !nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    const endpoint = isSignup ? 'http://127.0.0.1:8000/api/signup' : 'http://127.0.0.1:8000/api/login';
    
    const requestBody = isSignup 
      ? { username, password, nickname } 
      : { username, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || '요청 처리 중 오류가 발생했습니다.');
      }

      if (isSignup) {
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        // 가입 완료 후 로그인 모드로 전환하며 입력창 초기화
        setIsSignup(false);
        setUsername('');
        setPassword('');
        setNickname('');
      } else {
        // 로그인 성공 시 username과 nickname을 모두 localStorage에 저장 (백엔드 연동 필수)
        if (data.username) {
          localStorage.setItem('username', data.username);
        }
        if (data.nickname) {
          localStorage.setItem('nickname', data.nickname);
        }

        alert('로그인 성공!');
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-600 rounded-full mb-3">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">NEXUS</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isSignup ? '신규 계정을 생성하세요' : '시스템 로그인이 필요합니다'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">아이디</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
          </div>

          {/* 회원가입 모드일 때만 나타나는 닉네임 입력 필드 */}
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">닉네임</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Smile className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="사용하실 닉네임을 입력하세요"
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">비밀번호</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg transition duration-200"
          >
            {isSignup ? '회원가입 하기' : '로그인'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-sm text-blue-400 hover:underline"
          >
            {isSignup ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}