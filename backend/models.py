from .database import Base
from sqlalchemy import Column, DateTime, Integer, String
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
    confidence = Column(String, nullable=True)           # 인식 신뢰도
    image_url = Column(String, nullable=True)            # 서버에 저장된 이미지 파일 경로 (예: /uploads/xxx.jpg)
    message = Column(String, nullable=True)              # 진단 결과 메시지
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 진단 일시