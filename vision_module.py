import os
import streamlit as st
from ultralytics import YOLO

@st.cache_resource
def load_custom_model():
    model_path = "runs/detect/car_part_result/weights/best.pt"
    if not os.path.exists(model_path):
        model_path = "runs/detect/air_cleaner_result/weights/best.pt"
    if not os.path.exists(model_path):
        model_path = "runs/detect/cabin_filter_result/weights/best.pt"
        
    if os.path.exists(model_path):
        return YOLO(model_path)
    return None

def analyze_image_with_yolov8(image_path, cabin_model, confidence_threshold=0.75):
    if not cabin_model:
        return None, None, 0.0, "⚠️ YOLO 모델을 찾을 수 없습니다."
    
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
            return None, None, 0.0, "🤖 음... 사진을 분석해 보았으나, 현재 학습된 부품에 해당하는 특징을 뚜렷하게 찾지 못했습니다."
    except Exception as e:
        return None, None, 0.0, f"⚠️ YOLO 분석 에러: {e}"