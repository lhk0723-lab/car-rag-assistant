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
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. 소스코드, 매뉴얼 데이터 및 이미지 폴더를 전부 컨테이너 내부로 복사
COPY backend/ ./backend/
COPY manual/ ./manual/
COPY manual_images/ ./manual_images/   # <--- 이 부분을 추가해 줍니다!

# 4. 복사가 모두 끝난 후, backend/ingest.py를 실행하여 루트에 vector_db 생성
RUN python backend/ingest.py

# 5. Streamlit 앱 실행
EXPOSE 8501
CMD ["streamlit", "run", "backend/app.py", "--server.port=8501", "--server.address=0.0.0.0"]