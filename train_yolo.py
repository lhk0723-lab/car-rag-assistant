from ultralytics import YOLO

def main():
    # 1. 사전 학습된 YOLOv8n(nano) 모델 로드
    model = YOLO("yolov8n.pt")

    # 2. 전이학습(Fine-tuning) 실행
    results = model.train(
        data="C:/DIY/datasets/data.yaml",     # data.yaml의 실제 경로
        epochs=50,                           # 학습 횟수
        imgsz=640,                           # 이미지 크기
        batch=4,                             # 배치 사이즈
        name="car_part_result"               # 향후 다른 부품 추가까지 고려한 범용 결과 폴더 이름
    )

    print("학습이 완료되었습니다!")

if __name__ == "__main__":
    main()