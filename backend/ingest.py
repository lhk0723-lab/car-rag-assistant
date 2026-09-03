import json
import os
from pathlib import Path
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parent.parent

# JSON 파일들이 저장된 디렉토리 지정
json_dir = BASE_DIR / "manual" / "volvo" / "xc60"
db_directory = str(BASE_DIR / "vector_db")

print(f"매뉴얼 폴더 경로: {json_dir}")
print(f"벡터 DB 저장 경로: {db_directory}")

if not json_dir.exists():
    print(f"'{json_dir}' 폴더를 찾을 수 없습니다. 경로를 확인해 주세요!")
else:
    # 해당 폴더 내의 모든 .json 파일을 동적으로 순회
    json_files = list(json_dir.glob("*.json"))
    
    if not json_files:
        print("인덱싱할 JSON 파일이 존재하지 않습니다.")
    else:
        all_docs = []
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=100
        )

        for json_file_path in json_files:
            with open(json_file_path, "r", encoding="utf-8") as f:
                manual_data = json.load(f)

            content_text = f"차량: {manual_data.get('vehicle', 'Volvo XC60')}\n"
            content_text += f"분류: {manual_data.get('category', '')}\n"

            # [핵심 추가] JSON 내부에 선언된 keywords를 텍스트에 포함시켜 벡터 검색력 강화
            keywords = manual_data.get("keywords", [])
            if keywords:
                content_text += f"검색 키워드: {', '.join(keywords)}\n"

            content_text += f"예상 시간: {manual_data.get('estimated_time', '')}\n"
            content_text += f"권장 주기: {manual_data.get('recommended_interval', '')}\n"
            content_text += f"난이도: {manual_data.get('difficulty', '')}\n"
            content_text += f"필요 공구: {', '.join(manual_data.get('tools_required', []))}\n\n"

            content_text += "[단계별 작업 순서]\n"
            for step in manual_data.get("steps", []):
                content_text += f"Step {step.get('step_number', '')}. {step.get('title', '')}: {step.get('description', '')}\n"
                if "sub_description" in step:
                    content_text += f" - 참고: {step['sub_description']}\n"
                if "warning" in step:
                    content_text += f" - 주의: {step['warning']}\n"
                if "key_point" in step:
                    content_text += f" - 핵심: {step['key_point']}\n"

            docs = text_splitter.create_documents([content_text])
            all_docs.extend(docs)
            print(f"[{json_file_path.name}] 문서 {len(docs)}개 청크로 분할 완료.")

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        # 모든 JSON 파일의 문서를 모아 벡터화하여 'vector_db' 폴더에 로컬 벡터 DB로 저장
        vector_store = Chroma.from_documents(
            documents=all_docs, embedding=embeddings, persist_directory=db_directory
        )

        print(f"총 {len(all_docs)}개의 문서 청크 벡터화 및 ChromaDB 저장 완료! 'vector_db' 폴더가 업데이트되었습니다.")