#!/bin/bash

# 오류 발생 시 스크립트 중단 방지 (선택적)
set -e

echo "=== AI Vehicle Maintenance Assistant 통합 실행기 ==="
echo

echo "[클린업] 기존 컨테이너 및 잔여 리소스 정리 중..."
docker rm -f ollama-server car-rag-app 2>/dev/null || true
docker compose down
if [ -d "vector_db" ]; then
    rm -rf vector_db
fi

echo
echo "========================================================"
echo "[1단계] 로컬 환경에서 매뉴얼 벡터 DB(ChromaDB) 구축 중..."
echo "========================================================"
python3 backend/ingest.py

echo
echo "========================================================"
echo "[2단계] 백엔드 및 AI 서버(Docker) 구동 시작"
echo "========================================================"
docker compose up --build -d

echo "서버 안정화 및 AI 모델 로딩 대기 중 (15초)..."
sleep 15

echo "LLaVA 비전 모델 확인 및 다운로드 중..."
docker exec ollama-server ollama pull llava

echo
echo "--------------------------------------------------------"
echo "[백엔드 & AI 서버 구동 완료!]"
echo " - 백엔드(Swagger) 접속 주소: http://localhost:8000/docs"
echo "--------------------------------------------------------"
echo

echo "========================================================"
echo "[3단계] 프론트엔드(React) 패키지 설치 및 실행 시작"
echo "========================================================"
cd frontend

echo "- npm 패키지 설치 중... (잠시만 기다려주세요)"
npm install

echo "- 리액트 개발 서버 실행 중..."
# 맥 터미널(Terminal.app 또는 iTerm)에 새 탭/창을 띄워 실행
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS인 경우 새로운 Terminal 창을 띄워 실행
    osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"' && npm run dev"'
else
    # 일반 Linux 환경인 경우 백그라운드나 현재 창에서 실행
    npm run dev &
fi

echo
echo "--------------------------------------------------------"
echo "  [프론트엔드 서버 실행 완료!]"
echo "  - 프론트엔드 접속 주소:     http://localhost:5173"
echo "--------------------------------------------------------"
echo

echo "========================================================"
echo "모든 서비스가 성공적으로 구동되었습니다!"
echo "========================================================"
read -p "종료하려면 Enter 키를 누르세요..."