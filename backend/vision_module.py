import os
from pathlib import Path
import streamlit as st
from ultralytics import YOLO

@st.cache_resource
def load_custom_model():
    # [실무 표준] 현재 이 파일(vision_module.py)의 절대 위치를 기준으로 기준점(BASE_DIR) 설정
    BASE_DIR = Path(__file__).resolve().parent
    
    # 1순위: 백엔드 내부 weights 폴더 경로 (C:\DIY\backend\weights\best.pt)
    model_path = BASE_DIR / "weights" / "best.pt"
    
    # 2순위 (안전장치): 혹시 모를 상황을 대비해 최상위 runs 폴더도 체크
    if not model_path.exists():
        fallback_path = BASE_DIR.parent / "runs" / "detect" / "car_part_result" / "weights" / "best.pt"
        if fallback_path.exists():
            model_path = fallback_path
            
    if model_path.exists():
        return YOLO(str(model_path)) # YOLO는 문자열 경로를 받으므로 str()로 변환
    return None

def analyze_image_with_yolov8(image_path, cabin_model, confidence_threshold=0.75):
    if not cabin_model:
        return None, None, 0.0, "YOLO 모델을 찾을 수 없습니다."
    
    try:
        results = cabin_model(image_path)
        boxes = results[0].boxes
        
        if len(boxes) > 0 and float(boxes[0].conf[0]) >= confidence_threshold:
            res_plotted = results[0].plot()
            display_image = res_plotted[..., ::-1]

            cls_id = int(boxes[0].cls[0])
            detected_class_name = cabin_model.names[cls_id].lower()
            confidence = float(boxes[0].conf[0]) * 100

            return detected_class_name, display_image, confidence, None
        else:
            return None, None, 0.0, "사진을 분석해 보았으나, 현재 학습된 부품에 해당하는 특징을 뚜렷하게 찾지 못했습니다."
    except Exception as e:
        return None, None, 0.0, f"YOLO 분석 에러: {e}"