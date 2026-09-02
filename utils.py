import json
import os
import streamlit as st
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

db_directory = "./chroma_db"

@st.cache_resource
def load_vector_db():
    if os.path.exists(db_directory):
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        vector_store = Chroma(
            persist_directory=db_directory, embedding_function=embeddings
        )
        return vector_store
    return None

# 💡 수정된 스마트 JSON 검색 함수
def find_matched_part_by_vehicle(vehicle_name, text):
    vehicle_dir = os.path.join("data", "volvo", vehicle_name.lower().replace(" ", ""))
    if not os.path.exists(vehicle_dir):
        vehicle_dir = "data/volvo/xc60"
    
    if not os.path.exists(vehicle_dir):
        return None
    
    text_lower = text.lower()

    # 1순위: 입력된 텍스트나 클래스 이름(예: cabin_filter)이 JSON 파일명에 직접 포함되어 있는지 검사
    for filename in os.listdir(vehicle_dir):
        if filename.endswith(".json"):
            file_base_name = filename.replace(".json", "").lower()
            if file_base_name in text_lower or text_lower in file_base_name:
                return os.path.join(vehicle_dir, filename)

    # 2순위: 기존의 키워드(필터, 에어컨 등) 기반 매칭
    for filename in os.listdir(vehicle_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(vehicle_dir, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                category = data.get("category", "").lower()
                if any(kw in text_lower for kw in ["필터", "cabin", "에어컨", "air", "에어크리너"]):
                    if any(wk in category for wk in ["필터", "filter", "청정", "클리너"]):
                        return file_path
    return None

def render_detailed_guide(json_path):
    if json_path and os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            guide = json.load(f)

        st.markdown("---")
        st.markdown(f"### 📋 [{guide.get('category', '정비 가이드')}] 상세 정보")

        st.write(f"- **적용 차종**: {guide.get('vehicle', 'Volvo XC60')}")
        st.write(f"- **소요 시간**: {guide.get('estimated_time', '정보 없음')}")
        st.write(f"- **추천 주기**: {guide.get('recommended_interval', '정보 없음')}")
        st.write(f"- **난이도**: {guide.get('difficulty', '정보 없음')}")
        
        tools = guide.get('tools_required', [])
        if tools:
            st.write(f"- **필요 공구**: {', '.join(tools)}")

        st.markdown("#### 🛠️ [단계별 작업 순서]")
        json_dir = os.path.dirname(json_path)

        for step in guide.get('steps', []):
            step_num = step.get('step_number')
            title = step.get('title')
            desc = step.get('description')
            sub_desc = step.get('sub_description')
            warning = step.get('warning')
            key_point = step.get('key_point')
            img_data = step.get('image')

            st.markdown(f"**Step {step_num}. {title}**")
            st.markdown(f"> {desc}")
            
            if sub_desc:
                st.markdown(f"*(참고)* {sub_desc}")
            if warning:
                st.warning(f"⚠️ {warning}")
            if key_point:
                st.info(f"💡 {key_point}")

            if img_data:
                images = img_data if isinstance(img_data, list) else [img_data]
                for img_path in images:
                    if not os.path.exists(img_path):
                        combined_path = os.path.join(json_dir, img_path)
                        if os.path.exists(combined_path):
                            img_path = combined_path
                    
                    if os.path.exists(img_path):
                        st.image(img_path, caption=f"Step {step_num} 관련 이미지", use_container_width=True)
                    else:
                        st.caption(f"[이미지 파일 로드 실패: {img_path}]")
            
            st.markdown("---")