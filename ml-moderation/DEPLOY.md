# 🚀 Hướng dẫn Deploy ML Moderation Service

## Phần 1: Train Models trên Google Colab

### Bước 1: Upload notebooks lên Colab

1. Mở Google Colab: https://colab.research.google.com/
2. Upload file `1_data_preparation.ipynb`
3. Chạy từng cell để chuẩn bị dữ liệu

### Bước 2: Train models

1. Upload notebook `2_price_prediction_model.ipynb` (sẽ tạo ở bước sau)
2. Chạy để train XGBoost model
3. Download các file models:
   - `price_model.pkl`
   - `anomaly_model.pkl`
   - `scaler.pkl`
   - `feature_names.pkl`

### Bước 3: Upload models vào dự án

Copy các file `.pkl` vào thư mục `ml-moderation/models/`

---

## Phần 2: Deploy API Service

### Option A: Chạy trên Google Colab (Development/Demo)

#### 1. Upload code lên Colab

```python
# Trong Colab notebook mới
!git clone https://github.com/kh20042004/QLChoThueTro.git
%cd QLChoThueTro/ml-moderation
```

#### 2. Install dependencies

```python
!pip install -r api/requirements.txt
```

#### 3. Run Flask server với ngrok

```python
from pyngrok import ngrok
import os

# Set ngrok auth token (optional)
# !ngrok authtoken YOUR_NGROK_TOKEN

# Start Flask server
!python api/app.py
```

#### 4. Get public URL

Output sẽ hiện:
```
✅ Public URL: https://xxxx-xx-xxx-xxx.ngrok-free.app
```

#### 5. Update .env trong Node.js project

```bash
MODERATION_SERVICE_URL=https://xxxx-xx-xxx-xxx.ngrok-free.app
```

---

### Option B: Chạy trên Local (Development)

#### 1. Clone repo

```bash
cd ml-moderation
```

#### 2. Install dependencies

```bash
pip install -r api/requirements.txt
```

#### 3. Run server

```bash
python api/app.py
```

Server sẽ chạy tại: `http://localhost:5000`

#### 4. Update .env

```bash
MODERATION_SERVICE_URL=http://localhost:5000
```

---

### Option C: Deploy lên Cloud (Production)

#### Deploy lên Google Cloud Run

```bash
# 1. Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/ml-moderation:latest .

# 2. Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/ml-moderation:latest

# 3. Deploy to Cloud Run
gcloud run deploy ml-moderation \
  --image gcr.io/YOUR_PROJECT_ID/ml-moderation:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 2Gi
```

---

## Phần 3: Test Integration

### 1. Check health

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": {
    "price_model": true,
    "anomaly_model": true,
    "scaler": true
  }
}
```

### 2. Test moderation

```bash
curl -X POST http://localhost:5000/api/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "property": {
      "title": "Phòng trọ giá rẻ",
      "description": "Phòng đẹp, đầy đủ tiện nghi",
      "price": 3000000,
      "area": 25,
      "propertyType": "phong-tro",
      "address": {
        "district": "Quận 1",
        "city": "TP. Hồ Chí Minh"
      },
      "images": ["url1", "url2", "url3"]
    }
  }'
```

### 3. Test từ Node.js

```javascript
const moderationService = require('./src/services/moderationService');

const result = await moderationService.moderate(propertyData);
console.log('Score:', result.overall_score);
console.log('Decision:', result.decision);
```

---

## Phần 4: Monitoring

### View logs trong Admin Panel

Thêm vào Admin dashboard:

```javascript
// Get moderation stats
GET /api/admin/moderation/stats

Response:
{
  "total": 100,
  "auto_approved": 75,
  "pending_review": 20,
  "rejected": 5,
  "average_score": 0.82
}
```

### View pending reviews

```javascript
// Get properties chờ duyệt
GET /api/admin/properties?status=pending

// Show moderation info
{
  "_id": "...",
  "title": "...",
  "status": "pending",
  "moderationScore": 0.75,
  "moderationReasons": [
    "⚠️ Giá cao hơn dự đoán 15%",
    "⚠️ Nên bổ sung thêm hình ảnh"
  ]
}
```

---

## Troubleshooting

### Issue 1: Models không load được

**Giải pháp:**
- Kiểm tra file `.pkl` có trong thư mục `models/`
- Check logs khi start server
- Nếu không có models, hệ thống sẽ dùng heuristic (fallback)

### Issue 2: ngrok tunnel bị disconnect

**Giải pháp:**
- Restart Colab notebook
- Get URL mới từ ngrok
- Update lại trong `.env`

### Issue 3: Timeout khi gọi API

**Giải pháp:**
- Tăng timeout trong moderationService.js
- Check network connection
- Xem logs trong Colab

---

## Cấu hình nâng cao

### Điều chỉnh thresholds

```bash
curl -X POST http://localhost:5000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "auto_approve_threshold": 0.88,
    "reject_threshold": 0.65
  }'
```

### Batch moderation

Để duyệt nhiều properties cùng lúc:

```javascript
const results = await moderationService.moderateBatch([
  property1,
  property2,
  property3
]);
```

---

## Next Steps

1. ✅ Train models với real data
2. ✅ Deploy API service
3. ✅ Integrate vào Node.js
4. 📊 Monitor performance
5. 🔄 Retrain models định kỳ với feedback từ admin
6. 🎨 Thêm UI trong Admin Panel để review pending posts

---

## Support

Nếu gặp vấn đề, check:
- Logs trong Colab notebook
- Logs trong Node.js console
- MongoDB có dữ liệu không
- Network connectivity

Happy Moderating! 🎉
