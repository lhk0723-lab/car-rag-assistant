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