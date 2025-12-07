"""
Core Moderation Service
Kết hợp Rule-based + ML để duyệt bài đăng
"""

from typing import Dict, List
from rule_validators import validate_property_rules
from ml_predictor import MLPredictor, evaluate_price


class ModerationService:
    """
    Service chính để duyệt bài đăng BĐS
    
    Pipeline:
    1. Rule-based validation (text, completeness, images)
    2. ML-based price evaluation
    3. Tổng hợp overall_score
    4. Quyết định: auto_approved / pending_review / rejected
    """
    
    def __init__(self, models_dir: str = '../models'):
        self.ml_predictor = MLPredictor(models_dir=models_dir)
        
        # Thresholds
        self.AUTO_APPROVE_THRESHOLD = 0.85
        self.REJECT_THRESHOLD = 0.60
    
    def moderate(self, property_data: Dict) -> Dict:
        """
        Moderate một bài đăng property
        
        Args:
            property_data: Dictionary chứa thông tin property
        
        Returns:
            Dictionary chứa kết quả moderation:
            {
                'success': bool,
                'overall_score': float,
                'decision': 'auto_approved' | 'pending_review' | 'rejected',
                'details': {...},
                'reasons': [...],
                'suggestions': [...]
            }
        """
        
        # 1. Rule-based validation
        rule_result = validate_property_rules(property_data)
        
        # 2. ML-based price evaluation
        price_result = evaluate_price(property_data, self.ml_predictor)
        
        # 3. Tổng hợp overall_score
        # Weights: rules 60%, ML 40%
        rule_score = rule_result['overall_score']
        ml_score = price_result['price_score']
        
        overall_score = 0.6 * rule_score + 0.4 * ml_score
        
        # 4. Quyết định
        if overall_score >= self.AUTO_APPROVE_THRESHOLD:
            decision = 'auto_approved'
            decision_text = '✅ Tự động duyệt'
        elif overall_score >= self.REJECT_THRESHOLD:
            decision = 'pending_review'
            decision_text = '⏳ Chờ duyệt thủ công'
        else:
            decision = 'rejected'
            decision_text = '❌ Từ chối'
        
        # 5. Tổng hợp reasons
        all_reasons = []
        
        # Reasons từ rules
        for category, reasons in rule_result['reasons'].items():
            all_reasons.extend(reasons)
        
        # Reasons từ ML
        all_reasons.extend(price_result['reasons'])
        
        # 6. Tạo suggestions nếu cần
        suggestions = self._generate_suggestions(
            rule_result, 
            price_result, 
            overall_score
        )
        
        # 7. Response
        return {
            'success': True,
            'overall_score': round(overall_score, 3),
            'decision': decision,
            'decision_text': decision_text,
            'details': {
                'rule_score': round(rule_score, 3),
                'ml_score': round(ml_score, 3),
                'text_score': rule_result['details']['text_score'],
                'completeness_score': rule_result['details']['completeness_score'],
                'image_score': rule_result['details']['image_score'],
                'price_score': price_result['price_score']
            },
            'reasons': all_reasons,
            'suggestions': suggestions,
            'price_analysis': {
                'predicted_price': price_result['predicted_price'],
                'actual_price': price_result['actual_price'],
                'deviation_pct': price_result['deviation_pct'],
                'is_anomaly': price_result['is_anomaly']
            },
            'thresholds': {
                'auto_approve': self.AUTO_APPROVE_THRESHOLD,
                'reject': self.REJECT_THRESHOLD
            }
        }
    
    def _generate_suggestions(
        self, 
        rule_result: Dict, 
        price_result: Dict, 
        overall_score: float
    ) -> List[str]:
        """
        Generate suggestions để cải thiện bài đăng
        """
        suggestions = []
        
        # 1. Suggestions từ text score
        if rule_result['details']['text_score'] < 0.8:
            suggestions.append('📝 Cải thiện tiêu đề và mô tả: viết rõ ràng, chi tiết hơn')
        
        # 2. Suggestions từ completeness
        if rule_result['details']['completeness_score'] < 0.8:
            suggestions.append('📋 Bổ sung đầy đủ thông tin: địa chỉ, diện tích, số phòng, tiện nghi')
        
        # 3. Suggestions từ images
        if rule_result['details']['image_score'] < 0.8:
            suggestions.append('📸 Tải lên thêm hình ảnh (tối thiểu 5 ảnh chất lượng tốt)')
        
        # 4. Suggestions từ price
        if price_result['is_anomaly']:
            deviation = price_result['deviation_pct']
            predicted = price_result['predicted_price']
            
            if deviation > 0:
                suggestions.append(
                    f'💰 Giá cao hơn thị trường {deviation:.1f}%. '
                    f'Giá tham khảo: {predicted:,} VNĐ. '
                    f'Nếu giá chính xác, hãy bổ sung mô tả giải thích.'
                )
            else:
                suggestions.append(
                    f'💰 Giá thấp hơn thị trường {abs(deviation):.1f}%. '
                    f'Giá tham khảo: {predicted:,} VNĐ. '
                    f'Vui lòng kiểm tra lại thông tin giá.'
                )
        
        # 5. Suggestions tổng quát
        if overall_score < self.REJECT_THRESHOLD:
            suggestions.append(
                '⚠️ Bài đăng chưa đạt yêu cầu tối thiểu. '
                'Vui lòng hoàn thiện theo các gợi ý trên.'
            )
        elif overall_score < self.AUTO_APPROVE_THRESHOLD:
            suggestions.append(
                'ℹ️ Bài đăng cần được kiểm tra thủ công. '
                'Bạn có thể cải thiện để tăng khả năng duyệt tự động.'
            )
        
        return suggestions
    
    def batch_moderate(self, properties: List[Dict]) -> List[Dict]:
        """
        Moderate nhiều properties cùng lúc
        """
        results = []
        for prop in properties:
            try:
                result = self.moderate(prop)
                results.append(result)
            except Exception as e:
                results.append({
                    'success': False,
                    'error': str(e),
                    'property_id': prop.get('_id', 'unknown')
                })
        return results


if __name__ == '__main__':
    # Test
    service = ModerationService(models_dir='../models')
    
    # Test case 1: Good property
    good_property = {
        'title': 'Phòng trọ cao cấp đầy đủ tiện nghi gần Đại học Quốc Gia',
        'description': '''
            Phòng trọ mới xây, sạch sẽ, thoáng mát, an ninh 24/7.
            Diện tích 25m2, có gác lửng, cửa sổ lớn, ánh sáng tự nhiên.
            Đầy đủ tiện nghi: điều hòa, nóng lạnh, wifi, máy giặt chung.
            Gần trường đại học, siêu thị, chợ, bệnh viện.
            Giờ giấc tự do, có thể nấu ăn.
        ''',
        'price': 3200000,
        'area': 25,
        'propertyType': 'phong-tro',
        'address': {
            'street': '123 Nguyễn Văn Cừ',
            'ward': 'Phường 4',
            'district': 'Quận 5',
            'city': 'TP. Hồ Chí Minh'
        },
        'location': {
            'coordinates': [106.6800, 10.7587]
        },
        'bedrooms': 1,
        'bathrooms': 1,
        'images': ['url1', 'url2', 'url3', 'url4', 'url5'],
        'amenities': {
            'wifi': True,
            'ac': True,
            'parking': True,
            'kitchen': True,
            'water': True,
            'laundry': True,
            'balcony': False,
            'security': True
        }
    }
    
    # Test case 2: Bad property
    bad_property = {
        'title': 'Phòng rẻ',
        'description': 'Phòng cho thuê. Liên hệ ngay.',
        'price': 50000000,  # Giá ảo
        'area': 15,
        'propertyType': 'phong-tro',
        'address': {
            'district': 'Quận 1'
        },
        'images': []
    }
    
    print('=' * 60)
    print('TEST CASE 1: Good Property')
    print('=' * 60)
    result1 = service.moderate(good_property)
    print(f"Overall Score: {result1['overall_score']}")
    print(f"Decision: {result1['decision_text']}")
    print(f"\nDetails: {result1['details']}")
    print(f"\nReasons:")
    for reason in result1['reasons'][:10]:  # Top 10
        print(f"  - {reason}")
    
    print('\n' + '=' * 60)
    print('TEST CASE 2: Bad Property')
    print('=' * 60)
    result2 = service.moderate(bad_property)
    print(f"Overall Score: {result2['overall_score']}")
    print(f"Decision: {result2['decision_text']}")
    print(f"\nSuggestions:")
    for suggestion in result2['suggestions']:
        print(f"  - {suggestion}")
