import json
import os
import ollama
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import streamlit as st
from ultralytics import YOLO

# 페이지 기본 설정
st.set_page_config(
    page_title="차량 정비 AI 어시스턴트 (RAG + YOLO)",
    page_icon="🚗",
    layout="centered",
)

st.title("🚗 볼보 XC60 AI 정비 어시스턴트 (RAG + YOLO)")
st.write(
    "에어컨 필터 사진을 업로드하거나 정비 방법을 물어보세요! 로컬 AI가 답변해 드립니다."
)

# 1. 임베딩 모델 및 로컬 ChromaDB 로드
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

vector_store = load_vector_db()

# 2. 커스텀 YOLOv8 모델 로드
@st.cache_resource
def load_cabin_model():
    model_path = "runs/detect/cabin_filter_result/weights/best.pt"
    if os.path.exists(model_path):
        return YOLO(model_path)
    return None

cabin_model = load_cabin_model()

# 💡 3. 차량별 폴더(C:\DIY\data\volvo\xc60 등)에서 상세 JSON을 검색하는 함수
def find_matched_part_by_vehicle(vehicle_name, text):
    # 차량 폴더 경로 설정 (예: data/volvo/xc60)
    vehicle_dir = os.path.join("data", "volvo", vehicle_name.lower().replace(" ", ""))
    if not os.path.exists(vehicle_dir):
        # 차종 폴더가 없으면 기본 경로로 대안 탐색
        vehicle_dir = "data/volvo/xc60"
    
    if not os.path.exists(vehicle_dir):
        return None, None
    
    for filename in os.listdir(vehicle_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(vehicle_dir, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # 에어컨 필터 관련 키워드 매칭 검사
                category = data.get("category", "").lower()
                if "필터" in text.lower() or "cabin" in text.lower() or "에어컨" in text.lower():
                    if "필터" in category or "filter" in category:
                        return file_path
    return None

# 💡 4. 새로운 상세 JSON 구조를 예쁘게 렌더링하는 함수 (단계별 이미지 및 서브 설명 지원)
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
        
        json_dir = os.path.dirname(json_path) # C:\DIY\data\volvo\xc60 폴더 기준

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

            # 이미지 렌더링 (단일 문자열 혹은 리스트 대응)
            if img_data:
                images = img_data if isinstance(img_data, list) else [img_data]
                for img_path in images:
                    # 절대경로 혹은 상대경로 조합 처리
                    if not os.path.exists(img_path):
                        combined_path = os.path.join(json_dir, img_path)
                        if os.path.exists(combined_path):
                            img_path = combined_path
                    
                    if os.path.exists(img_path):
                        st.image(img_path, caption=f"Step {step_num} 관련 이미지", use_container_width=True)
                    else:
                        st.caption(f"[이미지 파일 로드 실패: {img_path}]")
            
            st.markdown("---")

# 사이드바 상태 표시 및 부품 사진 업로드 기능
with st.sidebar:
    st.header("⚙️ 시스템 상태")
    if vector_store:
        st.success("✅ Vector DB (ChromaDB) 연동 완료")
    else:
        st.error("⚠️ ChromaDB가 없습니다.")

    if cabin_model:
        st.success("✅ YOLOv8 커스텀 모델 연동 완료")
    else:
        st.error("⚠️ YOLO 모델(`best.pt`)을 찾을 수 없습니다!")

    st.info("🤖 모델: Ollama (llama3.2) + YOLOv8")

    st.markdown("---")
    st.header("📸 부품 사진 인식 (Vision)")
    uploaded_file = st.file_uploader(
        "에어컨 필터 사진을 올려주세요", type=["jpg", "jpeg", "png"]
    )

    image_path = None
    if uploaded_file is not None:
        os.makedirs("temp_images", exist_ok=True)
        image_path = os.path.join("temp_images", uploaded_file.name)
        with open(image_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.image(
            image_path,
            caption="업로드된 부품 사진",
            use_container_width=True,
        )

# 세션 상태 초기화
if "messages" not in st.session_state:
    st.session_state.messages = [{
        "role": "assistant",
        "content": (
            "안녕하세요! 볼보 차량 정비 어시스턴트입니다. 에어컨 필터 사진을 올리고 "
            "'이게 뭐야?'라고 물어보시거나 정비 방법을 질문해 주세요! 🛠️"
        ),
        "json_path": None,
        "display_image": None
    }]

# 기존 대화 기록 출력
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if message.get("display_image") is not None:
            st.image(message["display_image"], caption="YOLOv8 부품 탐지 결과", use_container_width=True)
        if message.get("json_path"):
            render_detailed_guide(message["json_path"])

# 사용자 입력 (채팅창)
if prompt := st.chat_input("예: 에어컨필터 교체방법 알려줘 또는 이 부품이 뭐야?"):
    st.session_state.messages.append({"role": "user", "content": prompt, "json_path": None, "display_image": None})
    with st.chat_message("user"):
        st.markdown(prompt)
        if uploaded_file:
            st.info(f"📸 [사진 첨부됨: {uploaded_file.name}]")

    # AI 응답 생성 로직
    with st.chat_message("assistant"):
        with st.spinner("🔍 분석 중입니다..."):
            response_text = ""
            show_guide = False
            target_json_path = None
            display_image = None

            is_asking_guide = any(kw in prompt for kw in ["교체", "방법", "어떻게", "순서", "가이드", "알려줘", "교환"])

            # [시나리오 1] 사진이 업로드된 경우
            if image_path and os.path.exists(image_path) and uploaded_file is not None:
                if cabin_model is not None:
                    try:
                        results = cabin_model(image_path)
                        boxes = results[0].boxes
                        
                        if len(boxes) > 0:
                            res_plotted = results[0].plot()
                            display_image = res_plotted[..., ::-1] # BGR to RGB

                            # XC60 폴더 안의 상세 JSON 파일 경로 지정
                            target_json_path = "data/volvo/xc60/cabin_filter.json" # 파일명에 맞춰 조절 가능
                            if not os.path.exists(target_json_path):
                                target_json_path = find_matched_part_by_vehicle("Volvo XC60", "에어컨 필터")

                            if is_asking_guide:
                                show_guide = True
                                response_text = "🛠️ 사진 인식 결과와 함께 요청하신 볼보 XC60 에어컨 필터 상세 교체 가이드 및 단계별 작업 순서입니다."
                            else:
                                response_text = "📸 사진 분석 결과, 커스텀 YOLOv8 모델에 의해 **실내 공기 정화 필터(Cabin Air Filter)**로 식별되었습니다!"
                        else:
                            response_text = "⚠️ 사진에서 에어컨 필터를 감지하지 못했습니다. 다른 각도의 사진으로 시도해 주세요."
                    except Exception as e:
                        response_text = f"⚠️ YOLO 분석 에러: {e}"
                else:
                    response_text = "⚠️ YOLO 모델을 찾을 수 없습니다."

            # [시나리오 2] 사진 없이 텍스트로만 질문한 경우
            else:
                matched_path = find_matched_part_by_vehicle("Volvo XC60", prompt)
                
                if matched_path and is_asking_guide:
                    target_json_path = matched_path
                    show_guide = True
                    response_text = "🛠️ 요청하신 볼보 XC60 에어컨 필터 상세 교체 가이드 및 단계별 작업 순서입니다."
                elif matched_path:
                    target_json_path = matched_path
                    response_text = "인식된 부품 관련 매뉴얼이 있습니다. 교체 방법이 필요하시면 '교체 방법 알려줘'라고 말씀해 주세요!"
                else:
                    # RAG 검색 모드
                    if vector_store:
                        docs_and_scores = vector_store.similarity_search_with_score(prompt, k=4)
                        retrieved_context = "\n\n".join([doc.page_content for doc, score in docs_and_scores])
                        
                        system_prompt = f"""
                        너는 전문 자동차 정비 AI 어시스턴트야. 아래 문서 조각을 바탕으로 답변해 줘.
                        [검색된 정비 매뉴얼 문서 조각]
                        {retrieved_context}
                        """
                        messages_payload = [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt},
                        ]
                        try:
                            response = ollama.chat(model="llama3.2", messages=messages_payload)
                            response_text = response["message"]["content"]
                        except Exception as e:
                            response_text = f"⚠️ Ollama 에러: {e}"
                    else:
                        response_text = "⚠️ Vector DB를 찾을 수 없습니다."

            # 답변 출력
            st.markdown(response_text)

            if display_image is not None:
                st.image(display_image, caption="YOLOv8 부품 탐지 결과", use_container_width=True)

            if show_guide and target_json_path:
                render_detailed_guide(target_json_path)

            # 대화 기록 저장
            st.session_state.messages.append({
                "role": "assistant", 
                "content": response_text,
                "json_path": target_json_path if show_guide else None,
                "display_image": display_image
            })