# 파이썬 3.10 슬림 버전 사용
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 빌드 도구 및 Git 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 파이썬 의존성 파일 복사 및 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 나머지 소스코드 전체 복사
COPY . .

# ⭐ [핵심] 이미지 빌드할 때 미리 ChromaDB(벡터 DB) 생성하기!
RUN python ingest.py

# Streamlit 포트 개방
EXPOSE 8501

# 컨테이너 실행 시 Streamlit 앱 실행
CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0"]