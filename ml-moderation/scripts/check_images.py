"""
Kiểm tra ảnh trong properties vừa tạo
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/QLChoThueTro')

print("=" * 80)
print("KIỂM TRA ẢNH TRONG PROPERTIES")
print("=" * 80)

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client['room_rental_db']
properties_collection = db['properties']

# Lấy 5 properties mới nhất
properties = list(properties_collection.find().sort('createdAt', -1).limit(5))

print(f"\n✓ Tìm thấy {len(properties)} properties mới nhất\n")

for i, prop in enumerate(properties, 1):
    print(f"[Property {i}]")
    print(f"  ID: {prop.get('_id')}")
    print(f"  Tiêu đề: {prop.get('title', 'N/A')}")
    print(f"  Giá: {prop.get('price', 0):,} VNĐ/tháng")
    print(f"  Địa chỉ: {prop.get('address', {}).get('city', 'N/A')}")
    print(f"  Số ảnh: {len(prop.get('images', []))}")
    
    images = prop.get('images', [])
    if images:
        print(f"  Danh sách ảnh:")
        for j, img in enumerate(images, 1):
            print(f"    {j}. {img}")
    print()

print("=" * 80)
print("✓ Hoàn tất kiểm tra!")
print("=" * 80)
