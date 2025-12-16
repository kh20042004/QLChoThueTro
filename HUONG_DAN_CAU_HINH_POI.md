# 🗺️ HƯỚNG DẪN CẤU HÌNH TÍNH NĂNG POI (Điểm lân cận)

## ✅ Tính năng đã được tích hợp sẵn

Hệ thống đã có đầy đủ code để hiển thị các điểm quan trọng (POI) xung quanh địa chỉ cho thuê, bao gồm:
- 🎓 Trường đại học / cao đẳng
- 🏥 Bệnh viện
- 🏬 Trung tâm thương mại
- 🚇 Ga metro / bến xe buýt

## 📝 BƯỚC 1: Cấu hình Backend Flask (Colab)

### 1.1. Đảm bảo có route `/nearby-poi`

Mở file Flask server (đang chứa route `/predict`) và kiểm tra đã có route này chưa:

```python
@app.route('/nearby-poi', methods=['POST'])
def nearby_poi():
    # ... code xử lý POI
```

Nếu chưa có, copy code từ file: `.history/QLChoThueTro/FLASK_NEARBY_POI_ROUTE_20251205170454.py`

### 1.2. Kiểm tra các dependencies

Đảm bảo Flask server có:
- ✅ `POI_DF` - DataFrame chứa danh sách POI
- ✅ `haversine_km(lat1, lng1, lat2, lng2)` - Hàm tính khoảng cách
- ✅ `geocode_with_goong(address)` - Hàm geocoding
- ✅ `clean_city(city_str)` - Hàm chuẩn hóa tên thành phố

### 1.3. Test route với curl

```bash
curl -X POST YOUR_NGROK_URL/nearby-poi \
  -H "Content-Type: application/json" \
  -d '{"city":"HCM","address":"51/34 Phú Mỹ, Phường 22, Quận Bình Thạnh, TP.HCM"}'
```

Kết quả mong đợi:
```json
{
  "lat": 10.8003,
  "lng": 106.7123,
  "universities": [...],
  "hospitals": [...],
  "malls": [...],
  "metros": [...],
  "bus_stations": [...]
}
```

## 📝 BƯỚC 2: Cập nhật NGROK URL trong Frontend

### 2.1. Lấy NGROK URL mới

Khi chạy Flask server trên Colab với ngrok, bạn sẽ có URL dạng:
```
https://abc-xyz-123.ngrok-free.dev
```

### 2.2. Cập nhật trong `property-create.js`

Mở file: `public/js/property-create.js`

Tìm dòng (khoảng dòng 1348):
```javascript
const NGROK_BASE_URL = "https://mattie-nonencyclopaedic-qualifiedly.ngrok-free.dev";
```

Thay bằng NGROK URL mới của bạn:
```javascript
const NGROK_BASE_URL = "https://YOUR-NEW-NGROK-URL.ngrok-free.dev";
```

⚠️ **LƯU Ý**: 
- Không thêm dấu `/` ở cuối URL
- NGROK URL sẽ thay đổi mỗi khi bạn restart Colab, nhớ cập nhật lại

### 2.3. Cập nhật trong `price-prediction.js` (nếu có)

Tương tự, tìm và cập nhật `NGROK_BASE_URL` trong file này.

## 📝 BƯỚC 3: Test tính năng trên Frontend

### 3.1. Khởi động lại server Node.js

```bash
# Stop server hiện tại (Ctrl+C)
# Start lại
npm start
```

### 3.2. Test luồng hoạt động

1. Mở trình duyệt: `http://localhost:3000/property/create`
2. Điền Step 1 (Thông tin cơ bản)
3. Chuyển sang Step 2 (Vị trí)
4. Thử 3 cách nhập địa chỉ:

#### Cách 1: Tìm kiếm địa chỉ (Goong Autocomplete)
- Nhập vào ô "Tìm kiếm địa chỉ"
- Chọn một gợi ý từ dropdown
- → Hệ thống sẽ tự động gọi API `/nearby-poi`
- → Hiển thị "Gợi ý xung quanh chỗ ở" bên dưới

#### Cách 2: Sử dụng vị trí hiện tại (GPS)
- Click nút icon 📍 (crosshairs) bên phải ô tìm kiếm
- Cho phép trình duyệt truy cập vị trí
- → Hệ thống sẽ gọi API `/nearby-poi` với tọa độ GPS
- → Hiển thị POI xung quanh

#### Cách 3: Chọn trên bản đồ
- Click nút icon 🗺️ (map-marked-alt)
- Di chuyển bản đồ để chọn vị trí
- Click "Xác nhận vị trí"
- → Hệ thống sẽ gọi API `/nearby-poi`
- → Hiển thị POI xung quanh

### 3.3. Test tính năng "Áp dụng vào mô tả"

1. Sau khi có POI hiển thị ở Step 2
2. Click nút "Áp dụng gợi ý vào mô tả"
3. → Hệ thống sẽ:
   - Tạo câu mô tả tiếng Việt tự nhiên
   - Tự động chuyển về Step 1
   - Thêm đoạn mô tả vào textarea "Mô tả chi tiết"

## 🔍 KIỂM TRA LỖI

### Lỗi: "GET /api/config 404"
**Nguyên nhân**: Server Node.js chưa restart sau khi thêm route `/api/config`

**Giải pháp**:
```bash
# Ctrl+C để stop server
npm start
```

### Lỗi: "403 Forbidden" khi gọi Goong API
**Nguyên nhân**: API key chưa load kịp

**Giải pháp**: Đã được xử lý tự động trong code, hệ thống sẽ load API key trước khi gọi

### Lỗi: Không hiển thị POI
**Kiểm tra**:
1. Mở Console (F12) → tab Console
2. Xem log có dòng: `📍 Fetching nearby POI...`
3. Kiểm tra response từ API có data không

**Nguyên nhân thường gặp**:
- NGROK URL chưa đúng
- Flask server chưa chạy
- Địa chỉ không thuộc HCM/Hà Nội/Đà Nẵng

## 📊 Luồng hoạt động

```
User nhập địa chỉ (Step 2)
    ↓
Goong Autocomplete / Current Location / Map Picker
    ↓
Lấy tọa độ (lat, lng) và address
    ↓
Gọi API: POST /nearby-poi
    ↓
Backend Flask xử lý:
  - Geocode nếu cần
  - Tính khoảng cách với POI_DF
  - Lọc POI trong bán kính 5km
  - Trả về top 3 POI mỗi loại
    ↓
Frontend hiển thị:
  - Universities (màu xanh)
  - Hospitals (màu đỏ)
  - Malls (màu tím)
  - Metro/Bus (màu cam)
    ↓
User click "Áp dụng vào mô tả"
    ↓
Tự động thêm vào textarea description (Step 1)
```

## 🎯 Các file quan trọng

### Backend (Flask - Colab)
- `.history/QLChoThueTro/FLASK_NEARBY_POI_ROUTE_20251205170454.py` - Route `/nearby-poi`

### Frontend
- `views/property-create.html` - HTML container `#nearbyPoiContainer`
- `public/js/property-create.js` - Logic gọi API và hiển thị POI
- `public/js/location-map-picker.js` - Tích hợp với map picker

### Config
- `.env` - Chứa `GOONG_API_KEY` và `GOONG_MAPTILES_KEY`
- `src/app.js` - Route `/api/config` để expose API keys

## 💡 Tips

1. **NGROK URL thay đổi mỗi khi restart Colab**
   - Lưu NGROK URL vào notepad
   - Chỉ cần sửa 1 chỗ trong `property-create.js`

2. **Test nhanh với Console**
   ```javascript
   // Trong browser Console (F12)
   window.searchNearbyPlaces(10.762622, 106.660172)
   ```

3. **Xem log chi tiết**
   - Frontend: Browser Console (F12)
   - Backend: Colab output logs

4. **POI chỉ hỗ trợ 3 thành phố**
   - HCM (Hồ Chí Minh)
   - HaNoi (Hà Nội)
   - DaNang (Đà Nẵng)

## ✨ Tính năng hoạt động tự động

Bạn KHÔNG cần làm gì thêm, chỉ cần cập nhật NGROK URL. Hệ thống sẽ tự động:

✅ Gọi API khi user nhập địa chỉ
✅ Hiển thị POI xung quanh
✅ Cho phép apply vào mô tả
✅ Tích hợp với current location
✅ Tích hợp với map picker
✅ Xử lý lỗi gracefully
✅ Responsive design

---

**Liên hệ**: Nếu gặp vấn đề, kiểm tra Console log và đảm bảo NGROK URL đúng.
