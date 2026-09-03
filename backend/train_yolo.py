from pathlib import Path
from ultralytics import YOLO

def main():
    BASE_DIR = Path(__file__).resolve().parent.parent
    
    # 변경된 폴더명 적용: yolo_training_data (구 datasets)
    data_yaml_path = BASE_DIR / "yolo_training_data" / "data.yaml"

    model = YOLO("yolov8n.pt")

    results = model.train(
        data=str(data_yaml_path),
        epochs=50,
        imgsz=640,
        batch=4,
        name="car_part_result"
    )

    print("학습이 완료되었습니다!")

if __name__ == "__main__":
    main()