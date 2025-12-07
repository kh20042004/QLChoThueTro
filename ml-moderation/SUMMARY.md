# 📝 Tóm tắt hệ thống ML Moderation

## 🎯 Mục tiêu đạt được

✅ **Pipeline duyệt tự động** kết hợp:
- Rule-based validation (60% weight)
- ML Price Prediction (40% weight)
- Quyết định tự động dựa trên overall_score

✅ **3 mức quyết định:**
- `>= 0.85`: ✅ **Tự động duyệt**
- `0.60 - 0.85`: ⏳ **Chờ admin duyệt**
- `< 0.60`: ❌ **Từ chối + gợi ý**

✅ **Phát hiện giá bất thường:**
- XGBoost model dự đoán giá
- Isolation Forest phát hiện outliers
- So sánh với thị trường (p5, p95 percentiles)

---

## 📦 Cấu trúc đã tạo

```
ml-moderation/
├── api/
│   ├── app.py                    ✅ Flask API server
│   ├── moderation_service.py     ✅ Core service
│   ├── rule_validators.py        ✅ Rule-based validators
│   ├── ml_predictor.py           ✅ ML wrapper
│   └── requirements.txt          ✅ Dependencies
├── notebooks/
│   └── 1_data_preparation.ipynb  ✅ Chuẩn bị dữ liệu
├── models/                        📁 Models sẽ được train
│   ├── price_model.pkl
│   ├── anomaly_model.pkl
│   ├── scaler.pkl
│   └── feature_names.pkl
├── data/
│   └── properties_sample.json    ✅ Sample data
├── README.md                      ✅ Documentation
└── DEPLOY.md                      ✅ Deploy guide
```

### Tích hợp vào Node.js:

```
src/
├── services/
│   └── moderationService.js      ✅ Node.js client
├── routes/
│   └── moderationRoutes.js       ✅ Admin routes
├── controllers/
│   └── propertyController.js     ✅ Updated với moderation
└── models/
    └── Property.js               ✅ Added moderation fields
```

---

## 🔬 Rule-based Validators

### 1. TextValidator
- Kiểm tra spam keywords
- Forbidden words
- Title/description length
- CAPS ratio
- Repetitive characters
- Phone numbers in title

### 2. CompletenessValidator
- Required fields
- Important fields
- Address completeness
- Location coordinates
- Images count
- Amenities

### 3. ImageValidator
- Số lượng ảnh (tối thiểu 3)
- Duplicate detection
- URL validity

### 4. PriceRangeValidator
- Price range theo property type
- Price per sqm check
- Basic reasonableness

---

## 🤖 ML Components

### 1. Price Prediction Model (XGBoost)

**Features (18 total):**
- Location: `longitude`, `latitude`, `district_encoded`, `city_encoded`
- Property: `area`, `bedrooms`, `bathrooms`, `propertyType_encoded`
- Amenities: 8 boolean features
- Derived: `amenity_count`, `price_per_sqm`

**Output:**
- Predicted price (VNĐ)
- Confidence score

### 2. Anomaly Detection (Isolation Forest)

**Input:** Same features as price model

**Output:**
- is_anomaly: boolean
- anomaly_score: 0-1
- deviation_pct: % difference from predicted

---

## 📊 Overall Scoring

```python
overall_score = 0.6 * rule_score + 0.4 * ml_score

where:
  rule_score = weighted_avg(text, completeness, image, price_range)
  ml_score = price_score (giảm nếu có anomaly)
```

---

## 🚀 Workflow

### Khi user tạo property:

1. **Extract data** → propertyData
2. **Call ML API** → `POST /api/moderate`
3. **Receive result** → overall_score, reasons, suggestions
4. **Decide status:**
   - `auto_approved` → status = 'available'
   - `pending_review` → status = 'pending'
   - `rejected` → return 400 + suggestions
5. **Save property** với moderation info
6. **Response** to user

### Admin Panel:

- View `GET /api/moderation/pending` → danh sách chờ duyệt
- View `GET /api/moderation/stats` → thống kê
- Approve `PUT /api/moderation/:id/approve`
- Reject `PUT /api/moderation/:id/reject`

---

## 📈 Example Responses

### Case 1: Good Property (Auto-approved)

```json
{
  "overall_score": 0.87,
  "decision": "auto_approved",
  "details": {
    "text_score": 0.9,
    "completeness_score": 0.95,
    "image_score": 0.8,
    "price_score": 0.85
  },
  "reasons": [
    "✅ Mô tả chi tiết, rõ ràng",
    "✅ Thông tin đầy đủ và chi tiết",
    "✅ Hình ảnh đầy đủ",
    "✅ Giá phù hợp với thị trường"
  ],
  "predicted_price": 3200000,
  "price_deviation": -6.25
}
```

### Case 2: Medium Property (Pending)

```json
{
  "overall_score": 0.75,
  "decision": "pending_review",
  "reasons": [
    "⚠️ Nên bổ sung thêm hình ảnh",
    "⚠️ Giá cao hơn dự đoán 15%"
  ],
  "suggestions": [
    "📸 Tải lên thêm hình ảnh (tối thiểu 5 ảnh)",
    "💰 Giá cao hơn thị trường 15%. Giá tham khảo: 3,200,000 VNĐ"
  ]
}
```

### Case 3: Bad Property (Rejected)

```json
{
  "overall_score": 0.45,
  "decision": "rejected",
  "reasons": [
    "❌ Mô tả quá ngắn (< 50 ký tự)",
    "❌ Không có hình ảnh",
    "❌ Giá quá cao (> 50,000,000 VNĐ cho phòng trọ)"
  ],
  "suggestions": [
    "📝 Cải thiện mô tả: viết rõ ràng, chi tiết hơn",
    "📸 Tải lên hình ảnh (tối thiểu 3 ảnh)",
    "💰 Kiểm tra lại giá"
  ]
}
```

---

## 🎓 Training Models (Next Steps)

### Bước 1: Chuẩn bị data
```python
# Run notebook: 1_data_preparation.ipynb
# → Export: training_data.csv
```

### Bước 2: Train Price Model
```python
# Notebook: 2_price_prediction_model.ipynb
from xgboost import XGBRegressor

model = XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8
)
model.fit(X_train, y_train)

# Save model
pickle.dump(model, 'price_model.pkl')
```

### Bước 3: Train Anomaly Detector
```python
# Notebook: 3_anomaly_detection.ipynb
from sklearn.ensemble import IsolationForest

anomaly_model = IsolationForest(
    contamination=0.1,  # 10% outliers
    random_state=42
)
anomaly_model.fit(X_train)

# Save model
pickle.dump(anomaly_model, 'anomaly_model.pkl')
```

---

## 🔧 Configuration

### Thresholds (có thể điều chỉnh)

```python
AUTO_APPROVE_THRESHOLD = 0.85
REJECT_THRESHOLD = 0.60
```

### Weights

```python
RULE_WEIGHT = 0.6
ML_WEIGHT = 0.4
```

---

## 📱 Frontend Integration (TODO)

### Trang đăng tin:
- Hiển thị moderation result realtime
- Show suggestions nếu bị reject
- Warning nếu pending

### Admin Panel:
- Dashboard: số liệu moderation
- Pending list: danh sách chờ duyệt
- Review interface: approve/reject với lý do

---

## 🐛 Troubleshooting

### Model chưa train?
→ Hệ thống sẽ dùng heuristic fallback
→ Score thấp hơn nhưng vẫn hoạt động

### API service down?
→ Node.js fallback to basic rules
→ Tất cả properties → pending_review

### False positives/negatives?
→ Thu thập feedback từ admin
→ Retrain models định kỳ
→ Điều chỉnh thresholds

---

## ✅ Checklist

- [x] Rule-based validators
- [x] ML predictor wrapper
- [x] Moderation service core
- [x] Flask API server
- [x] Node.js integration
- [x] Admin routes
- [x] Property model updates
- [x] Sample data
- [ ] Train XGBoost model
- [ ] Train Isolation Forest
- [ ] Deploy on Colab/Cloud
- [ ] Admin UI for pending review
- [ ] Monitoring dashboard
- [ ] A/B testing thresholds

---

**Status:** ✅ Backend infrastructure DONE
**Next:** Train models với real data từ MongoDB

Hệ thống đã sẵn sàng! 🎉
