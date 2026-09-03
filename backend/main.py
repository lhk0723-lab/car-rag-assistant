from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pathlib import Path

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

# pathlib을 이용한 크로스플랫폼 임시 디렉토리 설정
BASE_DIR = Path(__file__).resolve().parent
TEMP_DIR = BASE_DIR / "uploads_images"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# 서버 시작 시 YOLO 모델과 ChromaDB 벡터 스토어 로드
yolo_model = load_custom_model()
vector_store = load_vector_db()

@app.get("/")
def root():
    return {"message": "Volvo XC60 Maintenance FastAPI Server is running."}

@app.post("/api/diagnose")
async def diagnose_part(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file format.")
    
    file_path = TEMP_DIR / file.filename
    try:
        # 1. 업로드된 이미지를 임시 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. YOLO 비전 모듈로 부품 진단 수행 (str 변환 필요 시 파일 경로 전달 방식 확인)
        detected_class_name, display_image, confidence, error_msg = analyze_image_with_yolov8(
            str(file_path), yolo_model
        )
        
        if error_msg:
            return {
                "success": False,
                "message": error_msg
            }
        
        # 3. 인식된 부품 이름을 바탕으로 RAG 매뉴얼 검색 수행
        manual_info = None
        if detected_class_name and vector_store:
            query = f"볼보 XC60 {detected_class_name} 정비 방법 및 교체 주기"
            manual_info = get_rag_response(vector_store, query)

        return {
            "success": True,
            "detected_part": detected_class_name,
            "confidence": confidence,
            "manual_response": manual_info
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # 임시 파일 정리
        if file_path.exists():
            file_path.unlink()