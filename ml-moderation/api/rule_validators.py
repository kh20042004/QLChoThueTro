"""
Rule-based validators for property moderation
Kiểm tra các quy tắc cứng: text, completeness, images, etc.
"""

import re
from typing import Dict, List, Tuple


class TextValidator:
    """Kiểm tra văn bản: spam, từ cấm, chất lượng"""
    
    SPAM_KEYWORDS = [
        'liên hệ ngay', 'gọi ngay', 'inbox', 'zalo', 'viber',
        'đảm bảo', '100%', 'cực rẻ', 'giá sốc', 'hot hot',
        'siêu rẻ', 'không mất phí', 'miễn phí 100%'
    ]
    
    FORBIDDEN_WORDS = [
        'lừa đảo', 'scam', 'hack', 'cờ bạc', 'casino',
        'ma túy', 'đồ cấm'
    ]
    
    @staticmethod
    def validate(title: str, description: str) -> Tuple[float, List[str]]:
        """
        Validate text quality
        Returns: (score, reasons)
        """
        score = 1.0
        reasons = []
        
        # 1. Check title length
        if len(title) < 10:
            score -= 0.15
            reasons.append('⚠️ Tiêu đề quá ngắn (< 10 ký tự)')
        elif len(title) > 200:
            score -= 0.1
            reasons.append('⚠️ Tiêu đề quá dài (> 200 ký tự)')
        
        # 2. Check description length
        if len(description) < 50:
            score -= 0.2
            reasons.append('❌ Mô tả quá ngắn (< 50 ký tự)')
        elif len(description) > 5000:
            score -= 0.1
            reasons.append('⚠️ Mô tả quá dài (> 5000 ký tự)')
        
        # 3. Check for spam keywords
        text_lower = (title + ' ' + description).lower()
        spam_count = sum(1 for keyword in TextValidator.SPAM_KEYWORDS if keyword in text_lower)
        if spam_count > 3:
            score -= 0.3
            reasons.append(f'❌ Phát hiện {spam_count} từ khóa spam')
        elif spam_count > 0:
            score -= 0.1 * spam_count
            reasons.append(f'⚠️ Phát hiện {spam_count} từ khóa nghi ngờ spam')
        
        # 4. Check for forbidden words
        forbidden_found = [word for word in TextValidator.FORBIDDEN_WORDS if word in text_lower]
        if forbidden_found:
            score -= 0.5
            reasons.append(f'❌ Chứa từ cấm: {", ".join(forbidden_found)}')
        
        # 5. Check for excessive CAPS
        caps_ratio = sum(1 for c in title if c.isupper()) / max(len(title), 1)
        if caps_ratio > 0.5:
            score -= 0.15
            reasons.append('⚠️ Quá nhiều chữ IN HOA trong tiêu đề')
        
        # 6. Check for phone numbers in title (not recommended)
        if re.search(r'\b0\d{9,10}\b', title):
            score -= 0.1
            reasons.append('⚠️ Không nên để số điện thoại trong tiêu đề')
        
        # 7. Check for repetitive characters
        if re.search(r'(.)\1{4,}', text_lower):  # 5+ repeated chars
            score -= 0.15
            reasons.append('⚠️ Phát hiện ký tự lặp lại nhiều lần')
        
        # 8. Bonus for good quality
        if len(description) >= 200 and spam_count == 0:
            score = min(1.0, score + 0.05)
            reasons.append('✅ Mô tả chi tiết, rõ ràng')
        
        return max(0.0, score), reasons


class CompletenessValidator:
    """Kiểm tra tính đầy đủ của thông tin"""
    
    REQUIRED_FIELDS = ['title', 'description', 'price', 'area', 'propertyType', 'address']
    IMPORTANT_FIELDS = ['bedrooms', 'bathrooms', 'images', 'amenities']
    
    @staticmethod
    def validate(property_data: Dict) -> Tuple[float, List[str]]:
        """
        Validate data completeness
        Returns: (score, reasons)
        """
        score = 1.0
        reasons = []
        
        # 1. Check required fields
        missing_required = [field for field in CompletenessValidator.REQUIRED_FIELDS 
                           if not property_data.get(field)]
        if missing_required:
            score -= 0.4
            reasons.append(f'❌ Thiếu thông tin bắt buộc: {", ".join(missing_required)}')
        
        # 2. Check important fields
        missing_important = [field for field in CompletenessValidator.IMPORTANT_FIELDS 
                            if not property_data.get(field)]
        if missing_important:
            penalty = 0.1 * len(missing_important)
            score -= penalty
            reasons.append(f'⚠️ Thiếu thông tin quan trọng: {", ".join(missing_important)}')
        
        # 3. Check address completeness
        address = property_data.get('address', {})
        if isinstance(address, dict):
            address_fields = ['street', 'ward', 'district', 'city']
            missing_address = [field for field in address_fields if not address.get(field)]
            if missing_address:
                score -= 0.15
                reasons.append(f'⚠️ Địa chỉ chưa đầy đủ: thiếu {", ".join(missing_address)}')
        
        # 4. Check location coordinates
        location = property_data.get('location', {})
        if isinstance(location, dict):
            coords = location.get('coordinates', [])
            if not coords or len(coords) != 2:
                score -= 0.1
                reasons.append('⚠️ Thiếu tọa độ vị trí (location)')
        
        # 5. Check images
        images = property_data.get('images', [])
        if not images or len(images) == 0:
            score -= 0.3
            reasons.append('❌ Chưa có hình ảnh')
        elif len(images) < 3:
            score -= 0.1
            reasons.append('⚠️ Nên bổ sung thêm hình ảnh (tối thiểu 3 ảnh)')
        elif len(images) >= 5:
            reasons.append('✅ Hình ảnh đầy đủ')
        
        # 6. Check amenities
        amenities = property_data.get('amenities', {})
        if isinstance(amenities, dict):
            amenity_count = sum(1 for v in amenities.values() if v)
            if amenity_count == 0:
                score -= 0.1
                reasons.append('⚠️ Chưa cung cấp thông tin tiện nghi')
        
        # 7. Bonus for completeness
        if not missing_required and not missing_important and len(images) >= 5:
            score = min(1.0, score + 0.05)
            reasons.append('✅ Thông tin đầy đủ và chi tiết')
        
        return max(0.0, score), reasons


class ImageValidator:
    """Kiểm tra hình ảnh"""
    
    @staticmethod
    def validate(images: List[str]) -> Tuple[float, List[str]]:
        """
        Validate images (basic checks)
        Returns: (score, reasons)
        """
        score = 1.0
        reasons = []
        
        if not images or len(images) == 0:
            score = 0.0
            reasons.append('❌ Không có hình ảnh')
            return score, reasons
        
        # 1. Check number of images
        if len(images) < 3:
            score -= 0.2
            reasons.append('⚠️ Số lượng ảnh ít (< 3)')
        elif len(images) >= 5:
            reasons.append('✅ Số lượng ảnh đầy đủ')
        
        # 2. Check for duplicate images (by URL)
        unique_images = set(images)
        if len(unique_images) < len(images):
            duplicates = len(images) - len(unique_images)
            score -= 0.1
            reasons.append(f'⚠️ Có {duplicates} ảnh trùng lặp')
        
        # 3. Check image URLs validity (basic)
        invalid_urls = [img for img in images if not img or not isinstance(img, str)]
        if invalid_urls:
            score -= 0.15
            reasons.append(f'⚠️ Có {len(invalid_urls)} URL ảnh không hợp lệ')
        
        return max(0.0, score), reasons


class PriceRangeValidator:
    """Kiểm tra giá có trong khoảng hợp lý không (basic rules)"""
    
    # Giá tham khảo theo loại hình (VNĐ/tháng)
    PRICE_RANGES = {
        'phong-tro': (500_000, 10_000_000),
        'nha-nguyen-can': (3_000_000, 50_000_000),
        'can-ho': (2_000_000, 100_000_000),
        'chung-cu-mini': (1_500_000, 20_000_000),
        'homestay': (1_000_000, 30_000_000)
    }
    
    @staticmethod
    def validate(price: float, property_type: str, area: float) -> Tuple[float, List[str]]:
        """
        Validate price reasonableness
        Returns: (score, reasons)
        """
        score = 1.0
        reasons = []
        
        # 1. Check if price is positive
        if price <= 0:
            score = 0.0
            reasons.append('❌ Giá không hợp lệ (≤ 0)')
            return score, reasons
        
        # 2. Check price range by property type
        min_price, max_price = PriceRangeValidator.PRICE_RANGES.get(
            property_type, 
            (500_000, 100_000_000)
        )
        
        if price < min_price:
            score -= 0.3
            reasons.append(f'⚠️ Giá quá thấp (< {min_price:,} VNĐ)')
        elif price > max_price:
            score -= 0.3
            reasons.append(f'⚠️ Giá quá cao (> {max_price:,} VNĐ)')
        else:
            reasons.append('✅ Giá trong khoảng hợp lý')
        
        # 3. Check price per square meter
        if area and area > 0:
            price_per_sqm = price / area
            
            # Phòng trọ: 20k - 400k/m2
            # Nhà nguyên căn: 30k - 1000k/m2
            if property_type == 'phong-tro':
                if price_per_sqm < 20_000:
                    score -= 0.15
                    reasons.append('⚠️ Đơn giá/m² quá thấp')
                elif price_per_sqm > 400_000:
                    score -= 0.15
                    reasons.append('⚠️ Đơn giá/m² quá cao')
        
        return max(0.0, score), reasons


def validate_property_rules(property_data: Dict) -> Dict:
    """
    Tổng hợp tất cả rule-based validators
    
    Args:
        property_data: Dictionary chứa thông tin property
    
    Returns:
        Dictionary chứa scores và reasons cho từng validator
    """
    title = property_data.get('title', '')
    description = property_data.get('description', '')
    price = property_data.get('price', 0)
    area = property_data.get('area', 0)
    property_type = property_data.get('propertyType', '')
    images = property_data.get('images', [])
    
    # Run all validators
    text_score, text_reasons = TextValidator.validate(title, description)
    completeness_score, completeness_reasons = CompletenessValidator.validate(property_data)
    image_score, image_reasons = ImageValidator.validate(images)
    price_score, price_reasons = PriceRangeValidator.validate(price, property_type, area)
    
    # Tính overall score (weighted average)
    weights = {
        'text': 0.25,
        'completeness': 0.30,
        'image': 0.20,
        'price': 0.25
    }
    
    overall_score = (
        text_score * weights['text'] +
        completeness_score * weights['completeness'] +
        image_score * weights['image'] +
        price_score * weights['price']
    )
    
    return {
        'overall_score': round(overall_score, 3),
        'details': {
            'text_score': round(text_score, 3),
            'completeness_score': round(completeness_score, 3),
            'image_score': round(image_score, 3),
            'price_score': round(price_score, 3)
        },
        'reasons': {
            'text': text_reasons,
            'completeness': completeness_reasons,
            'image': image_reasons,
            'price': price_reasons
        },
        'weights': weights
    }


if __name__ == '__main__':
    # Test
    sample_property = {
        'title': 'Phòng trọ giá rẻ quận 1',
        'description': 'Phòng đẹp, đầy đủ tiện nghi, gần trường đại học, siêu thị, giao thông thuận lợi.',
        'price': 3000000,
        'area': 25,
        'propertyType': 'phong-tro',
        'address': {
            'street': '123 Nguyễn Văn A',
            'ward': 'Phường 1',
            'district': 'Quận 1',
            'city': 'TP. Hồ Chí Minh'
        },
        'location': {
            'coordinates': [106.7009, 10.7769]
        },
        'bedrooms': 1,
        'bathrooms': 1,
        'images': ['url1', 'url2', 'url3'],
        'amenities': {
            'wifi': True,
            'ac': True
        }
    }
    
    result = validate_property_rules(sample_property)
    print('Overall Score:', result['overall_score'])
    print('\nDetails:', result['details'])
    print('\nReasons:')
    for category, reasons in result['reasons'].items():
        print(f'  {category}:')
        for reason in reasons:
            print(f'    - {reason}')
