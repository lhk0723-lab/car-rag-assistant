from ultralytics import YOLO

def main():
    # 1. 사전 학습된 YOLOv8n(nano) 모델 로드
    model = YOLO("yolov8n.pt")

    # 2. 전이학습(Fine-tuning) 실행
    results = model.train(
        data="datasets/cabin_filter/data.yaml",  # data.yaml 경로
        epochs=50,                               # 데이터셋이 소량이므로 50 에포크 정도면 충분합니다
        imgsz=640,                               # 이미지 크기
        batch=4,                                 # 배치 사이즈
        name="cabin_filter_result"               # 결과가 저장될 폴더 이름
    )

    print("학습이 완료되었습니다!")

if __name__ == "__main__":
    main()