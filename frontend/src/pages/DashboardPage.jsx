import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Wrench, LogOut, Upload, AlertCircle, CheckCircle, Loader2, Send } from 'lucide-react';

export default function DashboardPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 텍스트 질문 및 매뉴얼 관련 상태
  const [chatInput, setChatInput] = useState('');
  const [manualResult, setManualResult] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);

  // 파일 선택 시 실행
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setManualResult(null); // 새 이미지 올리면 기존 매뉴얼 초기화
    }
  };

  // 백엔드로 이미지 전송 및 진단 요청 (1단계: 부품 인식만 수행)
  const handleDiagnose = async () => {
    if (!selectedFile) {
      alert('진단할 부품 이미지를 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    setError(null);
    setManualResult(null);

    try {
      const response = await axios.post('http://localhost:8000/api/diagnose', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.message || '진단에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버 통신 중 오류가 발생했습니다. 백엔드 서버가 켜져 있는지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 텍스트 질문 전송 (인식된 부품 이름 part_name을 함께 전달)
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setLoadingChat(true);
    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: chatInput,
        part_name: result ? result.detected_part : null, // 👈 인식된 부품명(예: air_cleaner) 동반 전송
      });

      if (response.data.success) {
        setManualResult(response.data.manual_data);
      } else {
        alert(response.data.message || '관련 매뉴얼을 찾지 못했습니다.');
        setManualResult(null);
      }
    } catch (err) {
      console.error(err);
      alert('매뉴얼 검색 중 오류가 발생했습니다.');
    } finally {
      setLoadingChat(false);
    }
  };

  // 로그아웃 시 로그인 페이지로 이동
  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 상단 네비게이션 바 */}
      <header className="flex justify-between items-center px-8 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Wrench className="w-6 h-6 text-blue-500" />
          <span className="text-xl font-bold">Volvo XC60 AI 어시스턴트</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 좌측: 이미지 업로드 및 진단 요청 */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-400" />
              <span>부품 이미지 업로드</span>
            </h2>

            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition duration-200 relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
              ) : (
                <div className="py-12 text-gray-400">
                  <p>클릭하거나 이미지를 여기에 드래그하세요</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG 지원</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDiagnose}
            disabled={loading || !selectedFile}
            className={`mt-6 w-full py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition duration-200 ${
              loading || !selectedFile
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{loading ? 'AI 부품 분석 중...' : '부품 진단 시작하기'}</span>
          </button>
        </div>

        {/* 우측: 진단 결과 및 대화형 매뉴얼 가이드 */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">AI 진단 및 매뉴얼 결과</h2>

          <div className="flex-1 bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-y-auto flex flex-col justify-between">
            <div>
              {error && (
                <div className="flex items-center space-x-2 text-red-400 bg-red-950/50 p-3 rounded-lg border border-red-800 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-400 bg-green-950/50 p-3 rounded-lg border border-green-800">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-semibold">부품 인식 성공</span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">인식된 부품</span>
                    <p className="text-lg font-bold text-blue-400">{result.detected_part || '알 수 없음'}</p>
                    <p className="text-xs text-gray-500">신뢰도: {result.confidence.toFixed(1)}%</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-gray-500 text-sm text-center">
                  이미지를 업로드하고 진단을 시작하면<br />인식된 부품 이름이 여기에 표시됩니다.
                </div>
              )}

              {/* 매뉴얼 텍스트 + 단계별 사진 출력 영역 */}
              {manualResult && (
                <div className="mt-6 border-t border-gray-800 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-blue-400">📌 {manualResult.category}</h3>
                  {manualResult.steps && manualResult.steps.map((step) => (
                    <div key={step.step_number} className="bg-gray-800 p-3 rounded-lg border border-gray-700 space-y-2">
                      <p className="text-xs font-semibold text-gray-300">
                        Step {step.step_number}: {step.title}
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>
                      
                      {/* 단계별 이미지 출력 */}
                      {step.image && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {Array.isArray(step.image) ? (
                            step.image.map((imgUrl, idx) => (
                              <img
                                key={idx}
                                src={imgUrl}
                                alt={`step-${step.step_number}-${idx}`}
                                className="w-24 h-20 object-cover rounded border border-gray-600"
                              />
                            ))
                          ) : (
                            <img
                              src={step.image}
                              alt={`step-${step.step_number}`}
                              className="w-24 h-20 object-cover rounded border border-gray-600"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 텍스트 질문 입력 폼 */}
            <form onSubmit={handleChatSubmit} className="mt-6 flex gap-2 pt-3 border-t border-gray-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="예: 어떻게 교체해?"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loadingChat}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center transition duration-200"
              >
                {loadingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}