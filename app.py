import json
import os
import ollama
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import streamlit as st

# 페이지 기본 설정
st.set_page_config(
    page_title="차량 정비 AI 어시스턴트 (RAG + Vision)",
    page_icon="🚗",
    layout="centered",
)

st.title("🚗 볼보 XC60 AI 정비 어시스턴트 (RAG + Vision)")
st.write(
    "모르는 부품 사진을 업로드하거나 정비 방법을 물어보세요! 로컬"
    " AI(`llama3.2`)가 답변해 드립니다."
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

# 사이드바 상태 표시 및 💡 [1단계 추가] 부품 사진 업로드 기능
with st.sidebar:
  st.header("⚙️ 시스템 상태")
  if vector_store:
    st.success("✅ Vector DB (ChromaDB) 연동 완료")
    st.info("🤖 모델: Ollama (llama3.2)")
  else:
    st.error("⚠️ ChromaDB가 없습니다. `ingest.py`를 먼저 실행해주세요!")

  st.markdown("---")
  st.header("📸 부품 사진 인식 (Vision)")
  # 파일 업로더 생성 (사이드바에 배치하면 깔끔합니다)
  uploaded_file = st.file_uploader(
      "모르는 부품 사진을 올려주세요", type=["jpg", "jpeg", "png"]
  )

  # 업로드된 이미지가 있다면 화면에 미리보기 및 임시 저장 처리
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

# 세션 상태에 대화 기록 초기화
if "messages" not in st.session_state:
  st.session_state.messages = [{
      "role": "assistant",
      "content": (
          "안녕하세요! 볼보 XC60 정비 어시스턴트입니다. 부품 사진을 올리고"
          " '이게 뭐야?'라고 물어보시거나 정비 방법을 질문해 주세요! 🛠️"
      ),
  }]

# 기존 대화 기록 출력
for message in st.session_state.messages:
  with st.chat_message(message["role"]):
    st.markdown(message["content"])

# 사용자 입력 (채팅창)
if prompt := st.chat_input("예: 이 부품이 뭐야? 또는 에어컨필터 교체해줘"):
  # 사용자 메시지 세션에 추가 및 화면 출력
  st.session_state.messages.append({"role": "user", "content": prompt})
  with st.chat_message("user"):
    st.markdown(prompt)
    if uploaded_file:
      st.info(f"📸 [사진 첨부됨: {uploaded_file.name}]")

  # AI 응답 생성 로직
  with st.chat_message("assistant"):
    with st.spinner(
        "🔍 AI가 질문과 사진을 분석하고 답변을 생성 중입니다..."
    ):
      response_text = ""

      # 💡 [핵심] 사진이 첨부된 경우 (시나리오 1: 부품 식별 모드)
      if image_path and os.path.exists(image_path):
        vision_prompt = f"""
        너는 대한민국 최고의 20년 차 자동차 전문 정비사야. 
        사용자가 업로드한 자동차 부품 사진을 보고, 정확한 자동차 부품 명칭(예: 스파크 플러그, 캐빈 에어컨 필터, 브레이크 패드 등)을 분석해 줘.
        만약 잘 모르는 부품이거나 자동차 부품이 아니라면 솔직하게 모른다고 말해줘. 
        '진동기'나 '잠자리' 같은 엉뚱한 번역이나 환각(Hallucination)은 절대 금지야.
        
        그리고 이 부품이 무엇인지 명확히 알려준 뒤, 만약 우리 정비 매뉴얼에 있는 부품(예: 에어컨 필터)이라면 교체 가이드가 필요한지 친절하게 물어봐 줘.
        
        사용자 질문: {prompt}
        """
        try:
          # Ollama 멀티모달 호출 (images 파라미터에 이미지 경로 전달)
          response = ollama.chat(
              model="llava",
              messages=[{
                  "role": "user",
                  "content": vision_prompt,
                  "images": [image_path],
              }],
          )
          response_text = response["message"]["content"]
        except Exception as e:
          response_text = f"⚠️ 이미지 분석 중 에러가 발생했습니다: {e}"

      # 💡 사진이 없고 텍스트 질문만 있는 경우 (기존 RAG 모드)
      elif vector_store:
        docs_and_scores = vector_store.similarity_search_with_score(prompt, k=4)
        retrieved_context = "\n\n".join(
            [doc.page_content for doc, score in docs_and_scores]
        )

        system_prompt = f"""
        너는 전문 자동차 정비 AI 어시스턴트야. 아래에 제공된 '검색된 정비 매뉴얼 문서 조각'을 바탕으로 사용자의 질문에 친절하고 빠짐없이 답변해 줘.
        
        [검색된 정비 매뉴얼 문서 조각]
        {retrieved_context}
        """
        messages_payload = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]
        try:
          response = ollama.chat(model="llava", messages=messages_payload)
          response_text = response["message"]["content"]
        except Exception as e:
          response_text = f"⚠️ Ollama 호출 중 에러가 발생했습니다: {e}"
      else:
        response_text = (
            "⚠️ Vector DB를 찾을 수 없습니다. `ingest.py`를 먼저 실행해 주세요!"
        )

      # 5. 화면에 AI 텍스트 답변 출력
      st.markdown(response_text)

      # 6. (텍스트 RAG 질문일 때만 작동) JSON 매뉴얼 단계별 가이드 출력
      # 사용자가 에어컨필터 관련 키워드를 물었을 때 기존처럼 상세 가이드가 튀어나오도록 유지
      json_path = "data/volvo/xc60/volvo_xc60_cabin_filter.json"
      if (
          not image_path
          and os.path.exists(json_path)
          and ("필터" in prompt or "에어컨" in prompt or "교체" in prompt)
      ):
        with open(json_path, "r", encoding="utf-8") as f:
          manual_data = json.load(f)

        st.markdown("---")
        st.markdown("### 🛠️ 단계별 정비 가이드 및 참고 사진")

        if manual_data.get("torque_critical", False):
          st.error(
              "⚠️ **주의:** 본 정비는 부품 파손 및 안전을 위해 공식 정비"
              " 매뉴얼의 규정 토크(Nm)를 확인하고 **반드시 토크렌치를"
              " 사용**해야 합니다."
          )

        for step in manual_data.get("steps", []):
          st.markdown(f"**Step {step['step_number']}. {step['title']}**")
          st.write(step["description"])

          img_data = step.get("image")
          if img_data:
            if isinstance(img_data, list):
              for img_file in img_data:
                img_path_file = (
                    img_file
                    if img_file.startswith("images")
                    else os.path.join("images", "cabin_filter", img_file)
                )
                if os.path.exists(img_path_file):
                  st.image(img_path_file, use_container_width=True)
            else:
              img_path_file = (
                  img_data
                  if img_data.startswith("images")
                  else os.path.join("images", "cabin_filter", img_data)
              )
              if os.path.exists(img_path_file):
                st.image(img_path_file, use_container_width=True)
          st.markdown("")

      # 세션에 어시스턴트 응답 추가
      st.session_state.messages.append(
          {"role": "assistant", "content": response_text}
      )