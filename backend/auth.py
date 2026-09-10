import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db
from .models import User

router = APIRouter(prefix="/api", tags=["Auth"])

class UserCreate(BaseModel):
    username: str
    password: str
    nickname: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: str
    current_password: Optional[str] = None
    new_nickname: Optional[str] = None
    new_password: Optional[str] = None
    car_model: Optional[str] = None

@router.post("/signup")
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 존재하는 아이디입니다.")

    hashed_password = bcrypt.hashpw(user_data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    new_user = User(
        username=user_data.username,
        nickname=user_data.nickname,
        hashed_password=hashed_password,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "회원가입이 완료되었습니다.",
        "username": new_user.username,
        "nickname": new_user.nickname,
    }

@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="아이디 또는 비밀번호가 일치하지 않습니다.")

    is_password_correct = bcrypt.checkpw(user_data.password.encode("utf-8"), user.hashed_password.encode("utf-8"))
    if not is_password_correct:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="아이디 또는 비밀번호가 일치하지 않습니다.")

    return {
        "message": "로그인 성공!",
        "username": user.username,
        "nickname": user.nickname,
    }

# ✅ 프론트엔드(DashboardPage.jsx)가 요구하는 'data' 객체 구조로 응답 반환
@router.post("/user/update")
def update_user(user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")

    # 비밀번호 변경 요청 처리
    if user_data.new_password:
        if not user_data.current_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="비밀번호를 변경하려면 현재 비밀번호를 입력해야 합니다.")
        
        is_password_correct = bcrypt.checkpw(user_data.current_password.encode("utf-8"), user.hashed_password.encode("utf-8"))
        if not is_password_correct:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="현재 비밀번호가 일치하지 않습니다.")
            
        hashed_password = bcrypt.hashpw(user_data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user.hashed_password = hashed_password

    # 닉네임 변경 요청 처리
    if user_data.new_nickname:
        user.nickname = user_data.new_nickname

    # 차량 모델 변경 요청 처리
    if user_data.car_model and hasattr(user, "car_model"):
        user.car_model = user_data.car_model

    db.commit()
    db.refresh(user)

    # ✅ 프론트엔드가 response.data.nickname으로 안전하게 읽을 수 있도록 'data'로 래핑
    return {
        "success": True,
        "message": "설정이 성공적으로 저장되었습니다.",
        "data": {
            "nickname": user.nickname,
            "username": user.username,
            "car_model": getattr(user, "car_model", None)
        }
    }