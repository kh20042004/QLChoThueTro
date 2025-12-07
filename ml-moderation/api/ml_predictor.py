"""
ML-based Price Predictor & Anomaly Detector
Wrapper cho các models đã train
"""

import os
import pickle
import numpy as np
from typing import Dict, Tuple, List


class MLPredictor:
    """
    Wrapper cho ML models:
    - XGBoost: Dự đoán giá
    - Isolation Forest: Phát hiện outliers
    """
    
    def __init__(self, models_dir: str = '../models'):
        self.models_dir = models_dir
        self.price_model = None
        self.anomaly_model = None
        self.scaler = None
        self.feature_names = None
        
        # Load models nếu có
        self._load_models()
    
    def _load_models(self):
        """Load trained models từ disk"""
        try:
            price_model_path = os.path.join(self.models_dir, 'price_model.pkl')
            if os.path.exists(price_model_path):
                with open(price_model_path, 'rb') as f:
                    self.price_model = pickle.load(f)
                print('✅ Loaded price prediction model')
            
            anomaly_model_path = os.path.join(self.models_dir, 'anomaly_model.pkl')
            if os.path.exists(anomaly_model_path):
                with open(anomaly_model_path, 'rb') as f:
                    self.anomaly_model = pickle.load(f)
                print('✅ Loaded anomaly detection model')
            
            scaler_path = os.path.join(self.models_dir, 'scaler.pkl')
            if os.path.exists(scaler_path):
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                print('✅ Loaded feature scaler')
            
            feature_names_path = os.path.join(self.models_dir, 'feature_names.pkl')
            if os.path.exists(feature_names_path):
                with open(feature_names_path, 'rb') as f:
                    self.feature_names = pickle.load(f)
                print('✅ Loaded feature names')
        except Exception as e:
            print(f'⚠️ Error loading models: {e}')
    
    def _extract_features(self, property_data: Dict) -> np.ndarray:
        """
        Extract features từ property data
        
        Features:
        - location: lat, lng, district_encoded, city_encoded
        - property: area, bedrooms, bathrooms, propertyType_encoded
        - amenities: wifi, ac, parking, kitchen, water, laundry, balcony, security (8 features)
        - derived: price_per_sqm, amenity_count
        """
        features = {}
        
        # Location features
        location = property_data.get('location', {})
        coords = location.get('coordinates', [106.7, 10.8])  # Default HCM center
        features['longitude'] = coords[0] if len(coords) > 0 else 106.7
        features['latitude'] = coords[1] if len(coords) > 1 else 10.8
        
        # District encoding (simple mapping)
        district = property_data.get('address', {}).get('district', '')
        district_map = {
            'Quận 1': 1, 'Quận 2': 2, 'Quận 3': 3, 'Quận 4': 4, 'Quận 5': 5,
            'Quận 6': 6, 'Quận 7': 7, 'Quận 8': 8, 'Quận 9': 9, 'Quận 10': 10,
            'Quận 11': 11, 'Quận 12': 12, 'Quận Bình Tân': 13, 
            'Quận Bình Thạnh': 14, 'Quận Gò Vấp': 15, 'Quận Phú Nhuận': 16,
            'Quận Tân Bình': 17, 'Quận Tân Phú': 18, 'Thành phố Thủ Đức': 19
        }
        features['district_encoded'] = district_map.get(district, 0)
        
        # City encoding
        city = property_data.get('address', {}).get('city', '')
        city_map = {
            'TP. Hồ Chí Minh': 1,
            'Thành phố Hồ Chí Minh': 1,
            'Hà Nội': 2,
            'Đà Nẵng': 3
        }
        features['city_encoded'] = city_map.get(city, 1)
        
        # Property features
        features['area'] = property_data.get('area', 20)
        features['bedrooms'] = property_data.get('bedrooms', 1)
        features['bathrooms'] = property_data.get('bathrooms', 1)
        
        # Property type encoding
        property_type = property_data.get('propertyType', 'phong-tro')
        type_map = {
            'phong-tro': 1,
            'nha-nguyen-can': 2,
            'can-ho': 3,
            'chung-cu-mini': 4,
            'homestay': 5
        }
        features['propertyType_encoded'] = type_map.get(property_type, 1)
        
        # Amenities features
        amenities = property_data.get('amenities', {})
        amenity_keys = ['wifi', 'ac', 'parking', 'kitchen', 'water', 'laundry', 'balcony', 'security']
        for key in amenity_keys:
            features[f'amenity_{key}'] = 1 if amenities.get(key, False) else 0
        
        # Derived features
        features['amenity_count'] = sum(amenities.get(k, False) for k in amenity_keys)
        
        # Price per sqm (nếu có price)
        price = property_data.get('price', 0)
        area = features['area']
        features['price_per_sqm'] = price / area if area > 0 else 0
        
        # Convert to array theo thứ tự feature_names (nếu có)
        if self.feature_names:
            feature_array = np.array([features.get(name, 0) for name in self.feature_names])
        else:
            # Fallback: theo thứ tự cố định
            feature_order = [
                'longitude', 'latitude', 'district_encoded', 'city_encoded',
                'area', 'bedrooms', 'bathrooms', 'propertyType_encoded',
                'amenity_wifi', 'amenity_ac', 'amenity_parking', 'amenity_kitchen',
                'amenity_water', 'amenity_laundry', 'amenity_balcony', 'amenity_security',
                'amenity_count', 'price_per_sqm'
            ]
            feature_array = np.array([features.get(name, 0) for name in feature_order])
        
        return feature_array.reshape(1, -1)
    
    def predict_price(self, property_data: Dict) -> Tuple[float, float, List[str]]:
        """
        Dự đoán giá property
        
        Returns:
            (predicted_price, confidence_score, reasons)
        """
        reasons = []
        
        # Nếu chưa có model, dùng heuristic
        if not self.price_model:
            predicted_price = self._heuristic_price(property_data)
            reasons.append('⚠️ Sử dụng heuristic (model chưa train)')
            return predicted_price, 0.5, reasons
        
        try:
            # Extract features
            features = self._extract_features(property_data)
            
            # Scale features nếu có scaler
            if self.scaler:
                features_scaled = self.scaler.transform(features)
            else:
                features_scaled = features
            
            # Predict
            predicted_price = self.price_model.predict(features_scaled)[0]
            
            # Confidence từ model (nếu có feature importance)
            confidence = 0.8  # Default confidence
            
            reasons.append('✅ Dự đoán từ ML model')
            
            return float(predicted_price), confidence, reasons
        
        except Exception as e:
            print(f'Error predicting price: {e}')
            predicted_price = self._heuristic_price(property_data)
            reasons.append(f'⚠️ Lỗi prediction, dùng heuristic: {str(e)}')
            return predicted_price, 0.3, reasons
    
    def detect_anomaly(self, property_data: Dict) -> Tuple[bool, float, List[str]]:
        """
        Phát hiện bất thường trong giá
        
        Returns:
            (is_anomaly, anomaly_score, reasons)
        """
        reasons = []
        
        actual_price = property_data.get('price', 0)
        
        # 1. Dự đoán giá
        predicted_price, _, _ = self.predict_price(property_data)
        
        # 2. Tính % deviation
        if predicted_price > 0:
            deviation_pct = ((actual_price - predicted_price) / predicted_price) * 100
        else:
            deviation_pct = 0
        
        # 3. Kiểm tra với Isolation Forest (nếu có)
        is_anomaly_model = False
        if self.anomaly_model:
            try:
                features = self._extract_features(property_data)
                if self.scaler:
                    features = self.scaler.transform(features)
                
                # Isolation Forest: -1 = anomaly, 1 = normal
                prediction = self.anomaly_model.predict(features)[0]
                is_anomaly_model = (prediction == -1)
                
                if is_anomaly_model:
                    reasons.append('❌ Model phát hiện giá bất thường')
            except Exception as e:
                print(f'Error in anomaly detection: {e}')
        
        # 4. Rule-based anomaly check
        is_anomaly_rule = False
        
        # Nếu giá quá cao hoặc quá thấp so với dự đoán
        if abs(deviation_pct) > 50:
            is_anomaly_rule = True
            if deviation_pct > 0:
                reasons.append(f'⚠️ Giá cao hơn dự đoán {deviation_pct:.1f}%')
            else:
                reasons.append(f'⚠️ Giá thấp hơn dự đoán {abs(deviation_pct):.1f}%')
        
        # Tổng hợp
        is_anomaly = is_anomaly_model or is_anomaly_rule
        
        # Anomaly score (càng cao càng bất thường)
        anomaly_score = min(abs(deviation_pct) / 100, 1.0)
        
        if not is_anomaly:
            reasons.append(f'✅ Giá hợp lý (±{abs(deviation_pct):.1f}% so với dự đoán)')
        
        return is_anomaly, anomaly_score, reasons
    
    def _heuristic_price(self, property_data: Dict) -> float:
        """
        Heuristic đơn giản để tính giá khi chưa có model
        """
        area = property_data.get('area', 20)
        bedrooms = property_data.get('bedrooms', 1)
        property_type = property_data.get('propertyType', 'phong-tro')
        
        # Base price theo loại hình
        base_prices = {
            'phong-tro': 100_000,      # 100k/m2
            'nha-nguyen-can': 150_000,
            'can-ho': 200_000,
            'chung-cu-mini': 120_000,
            'homestay': 130_000
        }
        
        base_price_per_sqm = base_prices.get(property_type, 100_000)
        
        # Tính giá
        price = area * base_price_per_sqm
        
        # Bonus cho số phòng
        price += bedrooms * 500_000
        
        # Bonus cho tiện nghi
        amenities = property_data.get('amenities', {})
        amenity_count = sum(1 for v in amenities.values() if v)
        price += amenity_count * 200_000
        
        return price


def evaluate_price(property_data: Dict, ml_predictor: MLPredictor) -> Dict:
    """
    Đánh giá giá property sử dụng ML
    
    Args:
        property_data: Dictionary chứa thông tin property
        ml_predictor: Instance của MLPredictor
    
    Returns:
        Dictionary chứa kết quả đánh giá
    """
    actual_price = property_data.get('price', 0)
    
    # 1. Predict price
    predicted_price, confidence, price_reasons = ml_predictor.predict_price(property_data)
    
    # 2. Detect anomaly
    is_anomaly, anomaly_score, anomaly_reasons = ml_predictor.detect_anomaly(property_data)
    
    # 3. Tính price score
    # Score cao nếu giá gần với dự đoán
    if predicted_price > 0:
        deviation_pct = abs((actual_price - predicted_price) / predicted_price) * 100
    else:
        deviation_pct = 100
    
    # Score giảm theo % deviation
    if deviation_pct <= 10:
        price_score = 1.0
    elif deviation_pct <= 20:
        price_score = 0.9
    elif deviation_pct <= 30:
        price_score = 0.8
    elif deviation_pct <= 50:
        price_score = 0.6
    else:
        price_score = 0.4
    
    # Trừ điểm nếu là anomaly
    if is_anomaly:
        price_score *= 0.7  # Trừ 30%
    
    return {
        'price_score': round(price_score, 3),
        'predicted_price': int(predicted_price),
        'actual_price': int(actual_price),
        'deviation_pct': round(deviation_pct, 2),
        'is_anomaly': is_anomaly,
        'anomaly_score': round(anomaly_score, 3),
        'confidence': round(confidence, 3),
        'reasons': price_reasons + anomaly_reasons
    }


if __name__ == '__main__':
    # Test
    predictor = MLPredictor(models_dir='../models')
    
    sample_property = {
        'price': 3000000,
        'area': 25,
        'propertyType': 'phong-tro',
        'address': {
            'district': 'Quận 1',
            'city': 'TP. Hồ Chí Minh'
        },
        'location': {
            'coordinates': [106.7009, 10.7769]
        },
        'bedrooms': 1,
        'bathrooms': 1,
        'amenities': {
            'wifi': True,
            'ac': True,
            'parking': False
        }
    }
    
    result = evaluate_price(sample_property, predictor)
    print('Price Evaluation Result:')
    for key, value in result.items():
        print(f'  {key}: {value}')
