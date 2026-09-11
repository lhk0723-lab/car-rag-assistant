import json
import os
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import User, DiagnosisHistory  # ⭐ DiagnosisHistory 모델 임포트 추가

# 1. FastAPI 앱 인스턴스 생성 (타이틀과 버전 포함)
app = FastAPI(title="Volvo XC60 AI Maintenance API", version="1.0")

# 2. 서버 시작 시 데이터베이스 테이블 자동 생성
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

# 3. auth 라우터 등록
from .auth import router as auth_router
app.include_router(auth_router)

# 기존 모듈에서 실제 함수 임포트
from .vision_module import analyze_image_with_yolov8, load_custom_model
from .rag_module import load_vector_db, get_rag_response

# 프론트엔드 연동을 위한 CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 경로 설정
BASE_DIR = Path(__file__).resolve().parent

# 1. manual_images 폴더 정적 서빙 마운트
MANUAL_IMAGES_DIR = BASE_DIR.parent / "manual_images"
app.mount("/manual_images", StaticFiles(directory=str(MANUAL_IMAGES_DIR)), name="manual_images")

# ⭐ 2. backend/uploads 폴더 생성 및 정적 서빙 마운트 (이미지 영구 저장용)
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# 3. JSON 매뉴얼 파일들이 위치한 디렉토리 경로
MANUALS_DIR = BASE_DIR.parent / "manual"
if not MANUALS_DIR.exists():
    MANUALS_DIR = BASE_DIR.parent / "manuals"

# 서버 시작 시 YOLO 모델과 ChromaDB 벡터 스토어 로드
yolo_model = load_custom_model()
vector_store = load_vector_db()

# 프론트엔드 텍스트 질문을 위한 Pydantic 모델
class QueryRequest(BaseModel):
    message: str
    part_name: Optional[str] = None
    car_model: Optional[str] = None

# 사용자 설정 변경을 위한 Pydantic 모델 (username 필드 포함)
class UserUpdateRequest(BaseModel):
    username: str
    current_nickname: Optional[str] = None
    new_nickname: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    car_model: Optional[str] = None

# 매뉴얼 스텝 내의 상대 경로 이미지들을 웹 URL로 변환해주는 함수
def format_manual_images(manual_data):
    if not manual_data or not isinstance(manual_data, dict):
        return manual_data
    
    steps = manual_data.get("steps", [])
    for step in steps:
        if "image" in step:
            img_field = step["image"]
            if isinstance(img_field, list):
                step["image"] = [f"http://localhost:8000/{img}" for img in img_field]
            elif isinstance(img_field, str):
                step["image"] = f"http://localhost:8000/{img_field}"
                
    return manual_data

# 스마트 파일 검색 함수
def search_manual_comprehensive(user_query: str, part_name: Optional[str] = None, car_model: Optional[str] = None):
    if not MANUALS_DIR.exists():
        return None
        
    query_lower = user_query.lower()
    json_files = list(MANUALS_DIR.rglob("*.json"))
    
    if car_model and part_name:
        base_model = car_model.split("(")[0].strip()
        clean_car_model = base_model.lower().replace(" ", "_")
        target_filename = f"{clean_car_model}_{part_name.lower()}.json"
        target_file_path = MANUALS_DIR / target_filename
        
        if target_file_path.exists():
            with open(target_file_path, "r", encoding="utf-8") as f:
                return json.load(f)

    best_match = None
    max_score = 0
    
    for json_file in json_files:
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue
            
        score = 0
        keywords = data.get("keywords", [])
        file_stem = json_file.stem.lower()
        category = data.get("category", "").lower()
        
        if file_stem in query_lower or category in query_lower:
            score += 60
            
        matched_keywords_count = 0
        for kw in keywords:
            kw_lower = kw.lower()
            if len(kw_lower) > 1 and kw_lower in query_lower:
                score += len(kw_lower) + 20
                matched_keywords_count += 1
                
        if matched_keywords_count == 0 and file_stem not in query_lower and category not in query_lower:
            score = 0
            
        if score > max_score:
            max_score = score
            best_match = data

    if max_score >= 20 and best_match:
        return best_match

    if part_name:
        target_part = part_name.lower()
        for json_file in json_files:
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                keywords = [kw.lower() for kw in data.get("keywords", [])]
                category = data.get("category", "").lower()
                
                if (target_part in json_file.stem.lower() or 
                    target_part in category or 
                    any(target_part in kw for kw in keywords)):
                    return data
            except Exception:
                continue

    generic_keywords = ["교체", "방법", "어떻게", "알려줘", "순서", "해줘", "보여줘", "설명", "가이드", "정비", "와", "의", "를", "은", "는", "교환"]
    query_words = [w for w in query_lower.replace("?", "").replace("!", "").split() if w not in generic_keywords and len(w) > 1]
    
    if len(query_words) > 0:
        return None

    if max_score > 0 and best_match:
        return best_match
        
    return None

@app.get("/")
def root():
    return {"message": "Volvo XC60 AI Maintenance API is running."}

# [기능 1] 이미지 업로드 및 YOLO 비전 진단 (⭐ 수정: uploads 폴더 영구 저장 및 DB 이력 기록 추가)
@app.post("/api/diagnose")
async def diagnose_part(
    file: UploadFile = File(...),
    username: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file format.")
    
    temp_file_path = None
    saved_file_url = None
    try:
        contents = await file.read()
        
        # 1. YOLO 분석용 임시 파일 생성
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name
            
        # 2. backend/uploads 폴더에 파일 영구 물리 저장
        import time
        safe_filename = f"{int(time.time())}_{file.filename}"
        permanent_file_path = UPLOAD_DIR / safe_filename
        with open(permanent_file_path, "wb") as perm_file:
            perm_file.write(contents)
            
        saved_file_url = f"/uploads/{safe_filename}"

        # 3. YOLO 모델 분석 실행
        detected_class_name, display_image, confidence, error_msg = analyze_image_with_yolov8(
            temp_file_path, yolo_model
        )
        
        if error_msg:
            return {"success": False, "message": error_msg}
        
        if confidence < 90.0:
            return {
                "success": False,
                "message": f"인식 신뢰도({confidence:.1f}%)가 90% 미만이거나 등록되지 않은 부품입니다. 올바른 부품 사진을 업로드해주세요."
            }
        
        response_message = f"업로드하신 부품은 해당 차량의 {detected_class_name}입니다. 교체 방법을 원하시면 \"{detected_class_name} 교체 방법 알려줘\"라고 입력해 주세요!"

        # 4. SQLite (app.db) DB에 진단 이력 및 이미지 경로(image_url) 저장
        if username:
            db_history = DiagnosisHistory(
                username=username,
                detected_part=detected_class_name,
                confidence=f"{confidence:.1f}%",
                image_url=saved_file_url,
                message=response_message
            )
            db.add(db_history)
            db.commit()

        return {
            "success": True,
            "detected_part": detected_class_name,
            "confidence": confidence,
            "image_url": saved_file_url,  # 프론트엔드 모달 확대용 경로 전달
            "message": response_message
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

# [기능 2] 텍스트 질문으로 매뉴얼 가져오기
@app.post("/api/chat")
async def chat_manual(request: QueryRequest):
    user_query = request.message
    part_name = request.part_name
    car_model = request.car_model
    
    raw_manual = search_manual_comprehensive(user_query, part_name, car_model)
    
    if not raw_manual:
        return {
            "success": False,
            "message": "입력하신 부품이나 관련된 정비 매뉴얼을 찾지 못했습니다."
        }
        
    formatted_manual = format_manual_images(raw_manual)
    
    return {
        "success": True,
        "matched_category": formatted_manual.get("category"),
        "manual_data": formatted_manual
    }

# [기능 3] 사용자 정보(닉네임, 비밀번호, 차량 모델) 수정 API
@app.post("/api/user/update")
async def update_user_settings(request: UserUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    # 2. 비밀번호 변경 요청 처리
    if request.new_password:
        if not request.current_password:
            raise HTTPException(status_code=400, detail="현재 비밀번호를 입력해주세요.")
        
        current_pw_field = getattr(user, "password", None) or getattr(user, "hashed_password", None)
        if current_pw_field and current_pw_field != request.current_password:
            try:
                import bcrypt
                if not bcrypt.checkpw(request.current_password.encode("utf-8"), current_pw_field.encode("utf-8")):
                    raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")
            except Exception:
                raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")

        # 새로운 비밀번호 설정
        try:
            import bcrypt
            hashed_pw = bcrypt.hashpw(request.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            if hasattr(user, "hashed_password"):
                user.hashed_password = hashed_pw
            elif hasattr(user, "password"):
                user.password = hashed_pw
        except Exception:
            if hasattr(user, "password"):
                user.password = request.new_password

    # 3. 닉네임 변경 요청 처리
    if request.new_nickname:
        if hasattr(user, "nickname"):
            user.nickname = request.new_nickname
        elif hasattr(user, "username"):
            user.username = request.new_nickname

    # 4. 차량 모델 변경 요청 처리
    if request.car_model and hasattr(user, "car_model"):
        user.car_model = request.car_model

    db.commit()
    db.refresh(user)

    updated_nickname = getattr(user, "nickname", None) or getattr(user, "username", request.new_nickname)
    updated_car_model = getattr(user, "car_model", request.car_model)

    # ✅ 프론트엔드(DashboardPage.jsx)의 response.data.nickname 접근 방식에 맞춤
    return {
        "success": True,
        "message": "설정이 성공적으로 업데이트되었습니다.",
        "nickname": updated_nickname,
        "car_model": updated_car_model
    }

# [기능 4] 로그인한 사용자의 진단 및 채팅 이력 조회 API (⭐ 새로 추가)
@app.get("/api/history")
async def get_user_history(username: str, db: Session = Depends(get_db)):
    try:
        # 해당 유저의 이력을 최신순으로 조회
        histories = db.query(DiagnosisHistory).filter(
            DiagnosisHistory.username == username
        ).order_by(DiagnosisHistory.created_at.desc()).all()
        
        history_list = []
        for h in histories:
            # 프론트엔드 모달/화면에서 바로 로드할 수 있도록 절대 경로(URL)로 변환
            img_url = h.image_url
            if img_url and not img_url.startswith("http"):
                img_url = f"http://localhost:8000{img_url}"
                
            history_list.append({
                "id": h.id,
                "detected_part": h.detected_part,
                "confidence": h.confidence,
                "image_url": img_url,
                "message": h.message,
                "created_at": h.created_at.strftime("%Y-%m-%d %H:%M:%S") if h.created_at else None
            })
            
        return {
            "success": True,
            "history": history_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))