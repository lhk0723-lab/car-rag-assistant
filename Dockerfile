# 파이썬 3.10 슬림 버전 사용
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

# 2. 파이썬 라이브러리 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. 💡 [핵심] 벡터 DB 생성에 필요한 데이터 파일과 스크립트를 먼저 복사!
COPY data/ ./data/
COPY ingest.py .

# 4. ⭐ 데이터나 ingest.py가 수정되었을 때만 벡터 DB를 다시 생성함!
RUN python ingest.py

# 5. 🚀 가장 마지막에 자주 수정되는 일반 소스코드(.py, .streamlit 등) 복사
COPY . .

EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0"]