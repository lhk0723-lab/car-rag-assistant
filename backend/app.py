import json
import os
from pathlib import Path
import streamlit as st

# 분리한 모듈 임포트
from vision_module import load_custom_model, analyze_image_with_yolov8
from rag_module import load_vector_db, get_rag_response
from utils import find_matched_part_by_vehicle, render_detailed_guide

# 페이지 기본 설정
st.set_page_config(
    page_title="차량 정비 AI 어시스턴트 (RAG + YOLO)",
    page_icon="🚗",
    layout="centered",
)

st.title("볼보 XC60 AI 정비 어시스턴트 (RAG + YOLO)")
st.write(
    "부품 사진을 업로드하거나 정비 방법을 물어보세요! 로컬 AI가 답변해 드립니다."
)

# 데이터베이스 및 모델 로드
vector_store = load_vector_db()
cabin_model = load_custom_model()

# 경로 설정을 위한 BASE_DIR 정의 (pathlib 활용)
BASE_DIR = Path(__file__).resolve().parent.parent
MANUAL_DIR = BASE_DIR / "manual" / "volvo" / "xc60"
TEMP_DIR = BASE_DIR / "uploads_images"

# 사이드바 상태 표시 및 부품 사진 업로드 기능
with st.sidebar:
    st.header("시스템 상태")
    if vector_store:
        st.success("Vector DB (ChromaDB) 연동 완료")
    else:
        st.error("ChromaDB가 없습니다.")

    if cabin_model:
        st.success("YOLOv8 커스텀 모델 연동 완료")
    else:
        st.error("YOLO 모델(best.pt)을 찾을 수 없습니다!")

    st.info("모델: Ollama (llama3.2) + YOLOv8")

    st.markdown("---")
    st.header("부품 사진 인식 (Vision)")
    uploaded_file = st.file_uploader(
        "부품 사진을 올려주세요", type=["jpg", "jpeg", "png"]
    )

    image_path = None
    if uploaded_file is not None:
        TEMP_DIR.mkdir(parents=True, exist_ok=True)
        image_path = TEMP_DIR / uploaded_file.name
        with open(image_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.image(
            str(image_path),
            caption="업로드된 부품 사진",
            use_container_width=True,
        )

# 세션 상태 초기화
if "messages" not in st.session_state:
    st.session_state.messages = [{
        "role": "assistant",
        "content": (
            "안녕하세요! 볼보 차량 정비 어시스턴트입니다. 부품 사진을 올리고 "
            "'이게 뭐야?'라고 물어보시거나 정비 방법을 질문해 주세요!"
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
if prompt := st.chat_input("예: 에어크리너 교체방법 알려줘 또는 이 부품이 뭐야?"):
    st.session_state.messages.append({"role": "user", "content": prompt, "json_path": None, "display_image": None})
    with st.chat_message("user"):
        st.markdown(prompt)
        if uploaded_file:
            st.info(f"[사진 첨부됨: {uploaded_file.name}]")

    # AI 응답 생성 로직
    with st.chat_message("assistant"):
        with st.spinner("분석 중입니다..."):
            response_text = ""
            show_guide = False
            target_json_path = None
            display_image = None

            is_asking_guide = any(kw in prompt for kw in ["교체", "방법", "어떻게", "순서", "가이드", "알려줘", "교환"])

            # [시나리오 1] 사진이 업로드된 경우 (Vision 모듈 활용)
            if image_path and image_path.exists() and uploaded_file is not None:
                detected_class_name, display_image, confidence, err_msg = analyze_image_with_yolov8(
                    str(image_path), cabin_model, confidence_threshold=0.75
                )

                if detected_class_name:
                    # 변경된 파일명 규칙(volvo_xc60_[부품명].json)에 맞추어 경로 설정
                    target_json_path = MANUAL_DIR / f"volvo_xc60_{detected_class_name}.json"

                    if target_json_path.exists():
                        with open(target_json_path, "r", encoding="utf-8") as f:
                            json_data = json.load(f)
                            part_display_name = json_data.get("category", detected_class_name)
                    else:
                        part_display_name = detected_class_name
                        target_json_path = find_matched_part_by_vehicle("Volvo XC60", detected_class_name)

                    if is_asking_guide:
                        show_guide = True
                        response_text = f"사진 인식 결과 **[{part_display_name}]**(확률: {confidence:.1f}%)로 확인되어, 요청하신 볼보 XC60 상세 교체 가이드를 출력합니다."
                    else:
                        response_text = f"사진 분석 결과, 커스텀 YOLOv8 모델에 의해 **{part_display_name}**(확률: {confidence:.1f}%)로 식별되었습니다!"
                else:
                    response_text = err_msg

            # [시나리오 2] 사진 없이 텍스트로만 질문한 경우
            else:
                matched_path = find_matched_part_by_vehicle("Volvo XC60", prompt)
                
                if matched_path and is_asking_guide:
                    target_json_path = matched_path
                    show_guide = True
                    response_text = "요청하신 볼보 XC60 정비 가이드 및 단계별 작업 순서입니다."
                elif matched_path:
                    target_json_path = matched_path
                    response_text = "인식된 부품 관련 매뉴얼이 있습니다. 교체 방법이 필요하시면 '교체 방법 알려줘'라고 말씀해 주세요!"
                else:
                    # RAG 모듈 활용
                    response_text = get_rag_response(vector_store, prompt)

            # 답변 출력
            st.markdown(response_text)

            if display_image is not None:
                st.image(display_image, caption="YOLOv8 부품 탐지 결과", use_container_width=True)

            if show_guide and target_json_path:
                render_detailed_guide(str(target_json_path))

            # 대화 기록 저장
            st.session_state.messages.append({
                "role": "assistant", 
                "content": response_text,
                "json_path": str(target_json_path) if (show_guide and target_json_path) else None,
                "display_image": display_image
            })