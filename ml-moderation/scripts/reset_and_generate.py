"""
Reset và tạo lại toàn bộ dữ liệu properties
Xóa tất cả properties cũ và tạo mới với dữ liệu mẫu thực tế
"""

import os
import sys
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Real images from Unsplash (rental properties, rooms, apartments)
SAMPLE_IMAGES = [
    # Modern apartments
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
    "https://images.unsplash.com/photo-1502672260066-6bc05c107db4?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    
    # Bedrooms
    "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
    
    # Living rooms
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800",
    "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800",
    
    # Kitchens
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800",
    "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800",
    
    # Bathrooms
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800",
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
    
    # Small rooms/studios
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800",
    
    # Exterior/Building
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
]

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/QLChoThueTro')

print("=" * 80)
print("RESET VÀ TẠO LẠI PROPERTIES DATA")
print("=" * 80)

# Realistic data for Vietnamese rental properties
PROVINCES = [
    'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
    'Bình Dương', 'Đồng Nai', 'Khánh Hòa', 'Lâm Đồng', 'Quảng Nam'
]

DISTRICTS_HCM = [
    'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 
    'Quận 6', 'Quận 7', 'Quận 10', 'Bình Thạnh', 'Thủ Đức'
]

DISTRICTS_HN = [
    'Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa', 'Cầu Giấy',
    'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Tây Hồ', 'Nam Từ Liêm'
]

PROPERTY_TYPES = [
    'Phòng trọ', 'Căn hộ', 'Nhà nguyên căn', 'Studio', 'Chung cư mini'
]

DESCRIPTIONS_TEMPLATES = [
    "Phòng trọ giá rẻ",
    "Căn hộ hiện đại",
    "Nhà nguyên căn cho thuê",
    "Phòng mới xây",
    "Căn hộ view đẹp",
    "Phòng gần trường đại học",
    "Nhà có sân vườn",
    "Phòng an ninh tốt",
    "Căn hộ đầy đủ nội thất",
    "Phòng thoáng mát"
]

# Base prices by province (VNĐ/tháng)
BASE_PRICES = {
    'Hồ Chí Minh': 5000000,
    'Hà Nội': 4500000,
    'Đà Nẵng': 4000000,
    'Cần Thơ': 3000000,
    'Hải Phòng': 3500000,
    'Bình Dương': 3500000,
    'Đồng Nai': 3000000,
    'Khánh Hòa': 3500000,
    'Lâm Đồng': 2500000,
    'Quảng Nam': 2500000
}

# Coordinates ranges by province (for realistic geolocation)
PROVINCE_COORDS = {
    'Hồ Chí Minh': {'lat': (10.7, 10.9), 'lon': (106.6, 106.8)},
    'Hà Nội': {'lat': (20.9, 21.1), 'lon': (105.7, 105.9)},
    'Đà Nẵng': {'lat': (15.9, 16.1), 'lon': (107.9, 108.3)},
    'Cần Thơ': {'lat': (10.0, 10.1), 'lon': (105.7, 105.9)},
    'Hải Phòng': {'lat': (20.8, 20.9), 'lon': (106.6, 106.8)},
    'Bình Dương': {'lat': (10.9, 11.1), 'lon': (106.6, 106.8)},
    'Đồng Nai': {'lat': (10.9, 11.1), 'lon': (107.0, 107.2)},
    'Khánh Hòa': {'lat': (12.2, 12.3), 'lon': (109.1, 109.3)},
    'Lâm Đồng': {'lat': (11.9, 12.0), 'lon': (108.4, 108.5)},
    'Quảng Nam': {'lat': (15.5, 15.6), 'lon': (108.0, 108.2)}
}

def generate_realistic_price(province, area, bedrooms, amenities):
    """Generate realistic price based on location and features"""
    base_price = BASE_PRICES.get(province, 3000000)
    
    # Price per square meter (VNĐ)
    price_per_sqm = base_price / 25  # Giả sử 25m² là chuẩn
    
    # Calculate price
    price = base_price
    price += area * price_per_sqm * 0.5  # Area factor
    price += bedrooms * 500000  # Extra per bedroom
    
    # Amenities bonus
    amenity_count = sum(1 for v in amenities.values() if v)
    price += amenity_count * 200000
    
    # Add some randomness (±15%)
    price = price * random.uniform(0.85, 1.15)
    
    # Round to nearest 100,000
    price = round(price / 100000) * 100000
    
    return max(1000000, min(price, 35000000))  # Min 1M, Max 35M

def generate_property():
    """Generate a single realistic property"""
    province = random.choice(PROVINCES)
    
    # Get realistic coordinates for the province
    coords = PROVINCE_COORDS.get(province, {'lat': (21.0, 21.1), 'lon': (105.8, 105.9)})
    latitude = random.uniform(coords['lat'][0], coords['lat'][1])
    longitude = random.uniform(coords['lon'][0], coords['lon'][1])
    
    if province == 'Hồ Chí Minh':
        district = random.choice(DISTRICTS_HCM)
    elif province == 'Hà Nội':
        district = random.choice(DISTRICTS_HN)
    else:
        district = f'Quận {random.randint(1, 5)}'
    
    # Random property attributes
    area = random.choice([15, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50, 60, 70, 80, 100, 120])
    bedrooms = random.choices([1, 2, 3, 4], weights=[50, 30, 15, 5])[0]
    bathrooms = random.choices([1, 2, 3], weights=[70, 25, 5])[0]
    floor = random.randint(1, 10)
    
    # Amenities (realistic probabilities)
    amenities = {
        'hasWifi': random.random() > 0.2,  # 80% có wifi
        'hasParking': random.random() > 0.4,  # 60% có chỗ đậu xe
        'hasAirConditioner': random.random() > 0.3,  # 70% có máy lạnh
        'hasWaterHeater': random.random() > 0.2,  # 80% có nóng lạnh
        'hasKitchen': random.random() > 0.5,  # 50% có bếp
        'hasFridge': random.random() > 0.4,  # 60% có tủ lạnh
        'hasWashingMachine': random.random() > 0.6,  # 40% có máy giặt
        'hasTV': random.random() > 0.5,  # 50% có TV
        'hasBed': random.random() > 0.1,  # 90% có giường
        'hasWardrobe': random.random() > 0.2,  # 80% có tủ quần áo
        'hasElevator': floor > 3 and random.random() > 0.6,  # 40% có thang máy nếu > tầng 3
        'hasBalcony': random.random() > 0.5  # 50% có ban công
    }
    
    # Generate realistic price
    price = generate_realistic_price(province, area, bedrooms, amenities)
    
    # Map amenities to match Property schema
    amenities_mapped = {
        'wifi': amenities['hasWifi'],
        'parking': amenities['hasParking'],
        'ac': amenities['hasAirConditioner'],
        'waterHeater': amenities['hasWaterHeater'],
        'kitchen': amenities['hasKitchen'],
        'fridge': amenities['hasFridge'],
        'washingMachine': amenities['hasWashingMachine'],
        'tv': amenities['hasTV'],
        'bed': amenities['hasBed'],
        'wardrobe': amenities['hasWardrobe'],
        'elevator': amenities['hasElevator'],
        'balcony': amenities['hasBalcony']
    }
    
    property_doc = {
        'title': f'{random.choice(DESCRIPTIONS_TEMPLATES)} {area}m² tại {district}',
        'description': f'Cho thuê {random.choice(PROPERTY_TYPES).lower()} diện tích {area}m², {bedrooms} phòng ngủ, {bathrooms} phòng tắm. '
                      f'Vị trí: {district}, {province}. '
                      f'Tiện nghi: {"Wifi, " if amenities["hasWifi"] else ""}'
                      f'{"Máy lạnh, " if amenities["hasAirConditioner"] else ""}'
                      f'{"Bếp, " if amenities["hasKitchen"] else ""}'
                      f'{"Máy giặt, " if amenities["hasWashingMachine"] else ""}'
                      f'Giá: {price:,.0f} VNĐ/tháng.',
        'propertyType': random.choice(PROPERTY_TYPES),
        'price': price,
        'area': area,
        'address': {
            'street': f'{random.randint(1, 200)} Đường số {random.randint(1, 50)}',
            'ward': f'Phường {random.randint(1, 20)}',
            'district': district,
            'city': province,
            'full': f'{random.randint(1, 200)} Đường số {random.randint(1, 50)}, {district}, {province}'
        },
        'location': {
            'type': 'Point',
            'coordinates': [longitude, latitude]  # [longitude, latitude]
        },
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'kitchen': 1 if amenities['hasKitchen'] else 0,
        'amenities': amenities_mapped,
        'images': random.sample(SAMPLE_IMAGES, k=random.randint(3, 6)),  # 3-6 ảnh thực từ Unsplash
        'status': random.choices(
            ['available', 'rented', 'pending'],
            weights=[70, 20, 10]
        )[0],
        'availableFrom': datetime.now() + timedelta(days=random.randint(0, 30)),
        'createdAt': datetime.now() - timedelta(days=random.randint(1, 90)),
        'updatedAt': datetime.now() - timedelta(days=random.randint(0, 30))
    }
    
    return property_doc

def main():
    try:
        # Connect to MongoDB
        print("\n[1/4] Kết nối MongoDB...")
        client = MongoClient(MONGODB_URI)
        db = client['room_rental_db']
        properties_collection = db['properties']
        
        # Get current database info
        current_count = properties_collection.count_documents({})
        print(f"✓ Kết nối thành công: {db.name}")
        print(f"  Số properties hiện tại: {current_count}")
        
        # Confirm deletion
        print("\n" + "!" * 80)
        print("⚠️  CẢNH BÁO: Script này sẽ XÓA TẤT CẢ properties trong database!")
        print("!" * 80)
        confirm = input(f"\nBạn có chắc chắn muốn xóa {current_count} properties? (yes/no): ").strip().lower()
        
        if confirm != 'yes':
            print("\n❌ Đã hủy thao tác!")
            return
        
        # Delete all properties
        print("\n[2/4] Xóa tất cả properties cũ...")
        result = properties_collection.delete_many({})
        print(f"✓ Đã xóa {result.deleted_count} properties")
        
        # Generate new properties
        print("\n[3/4] Tạo dữ liệu mẫu mới...")
        num_properties = int(input("Nhập số lượng properties muốn tạo (khuyến nghị 50-100): ").strip() or "50")
        
        properties_list = []
        print(f"\nĐang tạo {num_properties} properties...")
        
        for i in range(num_properties):
            property_doc = generate_property()
            properties_list.append(property_doc)
            
            if (i + 1) % 10 == 0:
                print(f"  Đã tạo {i + 1}/{num_properties} properties...")
        
        # Insert to database
        print("\n[4/4] Lưu vào database...")
        result = properties_collection.insert_many(properties_list)
        
        print("\n" + "=" * 80)
        print("✓ HOÀN TẤT!")
        print("=" * 80)
        
        print(f"\n✓ Đã tạo {len(result.inserted_ids)} properties mới")
        print(f"✓ Tổng số properties: {properties_collection.count_documents({})}")
        
        # Statistics
        print("\n[Thống kê]")
        
        # By province
        pipeline = [
            {'$group': {'_id': '$address.city', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ]
        province_stats = list(properties_collection.aggregate(pipeline))
        print("\nTop 5 tỉnh/thành:")
        for stat in province_stats:
            print(f"  {stat['_id']}: {stat['count']} properties")
        
        # By status
        pipeline = [
            {'$group': {'_id': '$status', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        status_stats = list(properties_collection.aggregate(pipeline))
        print("\nTheo trạng thái:")
        for stat in status_stats:
            print(f"  {stat['_id']}: {stat['count']} properties")
        
        # Price statistics
        pipeline = [
            {'$group': {
                '_id': None,
                'min_price': {'$min': '$price'},
                'max_price': {'$max': '$price'},
                'avg_price': {'$avg': '$price'}
            }}
        ]
        price_stats = list(properties_collection.aggregate(pipeline))
        if price_stats:
            stats = price_stats[0]
            print("\nGiá thuê:")
            print(f"  Min: {stats['min_price']:,.0f} VNĐ")
            print(f"  Max: {stats['max_price']:,.0f} VNĐ")
            print(f"  Trung bình: {stats['avg_price']:,.0f} VNĐ")
        
        print("\n" + "=" * 80)
        print("→ Bước tiếp theo: Train models với dữ liệu mới")
        print("   python 1_data_preparation.py")
        print("   python 2_train_price_model.py")
        print("   python 3_train_anomaly_model.py")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
