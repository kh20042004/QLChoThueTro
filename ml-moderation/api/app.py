"""
Flask API Server for Moderation Service
Expose moderation service qua REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from moderation_service import ModerationService
import os
from datetime import datetime


app = Flask(__name__)
CORS(app)  # Enable CORS cho tất cả origins

# Initialize moderation service
models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
moderation_service = ModerationService(models_dir=models_dir)

print('=' * 60)
print('🤖 ML Moderation Service Started')
print('=' * 60)


@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'service': 'ML Moderation Service',
        'status': 'running',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/moderate', methods=['POST'])
def moderate():
    """
    Moderate một bài đăng property
    
    Request Body:
    {
        "property": {
            "title": "...",
            "description": "...",
            "price": 3000000,
            "area": 25,
            ...
        }
    }
    
    Response:
    {
        "success": true,
        "overall_score": 0.87,
        "decision": "auto_approved",
        "details": {...},
        "reasons": [...],
        "suggestions": [...]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'property' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing property data in request body'
            }), 400
        
        property_data = data['property']
        
        # Moderate
        result = moderation_service.moderate(property_data)
        
        # Log request
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Moderated property")
        print(f"  Title: {property_data.get('title', 'N/A')[:50]}")
        print(f"  Score: {result['overall_score']}")
        print(f"  Decision: {result['decision']}")
        
        return jsonify(result), 200
    
    except Exception as e:
        print(f"Error in /api/moderate: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/moderate/batch', methods=['POST'])
def moderate_batch():
    """
    Moderate nhiều properties cùng lúc
    
    Request Body:
    {
        "properties": [
            {...},
            {...}
        ]
    }
    
    Response:
    {
        "success": true,
        "results": [...]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'properties' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing properties array in request body'
            }), 400
        
        properties = data['properties']
        
        if not isinstance(properties, list):
            return jsonify({
                'success': False,
                'error': 'properties must be an array'
            }), 400
        
        # Batch moderate
        results = moderation_service.batch_moderate(properties)
        
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Batch moderated {len(properties)} properties")
        
        return jsonify({
            'success': True,
            'count': len(results),
            'results': results
        }), 200
    
    except Exception as e:
        print(f"Error in /api/moderate/batch: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check với thông tin chi tiết"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Moderation Service',
        'models_loaded': {
            'price_model': moderation_service.ml_predictor.price_model is not None,
            'anomaly_model': moderation_service.ml_predictor.anomaly_model is not None,
            'scaler': moderation_service.ml_predictor.scaler is not None
        },
        'thresholds': {
            'auto_approve': moderation_service.AUTO_APPROVE_THRESHOLD,
            'reject': moderation_service.REJECT_THRESHOLD
        },
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    return jsonify({
        'thresholds': {
            'auto_approve': moderation_service.AUTO_APPROVE_THRESHOLD,
            'reject': moderation_service.REJECT_THRESHOLD
        },
        'weights': {
            'rules': 0.6,
            'ml': 0.4
        },
        'models_status': {
            'price_model_loaded': moderation_service.ml_predictor.price_model is not None,
            'anomaly_model_loaded': moderation_service.ml_predictor.anomaly_model is not None
        }
    }), 200


@app.route('/api/config', methods=['POST'])
def update_config():
    """Update configuration (thresholds)"""
    try:
        data = request.get_json()
        
        if 'auto_approve_threshold' in data:
            threshold = float(data['auto_approve_threshold'])
            if 0 <= threshold <= 1:
                moderation_service.AUTO_APPROVE_THRESHOLD = threshold
            else:
                return jsonify({'error': 'Threshold must be between 0 and 1'}), 400
        
        if 'reject_threshold' in data:
            threshold = float(data['reject_threshold'])
            if 0 <= threshold <= 1:
                moderation_service.REJECT_THRESHOLD = threshold
            else:
                return jsonify({'error': 'Threshold must be between 0 and 1'}), 400
        
        return jsonify({
            'success': True,
            'message': 'Configuration updated',
            'thresholds': {
                'auto_approve': moderation_service.AUTO_APPROVE_THRESHOLD,
                'reject': moderation_service.REJECT_THRESHOLD
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Kiểm tra có chạy trên Colab không
    try:
        import google.colab
        IN_COLAB = True
    except:
        IN_COLAB = False
    
    if IN_COLAB:
        # Chạy trên Colab với ngrok
        print('\n🚀 Running on Google Colab - Setting up ngrok tunnel...\n')
        from pyngrok import ngrok
        
        # Start ngrok tunnel
        public_url = ngrok.connect(5000)
        print(f'✅ Public URL: {public_url}')
        print(f'📝 Add this URL to your .env file:')
        print(f'   MODERATION_SERVICE_URL={public_url}')
        print('\n' + '=' * 60)
        
        # Run Flask
        app.run(host='0.0.0.0', port=5000)
    else:
        # Chạy local
        print('\n🚀 Running locally on http://localhost:5000\n')
        app.run(host='0.0.0.0', port=5000, debug=True)
