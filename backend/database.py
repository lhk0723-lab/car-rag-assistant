import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. 현재 database.py 파일이 있는 폴더(즉, backend 폴더)의 절대 경로를 가져옴
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. backend 폴더 바로 아래에 app.db가 생성되도록 경로 결합
db_path = os.path.join(BASE_DIR, "app.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

# SQLite 사용 시 멀티스레드 환경 에러 방지를 위한 connect_args 설정
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 데이터베이스 세션 생성 팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모델(테이블) 정의를 위한 베이스 클래스
Base = declarative_base()


# FastAPI 의존성 주입(Dependency)용 함수: API 요청마다 DB 세션을 열고 닫아줍니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()