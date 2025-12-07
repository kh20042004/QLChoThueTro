"""
Data Preparation Script
Kết nối MongoDB và chuẩn bị dữ liệu training cho ML models
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/QLChoThueTro')

print("=" * 80)
print("DATA PREPARATION FOR ML MODERATION")
print("=" * 80)

def connect_mongodb():
    """Kết nối MongoDB"""
    try:
        client = MongoClient(MONGODB_URI)
        db = client.get_database()
        print(f"\n✓ Kết nối MongoDB thành công: {db.name}")
        return db
    except Exception as e:
        print(f"\n✗ Lỗi kết nối MongoDB: {e}")
        sys.exit(1)

def fetch_properties(db):
    """Lấy dữ liệu properties từ MongoDB"""
    try:
        properties = list(db.properties.find({
            'status': {'$in': ['available', 'rented']},  # Chỉ lấy properties đã approved
            'price': {'$gt': 0}
        }))
        print(f"✓ Đã lấy {len(properties)} properties từ database")
        return properties
    except Exception as e:
        print(f"✗ Lỗi lấy dữ liệu: {e}")
        return []

def extract_features(properties):
    """Extract features từ properties"""
    data = []
    
    for prop in properties:
        try:
            # Location - hỗ trợ cả schema cũ và mới
            address = prop.get('address', {})
            province = address.get('city', prop.get('location', {}).get('province', ''))
            district = address.get('district', prop.get('location', {}).get('district', ''))
            
            # Simple encoding (nên dùng LabelEncoder trong production)
            province_map = {
                'Hồ Chí Minh': 1, 'Hà Nội': 2, 'Đà Nẵng': 3,
                'Cần Thơ': 4, 'Hải Phòng': 5, 'Bình Dương': 6,
                'Đồng Nai': 7, 'Khánh Hòa': 8, 'Lâm Đồng': 9, 'Quảng Nam': 10
            }
            province_encoded = province_map.get(province, 0)
            district_encoded = hash(district) % 100  # Temporary encoding
            
            # Amenities - hỗ trợ cả schema cũ và mới
            amenities = prop.get('amenities', {})
            
            features = {
                # ID
                'property_id': str(prop.get('_id')),
                
                # Price (target)
                'price': prop.get('price', 0),
                
                # Location
                'province': province,
                'district': district,
                'province_encoded': province_encoded,
                'district_encoded': district_encoded,
                
                # Property details
                'area': prop.get('area', 0),
                'bedrooms': prop.get('bedrooms', 1),
                'bathrooms': prop.get('bathrooms', 1),
                'floor': prop.get('floor', 1),
                
                # Amenities (binary) - hỗ trợ cả tên cũ và mới
                'has_wifi': 1 if amenities.get('wifi', amenities.get('hasWifi')) else 0,
                'has_parking': 1 if amenities.get('parking', amenities.get('hasParking')) else 0,
                'has_air_conditioner': 1 if amenities.get('ac', amenities.get('hasAirConditioner')) else 0,
                'has_water_heater': 1 if amenities.get('water', amenities.get('hasWaterHeater')) else 0,
                'has_kitchen': 1 if amenities.get('kitchen', amenities.get('hasKitchen')) else 0,
                'has_fridge': 1 if amenities.get('fridge', amenities.get('hasFridge')) else 0,
                'has_washing_machine': 1 if amenities.get('washing', amenities.get('hasWashingMachine')) else 0,
                'has_tv': 1 if amenities.get('tv', amenities.get('hasTV')) else 0,
                'has_bed': 1 if amenities.get('bed', amenities.get('hasBed')) else 0,
                'has_wardrobe': 1 if amenities.get('wardrobe', amenities.get('hasWardrobe')) else 0,
            }
            
            data.append(features)
            
        except Exception as e:
            print(f"  Warning: Lỗi xử lý property {prop.get('_id')}: {e}")
            continue
    
    return pd.DataFrame(data)

def clean_data(df):
    """Làm sạch dữ liệu"""
    print(f"\nBước 1: Dữ liệu ban đầu: {len(df)} records")
    
    # Remove missing values
    df = df.dropna(subset=['price', 'area', 'bedrooms'])
    print(f"Bước 2: Sau khi bỏ missing values: {len(df)} records")
    
    # Remove outliers (IQR method)
    Q1 = df['price'].quantile(0.25)
    Q3 = df['price'].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    df = df[(df['price'] >= lower_bound) & (df['price'] <= upper_bound)]
    print(f"Bước 3: Sau khi bỏ outliers: {len(df)} records")
    
    # Remove invalid values
    df = df[df['area'] > 0]
    df = df[df['price'] > 0]
    df = df[df['bedrooms'] > 0]
    print(f"Bước 4: Sau khi bỏ invalid values: {len(df)} records")
    
    return df

def save_data(df):
    """Lưu dữ liệu"""
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(output_dir, exist_ok=True)
    
    # Save CSV
    csv_path = os.path.join(output_dir, 'training_data.csv')
    df.to_csv(csv_path, index=False)
    print(f"\n✓ Đã lưu CSV: {csv_path}")
    
    # Save summary
    summary = {
        'total_records': len(df),
        'features': df.columns.tolist(),
        'price_stats': {
            'mean': float(df['price'].mean()),
            'median': float(df['price'].median()),
            'min': float(df['price'].min()),
            'max': float(df['price'].max()),
            'std': float(df['price'].std())
        },
        'created_at': datetime.now().isoformat()
    }
    
    summary_path = os.path.join(output_dir, 'data_summary.json')
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"✓ Đã lưu summary: {summary_path}")
    
    return csv_path

def main():
    print("\n[1/4] Kết nối MongoDB...")
    db = connect_mongodb()
    
    print("\n[2/4] Lấy dữ liệu properties...")
    properties = fetch_properties(db)
    
    if len(properties) == 0:
        print("\n✗ Không có dữ liệu để xử lý!")
        sys.exit(1)
    
    print("\n[3/4] Extract và clean features...")
    df = extract_features(properties)
    print(f"✓ Đã extract {len(df)} records")
    print(f"✓ Số features: {len(df.columns)}")
    
    df = clean_data(df)
    
    print("\n[4/4] Lưu dữ liệu...")
    csv_path = save_data(df)
    
    # Display statistics
    print("\n" + "=" * 80)
    print("THỐNG KÊ DỮ LIỆU")
    print("=" * 80)
    print(f"\nTổng số records: {len(df)}")
    print(f"Số features: {len(df.columns)}")
    print(f"\nGiá thuê:")
    print(f"  - Trung bình: {df['price'].mean():,.0f} VNĐ")
    print(f"  - Trung vị: {df['price'].median():,.0f} VNĐ")
    print(f"  - Min: {df['price'].min():,.0f} VNĐ")
    print(f"  - Max: {df['price'].max():,.0f} VNĐ")
    
    print(f"\nDiện tích:")
    print(f"  - Trung bình: {df['area'].mean():.1f} m²")
    print(f"  - Min: {df['area'].min():.0f} m²")
    print(f"  - Max: {df['area'].max():.0f} m²")
    
    print(f"\nTop 5 tỉnh/thành:")
    print(df['province'].value_counts().head())
    
    print("\n" + "=" * 80)
    print(f"✓ HOÀN TẤT! Dữ liệu đã được lưu tại:")
    print(f"  {csv_path}")
    print("=" * 80)
    print("\n→ Bước tiếp theo: Chạy script 2_train_price_model.py")

if __name__ == "__main__":
    main()
