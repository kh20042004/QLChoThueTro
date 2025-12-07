"""
Run All Training Scripts
Chạy toàn bộ quy trình training từ đầu đến cuối
"""

import os
import sys
import subprocess
import time
from datetime import datetime

print("=" * 80)
print("ML MODERATION - FULL TRAINING PIPELINE")
print("=" * 80)
print(f"\nBắt đầu lúc: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

def run_script(script_name, description):
    """Chạy một Python script"""
    print("\n" + "=" * 80)
    print(f"🚀 {description}")
    print("=" * 80)
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            check=True,
            cwd=os.path.dirname(__file__)
        )
        
        elapsed_time = time.time() - start_time
        print(f"\n✓ Hoàn thành trong {elapsed_time:.1f}s")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Lỗi khi chạy {script_name}: {e}")
        return False
    except Exception as e:
        print(f"\n✗ Lỗi không xác định: {e}")
        return False

def main():
    total_start = time.time()
    
    # Step 1: Data Preparation
    success = run_script(
        "1_data_preparation.py",
        "BƯỚC 1/3: Chuẩn bị dữ liệu từ MongoDB"
    )
    if not success:
        print("\n❌ Training thất bại ở bước 1!")
        sys.exit(1)
    
    # Step 2: Train Price Model
    success = run_script(
        "2_train_price_model.py",
        "BƯỚC 2/3: Train XGBoost Price Prediction Model"
    )
    if not success:
        print("\n❌ Training thất bại ở bước 2!")
        sys.exit(1)
    
    # Step 3: Train Anomaly Model
    success = run_script(
        "3_train_anomaly_model.py",
        "BƯỚC 3/3: Train Isolation Forest Anomaly Detection Model"
    )
    if not success:
        print("\n❌ Training thất bại ở bước 3!")
        sys.exit(1)
    
    # Summary
    total_time = time.time() - total_start
    
    print("\n" + "=" * 80)
    print("🎉 HOÀN THÀNH TẤT CẢ!")
    print("=" * 80)
    print(f"\nTổng thời gian: {total_time:.1f}s (~{total_time/60:.1f} phút)")
    print(f"Kết thúc lúc: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("\n📁 Models đã được lưu tại:")
    print("  - ml-moderation/models/price_model.pkl")
    print("  - ml-moderation/models/anomaly_model.pkl")
    
    print("\n📊 Visualizations đã được lưu tại:")
    print("  - ml-moderation/outputs/price_prediction.png")
    print("  - ml-moderation/outputs/feature_importance.png")
    print("  - ml-moderation/outputs/anomaly_detection.png")
    
    print("\n🚀 Bước tiếp theo:")
    print("  1. Kiểm tra models trong thư mục ml-moderation/models/")
    print("  2. Xem visualizations trong thư mục ml-moderation/outputs/")
    print("  3. Chạy Flask API: cd ml-moderation/api && python app.py")
    print("  4. Test integration với Node.js backend")
    print("=" * 80)

if __name__ == "__main__":
    main()
