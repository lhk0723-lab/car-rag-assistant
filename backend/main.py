import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil
from pathlib import Path
from typing import Optional

# 기존 모듈에서 실제 함수 임포트
from vision_module import analyze_image_with_yolov8, load_custom_model
from rag_module import load_vector_db, get_rag_response

app = FastAPI(title="Volvo XC60 AI Maintenance API", version="1.0")

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
TEMP_DIR = BASE_DIR / "uploads_images"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# 1. manual_images 폴더 정적 서빙 마운트
MANUAL_IMAGES_DIR = BASE_DIR.parent / "manual_images"
app.mount("/manual_images", StaticFiles(directory=str(MANUAL_IMAGES_DIR)), name="manual_images")

# 2. JSON 매뉴얼 파일들이 위치한 디렉토리 경로 (diy/manual/volvo/xc60 구조 반영)
MANUALS_DIR = BASE_DIR.parent / "manual" / "volvo" / "xc60"
if not MANUALS_DIR.exists():
    MANUALS_DIR = BASE_DIR.parent / "manuals"

# 서버 시작 시 YOLO 모델과 ChromaDB 벡터 스토어 로드
yolo_model = load_custom_model()
vector_store = load_vector_db()

# 프론트엔드 텍스트 질문을 위한 Pydantic 모델 (선택적으로 부품 이름도 받을 수 있도록 확장)
class QueryRequest(BaseModel):
    message: str
    part_name: Optional[str] = None

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

# 키워드 및 부품명으로 JSON 매뉴얼을 찾는 스마트 검색 함수
def search_manual_comprehensive(user_query: str, part_name: Optional[str] = None):
    if not MANUALS_DIR.exists():
        return None
        
    query_lower = user_query.lower()
    
    # 1. 만약 진단된 부품 이름이 있거나 쿼리 내에 부품명이 포함된 경우 우선 매칭
    target_part = part_name.lower() if part_name else None
    
    for json_file in MANUALS_DIR.glob("*.json"):
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        file_stem = json_file.stem.lower() # 예: volvo_xc60_air_cleaner 등
        keywords = [kw.lower() for kw in data.get("keywords", [])]
        category = data.get("category", "").lower()
        
        # 조건 1: 전달받은 인식 부품명이 파일명에 포함된 경우
        if target_part and target_part in file_stem:
            return data
            
        # 조건 2: 사용자가 텍스트에 부품 파일명, 카테고리, 또는 내부 키워드를 직접 입력한 경우
        if file_stem in query_lower or any(kw in query_lower for kw in keywords) or any(word in query_lower for word in category.split()):
            return data
            
        # 조건 3: 기존 키워드 단순 포함 검사
        for kw in keywords:
            if kw in query_lower:
                return data
                
    return None

@app.get("/")
def root():
    return {"message": "Volvo XC60 Maintenance FastAPI Server is running."}

# [기능 1] 이미지 업로드 및 YOLO 비전 진단
@app.post("/api/diagnose")
async def diagnose_part(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file format.")
    
    file_path = TEMP_DIR / file.filename
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        detected_class_name, display_image, confidence, error_msg = analyze_image_with_yolov8(
            str(file_path), yolo_model
        )
        
        if error_msg:
            return {
                "success": False,
                "message": error_msg
            }
        
        # 🛑 신뢰도 90% 미만일 경우 학습되지 않은 부품으로 간주하고 차단 (임계값 90.0 적용)
        if confidence < 90.0:
            return {
                "success": False,
                "message": "인식 신뢰도가 90% 미만이거나 등록되지 않은 부품입니다. 올바른 부품 사진을 업로드해주세요."
            }
        
        return {
            "success": True,
            "detected_part": detected_class_name,
            "confidence": confidence,
            "message": f"업로드하신 부품은 Volvo XC60 {detected_class_name}입니다. 교체 방법을 안내해 드릴까요?"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if file_path.exists():
            file_path.unlink()

# [기능 2] 텍스트 질문으로 매뉴얼 텍스트 + 사진 가져오기 (직접 입력 및 부품 인식 연동 모두 지원)
@app.post("/api/chat")
async def chat_manual(request: QueryRequest):
    user_query = request.message
    part_name = request.part_name
    
    raw_manual = search_manual_comprehensive(user_query, part_name)
    
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