# 🤖 ML-Based Moderation System

## Tổng quan

Hệ thống duyệt tự động bài đăng BĐS sử dụng:
- **Rule-based validation**: Kiểm tra văn bản, ảnh, thông tin cơ bản
- **ML Price Prediction**: XGBoost để dự đoán giá hợp lý
- **Anomaly Detection**: Isolation Forest phát hiện giá bất thường
- **Overall Scoring**: Tổng hợp điểm từ tất cả các nguồn

## Kết quả

- `overall_score >= 0.85`: ✅ **Tự động duyệt**
- `0.60 - 0.85`: ⏳ **Chờ duyệt thủ công** (hiển thị lý do trong Admin Panel)
- `< 0.60`: ❌ **Từ chối** + gợi ý chỉnh sửa

## Cấu trúc

```
ml-moderation/
├── notebooks/
│   ├── 1_data_preparation.ipynb       # Chuẩn bị dữ liệu training
│   ├── 2_price_prediction_model.ipynb # Train model dự đoán giá
│   ├── 3_anomaly_detection.ipynb      # Train model phát hiện outliers
│   └── 4_full_pipeline_test.ipynb     # Test toàn bộ pipeline
├── models/
│   ├── price_model.pkl               # XGBoost model
│   ├── anomaly_model.pkl             # Isolation Forest
│   └── scaler.pkl                    # Feature scaler
├── data/
│   ├── properties_sample.json        # Dữ liệu mẫu
│   └── training_data.csv             # Dữ liệu training
├── api/
│   ├── app.py                        # Flask API server
│   ├── moderation_service.py         # Core moderation logic
│   ├── rule_validators.py            # Rule-based validators
│   ├── ml_predictor.py               # ML prediction wrapper
│   └── requirements.txt              # Python dependencies
└── README.md

```

## Cài đặt

### 1. Trên Google Colab

```python
# Clone repo
!git clone https://github.com/kh20042004/QLChoThueTro.git
%cd QLChoThueTro/ml-moderation

# Install dependencies
!pip install -r api/requirements.txt

# Run Flask server với ngrok tunnel
!python api/app.py
```

### 2. Trên Local (Development)

```bash
cd ml-moderation
pip install -r api/requirements.txt
python api/app.py
```

## API Usage

### Endpoint: POST /api/moderate

**Request:**
```json
{
  "property": {
    "title": "Phòng trọ giá rẻ quận 1",
    "description": "Phòng đẹp, đầy đủ tiện nghi...",
    "price": 3000000,
    "area": 25,
    "propertyType": "phong-tro",
    "address": {
      "district": "Quận 1",
      "city": "TP. Hồ Chí Minh"
    },
    "location": {
      "coordinates": [106.7009, 10.7769]
    },
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": {
      "wifi": true,
      "ac": true,
      "parking": false
    },
    "images": ["url1", "url2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "overall_score": 0.87,
  "decision": "auto_approved",
  "details": {
    "text_score": 0.9,
    "price_score": 0.85,
    "completeness_score": 0.95,
    "image_score": 0.8
  },
  "reasons": [
    "✅ Giá phù hợp với thị trường",
    "✅ Mô tả chi tiết đầy đủ",
    "⚠️ Nên bổ sung thêm 1-2 ảnh"
  ],
  "predicted_price": 3200000,
  "price_deviation": -6.25,
  "suggestions": []
}
```

## Workflow tích hợp vào Node.js

```javascript
// src/controllers/propertyController.js

// Khi tạo property mới
const moderationResult = await moderationService.moderate(propertyData);

if (moderationResult.overall_score >= 0.85) {
  property.status = 'available'; // Tự động duyệt
  property.moderationScore = moderationResult.overall_score;
} else if (moderationResult.overall_score >= 0.60) {
  property.status = 'pending'; // Chờ duyệt
  property.moderationFlags = moderationResult.reasons;
} else {
  // Từ chối
  return res.status(400).json({
    success: false,
    error: 'Bài đăng không đạt yêu cầu',
    suggestions: moderationResult.suggestions
  });
}
```

## Training Models

Chạy lần lượt các notebook trong thư mục `notebooks/`:

1. **Data Preparation**: Chuẩn bị dữ liệu từ MongoDB
2. **Price Prediction**: Train XGBoost model
3. **Anomaly Detection**: Train Isolation Forest
4. **Pipeline Test**: Kiểm tra toàn bộ hệ thống

## Deployment

### Option 1: Colab + ngrok (Development/Demo)
- Chạy Flask server trên Colab
- Expose qua ngrok tunnel
- Update URL trong Node.js `.env`

### Option 2: Cloud (Production)
- Deploy lên Google Cloud Run / AWS Lambda
- API endpoint cố định
- Auto-scaling

## Monitoring

- Log tất cả requests trong MongoDB collection `moderation_logs`
- Dashboard trong Admin Panel hiển thị:
  - Tỷ lệ tự động duyệt
  - Các bài pending review
  - False positives/negatives

## Future Improvements

- [ ] Sử dụng Computer Vision để phân tích chất lượng ảnh
- [ ] NLP model cho phân loại mô tả (spam, scam)
- [ ] Online learning: cập nhật model từ feedback admin
- [ ] A/B testing cho ngưỡng score
