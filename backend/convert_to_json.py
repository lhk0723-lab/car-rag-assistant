import json
import os
from pathlib import Path

def parse_markdown_to_dict(md_text, file_stem=""):
    lines = md_text.splitlines()
    data = {
        "vehicle": "Volvo XC60",
        "category": "",
        "keywords": [],  # [추가] 키워드 필드 초기화
        "torque_critical": False,
        "estimated_time": "정보 없음",
        "recommended_interval": "정보 없음",
        "difficulty": "정보 없음",
        "tools_required": [],
        "steps": []
    }
    
    parsed_steps = []
    current_title = ""
    current_desc_lines = []
    step_num = 1

    def save_current_step():
        nonlocal current_title, current_desc_lines, step_num
        if current_title:
            desc_text = " ".join(current_desc_lines).strip()
            parsed_steps.append({
                "step_number": step_num,
                "title": current_title,
                "description": desc_text
            })
            step_num += 1
            current_title = ""
            current_desc_lines = []

    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        # 메타데이터 파싱
        if line_stripped.startswith("정비 분류:"):
            data["category"] = line_stripped.replace("정비 분류:", "").strip()
            continue
        elif line_stripped.startswith("검색 키워드:"):
            # [추가] 마크다운에 "검색 키워드: 에어컨필터, 먼지필터" 형태로 적혀있을 때 파싱
            kw_str = line_stripped.replace("검색 키워드:", "").strip()
            data["keywords"] = [k.strip() for k in kw_str.replace(" 또는 ", ", ").split(",")]
            continue
        elif line_stripped.startswith("예상 작업 시간:"):
            data["estimated_time"] = line_stripped.replace("예상 작업 시간:", "").strip()
            continue
        elif line_stripped.startswith("권장 교환 주기:"):
            data["recommended_interval"] = line_stripped.replace("권장 교환 주기:", "").strip()
            continue
        elif line_stripped.startswith("난이도:"):
            data["difficulty"] = line_stripped.replace("난이도:", "").strip()
            continue
        elif line_stripped.startswith("필요 공구:"):
            tools_str = line_stripped.replace("필요 공구:", "").strip()
            data["tools_required"] = [t.strip() for t in tools_str.replace(" 또는 ", ", ").split(",")]
            continue
        
        # "N단계:" 패턴 감지 (예: "1단계: 작업 공간 확보...")
        if "단계:" in line_stripped and any(line_stripped.startswith(f"{i}단계") for i in range(1, 20)):
            save_current_step()
            # "1단계: 제목" 형태에서 "단계:" 뒤쪽의 제목만 추출
            parts = line_stripped.split("단계:", 1)
            current_title = parts[1].strip() if len(parts) > 1 else line_stripped
        elif current_title:
            # 단계 제목이 열려있는 상태라면 아래 내용들은 전부 설명(description)으로 누적
            current_desc_lines.append(line_stripped)

    # 마지막 단계 저장
    save_current_step()
    data["steps"] = parsed_steps

    # [추가] 만약 마크다운에 키워드가 직접 명시되지 않았다면, 파일 이름(file_stem)을 기반으로 기본 키워드 자동 주입
    if not data["keywords"] and file_stem:
        stem_lower = file_stem.lower()
        if "filter" in stem_lower or "cabin" in stem_lower or "air" in stem_lower:
            if "cabin" in stem_lower or "실내" in stem_lower:
                data["keywords"] = ["에어컨필터", "먼지필터", "캐빈필터", "실내필터", "cabin", "filter", "에어컨", "먼지"]
            else:
                data["keywords"] = ["에어크리너", "에어필터", "엔진에어", "크리너", "흡기", "air_cleaner", "aircleaner"]
        elif "wiper" in stem_lower or "와이퍼" in stem_lower:
            data["keywords"] = ["와이퍼", "블레이드", "와이퍼블레이드", "wiper", "blade"]
        else:
            data["keywords"] = [file_stem]

    return data

def convert_markdowns_to_json():
    # 실제 마크다운 파일이 위치한 절대 경로 지정
    markdown_dir = Path(r"C:\DIY\manual\volvo\xc60\markdown")
    # JSON이 저장될 출력 폴더 지정
    output_dir = Path(r"C:\DIY\manual\volvo\xc60")
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not markdown_dir.exists():
        print(f"마크다운 폴더를 찾을 수 없습니다: {markdown_dir}")
        return

    md_files = list(markdown_dir.glob("*.md"))
    if not md_files:
        print("변환할 마크다운 파일이 존재하지 않습니다.")
        return

    for md_file in md_files:
        # 파일명 매핑 (예: air_cleaner.md -> volvo_xc60_air_cleaner.json)
        file_stem = md_file.stem
        json_filename = f"volvo_xc60_{file_stem}.json"
        json_path = output_dir / json_filename
        
        with open(md_file, "r", encoding="utf-8") as f:
            md_content = f.read()
            
        # [수정] 파일 이름(file_stem)을 함께 전달하여 키워드 자동 생성 지원
        new_data = parse_markdown_to_dict(md_content, file_stem)
        
        # 만약 기존 JSON 파일이 존재한다면, 사용자가 추가해 둔 image/warning/key_point 등의 커스텀 데이터를 보존 병합
        if json_path.exists():
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                
                # [추가] 기존 JSON에 수동으로 넣어둔 커스텀 keywords가 있다면 최우선 보존
                if "keywords" in existing_data and existing_data["keywords"]:
                    new_data["keywords"] = existing_data["keywords"]

                # 기존 step별 커스텀 필드(image 등)를 새 데이터에 매핑
                existing_steps_map = {s.get("step_number"): s for s in existing_data.get("steps", [])}
                
                for new_step in new_data["steps"]:
                    s_num = new_step["step_number"]
                    if s_num in existing_steps_map:
                        old_step = existing_steps_map[s_num]
                        # 기존에 있던 이미지나 경고, 핵심포인트가 있다면 유지
                        if "image" in old_step:
                            new_step["image"] = old_step["image"]
                        if "warning" in old_step:
                            new_step["warning"] = old_step["warning"]
                        if "key_point" in old_step:
                            new_step["key_point"] = old_step["key_point"]
                            
            except Exception as e:
                print(f"기존 JSON 병합 중 경고 ({json_filename}): {e}")

        # JSON 파일로 저장
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(new_data, f, ensure_ascii=False, indent=4)
            
        print(f"[{json_filename}] 변환 및 저장 완료!")

if __name__ == "__main__":
    convert_markdowns_to_json()