import json
import os
from pathlib import Path
import streamlit as st
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parent.parent
db_directory = str(BASE_DIR / "vector_db")

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

def find_matched_part_by_vehicle(vehicle_name, text):
    manual_volvo_dir = BASE_DIR / "manual" / "volvo"
    vehicle_dir = manual_volvo_dir / vehicle_name.lower().replace(" ", "")
    if not vehicle_dir.exists():
        vehicle_dir = manual_volvo_dir / "xc60"
    
    if not vehicle_dir.exists():
        return None
    
    text_lower = text.lower()
    
    best_match_path = None
    max_score = 0

    # 각 JSON 파일 내부의 "keywords" 필드를 동적으로 읽어와서 가장 적합한 파일 선택 (Scoring 방식)
    for filename in os.listdir(vehicle_dir):
        if filename.endswith(".json"):
            file_path = vehicle_dir / filename
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                score = 0
                keywords = data.get("keywords", [])
                
                # 1. JSON 내부에 정의된 keywords와 사용자 입력 대조 (구체적인 단어일수록 높은 가중치 부여)
                for kw in keywords:
                    kw_lower = kw.lower()
                    if kw_lower in text_lower:
                        score += len(kw_lower) * 10
                
                # 2. 파일명 직접 매칭 보완
                file_base_name = filename.replace(".json", "").lower()
                if file_base_name in text_lower:
                    score += 50
                
                # 3. 카테고리명 직접 매칭 보완
                category = data.get("category", "").lower()
                if any(word in text_lower for word in category.split() if len(word) > 1):
                    score += 20

                # 가장 높은 점수를 획득한 올바른 파일 선택
                if score > max_score:
                    max_score = score
                    best_match_path = str(file_path)

    return best_match_path if max_score > 0 else None

def render_detailed_guide(json_path):
    if json_path and os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            guide = json.load(f)

        st.markdown("---")
        st.markdown(f"### [{guide.get('category', '정비 가이드')}] 상세 정보")

        st.write(f"- 적용 차종: {guide.get('vehicle', 'Volvo XC60')}")
        st.write(f"- 소요 시간: {guide.get('estimated_time', '정보 없음')}")
        st.write(f"- 추천 주기: {guide.get('recommended_interval', '정보 없음')}")
        st.write(f"- 난이도: {guide.get('difficulty', '정보 없음')}")
        
        tools = guide.get('tools_required', [])
        if tools:
            st.write(f"- 필요 공구: {', '.join(tools)}")

        st.markdown("#### [단계별 작업 순서]")
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
                st.warning(f"경고: {warning}")
            if key_point:
                st.info(f"핵심: {key_point}")

            if img_data:
                images = img_data if isinstance(img_data, list) else [img_data]
                for img_path in images:
                    # [실무 표준 수정] BASE_DIR(프로젝트 루트) 기준으로 이미지 절대 경로 설정
                    full_img_path = BASE_DIR / img_path
                    
                    # 혹시 모를 상황을 대비한 차선책 경로 체크
                    if not full_img_path.exists():
                        fallback_path = Path(json_dir) / img_path
                        if fallback_path.exists():
                            full_img_path = fallback_path

                    if full_img_path.exists():
                        st.image(str(full_img_path), caption=f"Step {step_num} 관련 이미지", use_container_width=True)
                    else:
                        st.caption(f"[이미지 파일 로드 실패: {img_path}]")
            
            st.markdown("---")