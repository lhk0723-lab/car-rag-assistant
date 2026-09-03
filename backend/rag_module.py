import os
import ollama
import streamlit as st
from pathlib import Path
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

def get_rag_response(vector_store, prompt):
    if not vector_store:
        return "Vector DB를 찾을 수 없습니다."
    
    try:
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
        response = ollama.chat(model="llama3.2", messages=messages_payload)
        return response["message"]["content"]
    except Exception as e:
        return f"Ollama 에러: {e}"