# 🔧 FIX LỖI CORS CHO FLASK SERVER

## ❌ Lỗi hiện tại

```
Access to fetch at 'https://xxx.ngrok-free.dev/nearby-poi' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## ✅ GIẢI PHÁP

Bạn cần thêm CORS headers vào Flask server (đang chạy trên Colab).

### CÁCH 1: Sử dụng flask-cors (⭐ Khuyên dùng)

#### Bước 1: Install flask-cors trong Colab

```python
!pip install flask-cors
```

#### Bước 2: Thêm vào đầu file Flask

```python
from flask import Flask, request, jsonify
from flask_cors import CORS  # ← Thêm dòng này

app = Flask(__name__)

# Enable CORS cho tất cả routes
CORS(app)  # ← Thêm dòng này

# ... các routes của bạn (predict, nearby-poi, ...)
```

#### Bước 3: Restart Flask server

```python
# Trong Colab cell
app.run(...)
```

---

### CÁCH 2: Thêm CORS headers thủ công (Nếu không dùng flask-cors)

Thêm vào Flask server:

```python
@app.after_request
def after_request(response):
    """Thêm CORS headers vào mọi response"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# Xử lý preflight OPTIONS request
@app.route('/predict', methods=['OPTIONS'])
@app.route('/nearby-poi', methods=['OPTIONS'])
def handle_options():
    """Handle preflight CORS requests"""
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response
```

---

## 🧪 KIỂM TRA CORS ĐÃ HOẠT ĐỘNG

### Test 1: Dùng curl

```bash
curl -X OPTIONS https://YOUR_NGROK_URL/nearby-poi \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Response phải có các headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Test 2: Dùng Browser Console

Mở Console (F12) và chạy:

```javascript
fetch('https://YOUR_NGROK_URL/nearby-poi', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  body: JSON.stringify({
    city: 'HCM',
    address: '51/34 Phú Mỹ, Phường 22, Quận Bình Thạnh, TP.HCM'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Success:', d))
.catch(e => console.error('❌ Error:', e))
```

---

## 📝 MẪU CODE HOÀN CHỈNH

### Flask Server (Colab)

```python
# ========== IMPORTS ==========
from flask import Flask, request, jsonify
from flask_cors import CORS  # ← Install: !pip install flask-cors
import pandas as pd
from pyngrok import ngrok

# ========== SETUP FLASK ==========
app = Flask(__name__)
CORS(app)  # ← Enable CORS

# ========== LOAD DATA ==========
# POI_DF = pd.read_csv('poi_data.csv')
# ... load models, etc.

# ========== ROUTES ==========
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        # ... logic dự đoán giá
        return jsonify({
            'predicted_price': 5000000,
            'message': 'Success'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/nearby-poi', methods=['POST'])
def nearby_poi():
    try:
        data = request.get_json()
        city = data.get('city', '')
        address = data.get('address', '')
        lat = data.get('lat')
        lng = data.get('lng')
        
        # ... logic tìm POI (code từ FLASK_NEARBY_POI_ROUTE)
        
        return jsonify({
            'lat': lat,
            'lng': lng,
            'universities': [],
            'hospitals': [],
            'malls': [],
            'metros': [],
            'bus_stations': []
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== RUN SERVER ==========
if __name__ == '__main__':
    # Setup ngrok
    ngrok.set_auth_token("YOUR_NGROK_TOKEN")
    public_url = ngrok.connect(5000)
    print(f"🌐 Public URL: {public_url}")
    
    # Run Flask
    app.run(port=5000, debug=True, use_reloader=False)
```

---

## 🔄 LUỒNG HOẠT ĐỘNG SAU KHI FIX

```
Frontend (localhost:3000)
    ↓
    Gửi fetch request với headers:
    - Content-Type: application/json
    - ngrok-skip-browser-warning: true
    ↓
Browser gửi preflight OPTIONS request
    ↓
Flask server trả về CORS headers:
    - Access-Control-Allow-Origin: *
    - Access-Control-Allow-Methods: POST, OPTIONS
    - Access-Control-Allow-Headers: Content-Type
    ↓
Browser cho phép gửi POST request thật
    ↓
Flask xử lý và trả về data
    ↓
Frontend nhận data ✅
```

---

## ⚠️ LƯU Ý

1. **Phải restart Flask server** sau khi thêm CORS
2. **Ngrok URL thay đổi** mỗi khi restart → Cập nhật trong `property-create.js`
3. **Frontend đã được fix** - Đã thêm header `ngrok-skip-browser-warning: true`
4. **Chỉ cần fix Backend** - Thêm CORS vào Flask là xong

---

## 📊 CHECKLIST

- [ ] Đã cài `flask-cors`: `!pip install flask-cors`
- [ ] Đã import: `from flask_cors import CORS`
- [ ] Đã enable: `CORS(app)`
- [ ] Đã restart Flask server
- [ ] Đã test bằng curl hoặc browser console
- [ ] Đã cập nhật NGROK URL trong `property-create.js`
- [ ] Refresh trang `http://localhost:3000/property/create`
- [ ] Test lại tính năng POI

---

## 🆘 NẾU VẪN LỖI

### Lỗi: "ngrok-skip-browser-warning"
→ Không sao, header này chỉ để bypass ngrok warning page

### Lỗi: "Network error" 
→ Kiểm tra Flask server có đang chạy không

### Lỗi: "404 Not Found"
→ Kiểm tra route `/nearby-poi` đã được thêm vào Flask chưa

### Lỗi: "500 Internal Server Error"
→ Xem log trong Colab để debug logic

---

**Tóm lại**: Chỉ cần thêm 2 dòng vào Flask:
```python
from flask_cors import CORS
CORS(app)
```

Restart server và mọi thứ sẽ hoạt động! 🚀
