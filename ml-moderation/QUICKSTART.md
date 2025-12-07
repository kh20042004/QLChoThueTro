# 🚀 Quick Start Guide - Train ML Models trên VS Code

## Chuẩn bị

1. **Cài Python dependencies:**
```powershell
cd ml-moderation/scripts
pip install -r requirements.txt
```

2. **Kiểm tra MongoDB đang chạy:**
```powershell
mongosh  # Hoặc kiểm tra MongoDB Compass
```

3. **Kiểm tra .env file có MONGODB_URI**

## Cách 1: Chạy từng bước (Recommended)

### Bước 1: Chuẩn bị dữ liệu
```powershell
python 1_data_preparation.py
```
✓ Kết nối MongoDB → Lấy properties → Extract features → Clean data → Save CSV

### Bước 2: Train Price Model
```powershell
python 2_train_price_model.py
```
✓ Load data → Feature engineering → Train XGBoost → Hyperparameter tuning → Save model

### Bước 3: Train Anomaly Model
```powershell
python 3_train_anomaly_model.py
```
✓ Load data & price model → Create anomaly features → Train Isolation Forest → Save model

## Cách 2: Chạy tất cả một lần

```powershell
python run_all.py
```

Sẽ tự động chạy 3 scripts liên tiếp (~10-15 phút).

## Kết quả

Sau khi hoàn tất, bạn sẽ có:

### Models
```
ml-moderation/models/
├── price_model.pkl              ← XGBoost model
├── price_model_metadata.json
├── anomaly_model.pkl            ← Isolation Forest model
└── anomaly_model_metadata.json
```

### Visualizations
```
ml-moderation/outputs/
├── price_prediction.png         ← Actual vs Predicted
├── feature_importance.png       ← Top features
└── anomaly_detection.png        ← Anomaly analysis
```

### Data
```
ml-moderation/data/
├── training_data.csv            ← Training dataset
└── data_summary.json            ← Statistics
```

## Chạy Flask API

```powershell
cd ml-moderation/api
python app.py
```

API sẽ chạy tại: `http://localhost:5000`

## Test API

```powershell
# Health check
curl http://localhost:5000/api/health

# Test moderation
curl -X POST http://localhost:5000/api/moderate `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Phòng trọ đẹp",
    "description": "Phòng rộng rãi, đầy đủ tiện nghi",
    "price": 3000000,
    "area": 25,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": {
      "hasWifi": true,
      "hasParking": true
    },
    "images": ["url1.jpg", "url2.jpg"],
    "location": {
      "province": "Hồ Chí Minh",
      "district": "Quận 1"
    }
  }'
```

## Troubleshooting

### MongoDB không kết nối được
```powershell
# Kiểm tra .env
cat .env | Select-String MONGODB_URI

# Test connection
mongosh $env:MONGODB_URI
```

### Module not found
```powershell
# Cài lại dependencies
pip install -r requirements.txt --upgrade
```

### Insufficient data
- Cần ít nhất 50-100 properties trong database
- Thêm dữ liệu mẫu hoặc import từ file

## Next Steps

1. ✅ Train models xong
2. ✅ Chạy Flask API
3. → Test với Postman/curl
4. → Cấu hình `MODERATION_SERVICE_URL` trong .env của Node.js
5. → Test integration: Tạo property mới từ frontend
6. → Monitor trong admin panel

## Performance Expected

### Price Model
- MAE: 300,000 - 500,000 VNĐ (sai số ~10-15%)
- R²: 0.75 - 0.85
- Training time: 5-10 phút

### Anomaly Model
- Contamination: 10%
- Training time: 2-5 phút
- False positive rate: ~5-10%

## Cải thiện Models

1. **Thu thập thêm dữ liệu** (càng nhiều càng tốt)
2. **Feature engineering** thêm (khoảng cách đến trường, chợ, etc.)
3. **Hyperparameter tuning** chi tiết hơn
4. **Ensemble methods** (kết hợp nhiều models)
5. **Regular retraining** với dữ liệu mới

---

**Lưu ý:** Lần đầu train có thể mất 15-20 phút. Các lần sau nhanh hơn nếu dữ liệu không thay đổi nhiều.
