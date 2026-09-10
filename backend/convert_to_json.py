import json
import os
from pathlib import Path

def parse_markdown_to_dict(md_text, file_stem=""):
    lines = md_text.splitlines()
    data = {
        "vehicle": "Volvo XC60",
        "category": "",
        "keywords": [],  # 키워드 필드 초기화
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
        
        # "N단계:" 패턴 감지
        if "단계:" in line_stripped and any(line_stripped.startswith(f"{i}단계") for i in range(1, 20)):
            save_current_step()
            parts = line_stripped.split("단계:", 1)
            current_title = parts[1].strip() if len(parts) > 1 else line_stripped
        elif current_title:
            current_desc_lines.append(line_stripped)

    # 마지막 단계 저장
    save_current_step()
    data["steps"] = parsed_steps
    
    # 👈 [필수] 파싱된 데이터를 반환하도록 추가됨
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
        file_stem = md_file.stem.lower()
        
        # 👈 [필수] 파일 이름 중복 방지 로직 (이미 volvo_xc60_로 시작하면 그대로 쓰고, 아니면 붙임)
        if file_stem.startswith("volvo_xc60_"):
            json_filename = f"{file_stem}.json"
        else:
            json_filename = f"volvo_xc60_{file_stem}.json"
            
        json_path = output_dir / json_filename
        
        with open(md_file, "r", encoding="utf-8") as f:
            md_content = f.read()
            
        new_data = parse_markdown_to_dict(md_content, file_stem)
        
        # 만약 기존 JSON 파일이 존재한다면 커스텀 데이터 보존 병합
        if json_path.exists():
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                
                if "keywords" in existing_data and existing_data["keywords"]:
                    new_data["keywords"] = existing_data["keywords"]

                existing_steps_map = {s.get("step_number"): s for s in existing_data.get("steps", [])}
                
                for new_step in new_data["steps"]:
                    s_num = new_step["step_number"]
                    if s_num in existing_steps_map:
                        old_step = existing_steps_map[s_num]
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