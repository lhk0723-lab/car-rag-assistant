from .database import Base
from sqlalchemy import Column, DateTime, Integer, String, JSON
from sqlalchemy.sql import func


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(
        String, unique=True, index=True, nullable=False
    )  # 아이디
    nickname = Column(String, nullable=False)  # ⭐ 닉네임 컬럼 추가
    hashed_password = Column(String, nullable=False)  # 암호화된 비밀번호
    created_at = Column(
        DateTime(timezone=True), server_default=func.now()
    )  # 가입일시


class DiagnosisHistory(Base):
    __tablename__ = "diagnosis_histories"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, nullable=True)  # 업로드한 유저 아이디 매칭
    detected_part = Column(String, nullable=True)        # 진단된 부품명
    confidence = Column(String, nullable=True)            # 인식 신뢰도
    image_url = Column(String, nullable=True)             # 서버에 저장된 이미지 파일 경로 (예: /uploads/xxx.jpg)
    message = Column(String, nullable=True)               # 진단 결과 메시지

    # 👇 6, 7, 8번 문제 해결을 위해 아래 3개 컬럼 추가
    type = Column(String, default="부품 진단", nullable=True)  # 이력 종류 구분
    title = Column(String, nullable=True)                     # 이력 타이틀 저장
    steps = Column(JSON, nullable=True)                       # 정비 가이드 스텝 데이터 저장

    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 진단 일시