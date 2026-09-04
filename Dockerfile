FROM python:3.10-slim

WORKDIR /app

# 1. 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 2. 파이썬 패키지 먼저 설치 (캐싱 활용)
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# 3. 소스코드, 매뉴얼 데이터 및 이미지 폴더 복사
COPY backend/ ./backend/
COPY manual/ ./manual/
COPY manual_images/ ./manual_images/

# 4. FastAPI 백엔드 서버 실행 (main.py)
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]