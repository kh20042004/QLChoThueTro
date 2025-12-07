"""
Generate Sample Properties Data
Tạo dữ liệu mẫu properties thực tế để train ML models
"""

import os
import sys
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/QLChoThueTro')

print("=" * 80)
print("GENERATE SAMPLE PROPERTIES DATA")
print("=" * 80)

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

# Realistic data for Vietnamese rental properties
PROVINCES = [
    'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
    'Bình Dương', 'Đồng Nai', 'Khánh Hòa', 'Lâm Đồng', 'Quảng Nam'
]

DISTRICTS_HCM = [
    'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 
    'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10',
    'Quận 11', 'Quận 12', 'Bình Thạnh', 'Tân Bình', 'Phú Nhuận',
    'Gò Vấp', 'Bình Tân', 'Tân Phú', 'Thủ Đức'
]

DISTRICTS_HN = [
    'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy',
    'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Nam Từ Liêm',
    'Bắc Từ Liêm', 'Hà Đông'
]

PROPERTY_TYPES = ['Phòng trọ', 'Căn hộ mini', 'Chung cư', 'Nhà nguyên căn', 'Homestay']

TITLES = [
    'Phòng trọ giá rẻ',
    'Căn hộ đầy đủ tiện nghi',
    'Phòng mới xây',
    'Nhà trọ sinh viên',
    'Căn hộ cao cấp',
    'Phòng gần trường đại học',
    'Nhà nguyên căn cho thuê',
    'Phòng có gác lửng',
    'Căn hộ view đẹp',
    'Phòng an ninh tốt'
]

DESCRIPTIONS = [
    'Phòng rộng rãi, thoáng mát, đầy đủ tiện nghi. Gần chợ, siêu thị, trường học.',
    'Căn hộ mới 100%, có máy lạnh, nóng lạnh, tủ lạnh. An ninh 24/7.',
    'Phòng trọ sạch sẹp, giá phải chăng. Phù hợp sinh viên, nhân viên văn phòng.',
    'Nhà nguyên căn có sân phơi, bếp riêng. Khu vực yên tĩnh, an ninh tốt.',
    'Phòng trọ có gác lửng, WC riêng, máy giặt chung. Giá điện nước theo công tơ.',
    'Căn hộ mini đầy đủ nội thất, ban công thoáng mát. Gần bến xe, trung tâm thành phố.',
    'Phòng mới xây, sàn gạch men, cửa sổ lớn. Chủ nhà thân thiện, hỗ trợ nhiệt tình.',
    'Nhà trọ cho thuê dài hạn, giá ổn định. Có chỗ để xe, camera an ninh.',
    'Phòng có ban công riêng, view đẹp. Gần siêu thị, nhà hàng, quán ăn.',
    'Căn hộ cao cấp, nội thất sang trọng. Phù hợp gia đình, người đi làm.'
]

def generate_realistic_price(area, bedrooms, province, has_amenities):
    """Tạo giá thuê thực tế dựa trên các yếu tố"""
    # Base price theo tỉnh/thành
    base_prices = {
        'Hồ Chí Minh': 3500000,
        'Hà Nội': 3000000,
        'Đà Nẵng': 2500000,
        'Cần Thơ': 2000000,
        'Hải Phòng': 2200000,
        'Bình Dương': 2500000,
        'Đồng Nai': 2300000,
        'Khánh Hòa': 2800000,
        'Lâm Đồng': 2000000,
        'Quảng Nam': 1800000
    }
    
    base = base_prices.get(province, 2000000)
    
    # Tính giá theo diện tích (80,000 - 120,000 VNĐ/m²)
    price_per_sqm = random.randint(80000, 120000)
    price = base + (area * price_per_sqm)
    
    # Điều chỉnh theo số phòng ngủ
    price += bedrooms * 500000
    
    # Điều chỉnh theo tiện nghi
    amenity_count = sum(has_amenities.values())
    price += amenity_count * 200000
    
    # Random variation ±15%
    variation = random.uniform(0.85, 1.15)
    price = int(price * variation)
    
    # Round to nearest 100,000
    price = round(price / 100000) * 100000
    
    return max(1000000, min(50000000, price))  # Min 1M, Max 50M

def generate_property():
    """Tạo một property thực tế"""
    province = random.choice(PROVINCES)
    
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
    price = generate_realistic_price(area, bedrooms, province, amenities)
    
    # Map property type to schema values
    property_type_map = {
        'Phòng trọ': 'phong-tro',
        'Căn hộ mini': 'chung-cu-mini',
        'Chung cư': 'can-ho',
        'Nhà nguyên căn': 'nha-nguyen-can',
        'Homestay': 'homestay'
    }
    
    # Map amenities to schema
    amenities_mapped = {
        'wifi': amenities['hasWifi'],
        'ac': amenities['hasAirConditioner'],
        'parking': amenities['hasParking'],
        'kitchen': amenities['hasKitchen'],
        'water': amenities['hasWaterHeater'],
        'fridge': amenities['hasFridge'],
        'washing': amenities['hasWashingMachine'],
        'tv': amenities['hasTV'],
        'bed': amenities['hasBed'],
        'wardrobe': amenities['hasWardrobe'],
        'elevator': amenities['hasElevator']
    }
    
    # GeoJSON coordinates [longitude, latitude]
    if province == 'Hồ Chí Minh':
        longitude = 106.7 + random.uniform(-0.3, 0.3)
        latitude = 10.7 + random.uniform(-0.3, 0.3)
    elif province == 'Hà Nội':
        longitude = 105.8 + random.uniform(-0.2, 0.2)
        latitude = 21.0 + random.uniform(-0.2, 0.2)
    else:
        longitude = 106.0 + random.uniform(-1, 1)
        latitude = 16.0 + random.uniform(-5, 5)
    
    # Create property document matching schema
    property_doc = {
        'title': f"{random.choice(TITLES)} {area}m² tại {district}",
        'description': random.choice(DESCRIPTIONS),
        'propertyType': property_type_map[random.choice(PROPERTY_TYPES)],
        'price': price,
        'deposit': price,  # Đặt cọc bằng 1 tháng
        'area': area,
        'address': {
            'street': f'{random.randint(1, 200)} Đường số {random.randint(1, 50)}',
            'ward': f'Phường {random.randint(1, 15)}',
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
        print("\n[1/3] Kết nối MongoDB...")
        client = MongoClient(MONGODB_URI)
        db = client.get_database()
        properties_collection = db.properties
        print(f"✓ Kết nối thành công: {db.name}")
        
        # Check current count
        current_count = properties_collection.count_documents({})
        print(f"\nSố properties hiện tại: {current_count}")
        
        # Ask for number of samples
        print("\n[2/3] Tạo dữ liệu mẫu...")
        num_samples = int(input("Nhập số lượng properties muốn tạo (khuyến nghị 50-100): "))
        
        if num_samples <= 0:
            print("Số lượng phải > 0!")
            sys.exit(1)
        
        # Generate and insert properties
        print(f"\nĐang tạo {num_samples} properties...")
        properties = []
        
        for i in range(num_samples):
            prop = generate_property()
            properties.append(prop)
            
            if (i + 1) % 10 == 0:
                print(f"  Đã tạo {i + 1}/{num_samples} properties...")
        
        print("\n[3/3] Lưu vào database...")
        result = properties_collection.insert_many(properties)
        
        # Summary
        print("\n" + "=" * 80)
        print("✓ HOÀN TẤT!")
        print("=" * 80)
        print(f"\n✓ Đã thêm {len(result.inserted_ids)} properties vào database")
        print(f"✓ Tổng số properties: {properties_collection.count_documents({})}")
        
        # Statistics
        print("\n[Thống kê]")
        
        # By province
        pipeline = [
            {'$group': {'_id': '$location.province', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ]
        print("\nTop 5 tỉnh/thành:")
        for doc in properties_collection.aggregate(pipeline):
            print(f"  {doc['_id']}: {doc['count']} properties")
        
        # By status
        pipeline = [
            {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
        ]
        print("\nTheo trạng thái:")
        for doc in properties_collection.aggregate(pipeline):
            print(f"  {doc['_id']}: {doc['count']} properties")
        
        # Price range
        pipeline = [
            {
                '$group': {
                    '_id': None,
                    'min_price': {'$min': '$price'},
                    'max_price': {'$max': '$price'},
                    'avg_price': {'$avg': '$price'}
                }
            }
        ]
        print("\nGiá thuê:")
        for doc in properties_collection.aggregate(pipeline):
            print(f"  Min: {doc['min_price']:,.0f} VNĐ")
            print(f"  Max: {doc['max_price']:,.0f} VNĐ")
            print(f"  Trung bình: {doc['avg_price']:,.0f} VNĐ")
        
        print("\n" + "=" * 80)
        print("→ Bước tiếp theo: Chạy lại scripts để train models với dữ liệu mới")
        print("   python 1_data_preparation.py")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n✗ Lỗi: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
