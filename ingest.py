import json
import os
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,  # 수정된 패키지 경로
)
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# 1. JSON 매뉴얼 파일 로드
json_file_path = "data/volvo/xc60/volvo_xc60_front_wiper.json"

if not os.path.exists(json_file_path):
  print(
      f"⚠️ '{json_file_path}' 파일을 찾을 수 없습니다. 경로를 확인해 주세요!"
  )
else:
  with open(json_file_path, "r", encoding="utf-8") as f:
    manual_data = json.load(f)

  # JSON 데이터를 텍스트 문서 형태로 보기 좋게 변환
  content_text = f"차량: {manual_data['vehicle']}\n"
  content_text += f"분류: {manual_data['category']}\n"
  content_text += f"예상 시간: {manual_data['estimated_time']}\n"
  content_text += f"권장 주기: {manual_data['recommended_interval']}\n"
  content_text += f"난이도: {manual_data['difficulty']}\n"
  content_text += (
      f"필요 공구: {', '.join(manual_data['tools_required'])}\n\n"
  )

  content_text += "[단계별 작업 순서]\n"
  for step in manual_data["steps"]:
    content_text += (
        f"Step {step['step_number']}. {step['title']}: {step['description']}\n"
    )
    if "sub_description" in step:
      content_text += f" - 참고: {step['sub_description']}\n"
    if "warning" in step:
      content_text += f" - 주의: {step['warning']}\n"
    if "key_point" in step:
      content_text += f" - 핵심: {step['key_point']}\n"

  # 2. 텍스트 청크 단위로 쪼개기 (Text Chunking)
  text_splitter = RecursiveCharacterTextSplitter(
      chunk_size=1000, chunk_overlap=100
  )
  docs = text_splitter.create_documents([content_text])
  print(f"📦 매뉴얼 문서가 총 {len(docs)}개의 청크(조각)로 분할되었습니다.")

  # 3. 오픈소스 임베딩 모델 로드 (한국어 처리가 우수한 가벼운 모델 사용)
  embeddings = HuggingFaceEmbeddings(
      model_name="sentence-transformers/all-MiniLM-L6-v2"
  )

  # 4. ChromaDB에 벡터 저장 (로컬 폴더 'chroma_db'에 영구 저장)
  db_directory = "./chroma_db"
  vector_store = Chroma.from_documents(
      documents=docs, embedding=embeddings, persist_directory=db_directory
  )

  print(
      "🚀 벡터화 및 ChromaDB 저장 완료! 'chroma_db' 폴더에 데이터가"
      " 생성되었습니다."
  )