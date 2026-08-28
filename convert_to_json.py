import json

# 방금 작성한 매뉴얼 데이터를 딕셔너리 구조로 정의합니다.
manual_data = {
    "vehicle": "Volvo XC60",
    "category": "실내 공기 정화 필터(Cabin Air Filter) 소모품 교환", 
    "estimated_time": "약 10분",
    "recommended_interval": "1년 또는 15,000km (대기 환경에 따라 조기 교체 권장)",
    "difficulty": "⭐⭐ (보통 - 커버 탈거 시 공간 제약이 약간 있음)",
    "tools_required": ["T25 별렌치(Torx Driver) 또는 전용 드라이버", "수건 또는 매트"],
    "steps": [
        {
            "step_number": 1,
            "title": "작업 공간 확보 (조수석 하단)",
            "description": "조수석 시트를 뒤로 최대한 밀고 바닥 매트를 정리하여 작업 공간을 넓게 확보합니다."
        },
        {
            "step_number": 2,
            "title": "커버 탈거",
            "description": "조수석 글로브 박스 하단 보호 커버를 고정하고 있는 나사를 풀어줍니다. (좌측·우측 한 개씩 총 2개)",
            "sub_description": "보호 커버를 조심스럽게 잡아당겨 내부의 필터 하우징 입구를 드러나게 합니다."
        },
        {
            "step_number": 3,
            "title": "기존 캐빈 필터 커버 분리",
            "description": "하우징 입구를 막고 있는 직사각형 모양의 커버를 탈거합니다. (양쪽 클립 고정식, 위쪽을 바깥쪽으로 벌리면 빠짐)"
        },
        {
            "step_number": 4,
            "title": "오염된 기존 필터 인출",
            "description": "아래쪽으로 그대로 빼냅니다. (재장착을 위해 기존에 장착되어 있던 방향 및 모양 확인)",
            "warning": "이 과정에서 필터에 쌓여있던 먼지가 떨어질 수 있으니 아래쪽에 수건이나 매트를 받쳐두는 것이 좋습니다."
        },
        {
            "step_number": 5,
            "title": "새 에어컨필터 장착",
            "description": "필터를 밀어 넣은 뒤 하우징 안에서 제 모양을 잡도록 안착시킵니다.",
            "key_point": "필터에 표시된 공기 흐름 방향(Air Flow / 화살표)을 반드시 확인합니다. (잘못 장착 시 공조기 효율 저하 및 냄새 발생 원인)"
        },
        {
            "step_number": 6,
            "title": "역순 조립",
            "description": "입구를 막고 있는 직사각형 모양의 커버를 다시 장착합니다.",
            "sub_description": "보호 커버를 닫고 나사를 단단히 체결합니다."
        }
    ]
}

# JSON 파일로 저장 (한글 깨짐 방지를 위해 ensure_ascii=False 설정)
file_name = "volvo_xc60_cabin_filter.json"
with open(file_name, "w", encoding="utf-8") as f:
    json.dump(manual_data, f, ensure_ascii=False, indent=4)

print(f"[{file_name}] 파일로 JSON 변환이 완료되었습니다!")