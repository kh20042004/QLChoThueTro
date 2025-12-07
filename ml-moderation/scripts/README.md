# ML Moderation - Training Scripts

Các Python scripts để train models trực tiếp trên VS Code (không cần Colab).

## 📋 Yêu cầu

- Python 3.8+
- MongoDB đang chạy với dữ liệu properties
- File `.env` với `MONGODB_URI`

## 🚀 Cài đặt

```bash
# Di chuyển vào thư mục scripts
cd ml-moderation/scripts

# Cài đặt dependencies
pip install -r requirements.txt
```

## 📊 Quy trình Train Models

### Bước 1: Chuẩn bị dữ liệu
```bash
python 1_data_preparation.py
```
**Kết quả:**
- `ml-moderation/data/training_data.csv` - Dữ liệu training
- `ml-moderation/data/data_summary.json` - Thống kê

### Bước 2: Train Price Prediction Model (XGBoost)
```bash
python 2_train_price_model.py
```
**Kết quả:**
- `ml-moderation/models/price_model.pkl` - XGBoost model
- `ml-moderation/models/price_model_metadata.json` - Metadata
- `ml-moderation/outputs/price_prediction.png` - Visualization
- `ml-moderation/outputs/feature_importance.png` - Feature importance

**Thời gian:** ~5-10 phút (tùy thuộc vào kích thước dữ liệu)

### Bước 3: Train Anomaly Detection Model (Isolation Forest)
```bash
python 3_train_anomaly_model.py
```
**Kết quả:**
- `ml-moderation/models/anomaly_model.pkl` - Isolation Forest model
- `ml-moderation/models/anomaly_model_metadata.json` - Metadata
- `ml-moderation/outputs/anomaly_detection.png` - Visualization

**Thời gian:** ~2-5 phút

## 📁 Cấu trúc Output

```
ml-moderation/
├── data/
│   ├── training_data.csv          # Dữ liệu training
│   └── data_summary.json          # Thống kê
├── models/
│   ├── price_model.pkl            # XGBoost model
│   ├── price_model_metadata.json
│   ├── anomaly_model.pkl          # Isolation Forest model
│   └── anomaly_model_metadata.json
└── outputs/
    ├── price_prediction.png       # Actual vs Predicted
    ├── feature_importance.png     # Feature importance
    └── anomaly_detection.png      # Anomaly analysis
```

## 🔧 Troubleshooting

### Lỗi: MongoDB connection refused
```bash
# Kiểm tra MongoDB đang chạy
mongosh

# Hoặc kiểm tra connection string trong .env
MONGODB_URI=mongodb://localhost:27017/QLChoThueTro
```

### Lỗi: No module named 'xgboost'
```bash
# Cài đặt lại dependencies
pip install -r requirements.txt
```

### Lỗi: Insufficient data
- Cần ít nhất 50-100 properties để train models
- Kiểm tra database có đủ dữ liệu chưa

## 📈 Performance Metrics

### Price Model (XGBoost)
- **MAE** (Mean Absolute Error): Sai số trung bình (VNĐ)
- **RMSE** (Root Mean Squared Error): Sai số bình phương (VNĐ)
- **R²** (R-squared): Độ chính xác (0-1, càng cao càng tốt)
- **MAPE** (Mean Absolute Percentage Error): Sai số % trung bình

### Anomaly Model (Isolation Forest)
- **Contamination**: 10% (giả định 10% data là outliers)
- **Thresholds**:
  - Strict: Top 5% most anomalous
  - Moderate: Top 10% most anomalous
  - Lenient: Top 15% most anomalous

## 🎯 Sử dụng Models

Sau khi train xong, models sẽ được Flask API (`ml-moderation/api/app.py`) tự động load và sử dụng.

```bash
# Chạy Flask API
cd ml-moderation/api
python app.py
```

## 📝 Notes

- Scripts tự động tạo thư mục `data/`, `models/`, `outputs/` nếu chưa có
- Mỗi lần train sẽ overwrite models cũ
- Nên backup models quan trọng trước khi re-train
- Training time phụ thuộc vào:
  - Kích thước dữ liệu
  - CPU/RAM của máy
  - Hyperparameter grid size
