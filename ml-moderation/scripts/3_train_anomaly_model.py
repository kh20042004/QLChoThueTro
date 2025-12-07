"""
Anomaly Detection Model Training Script
Train Isolation Forest để phát hiện giá bất thường
"""

import os
import sys
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

# Cấu hình
plt.style.use('ggplot')
sns.set_palette('husl')

print("=" * 80)
print("ANOMALY DETECTION MODEL TRAINING (Isolation Forest)")
print("=" * 80)

def load_data_and_model():
    """Load training data và price model"""
    # Load CSV
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'training_data.csv')
    if not os.path.exists(data_path):
        print(f"\n✗ Không tìm thấy file: {data_path}")
        print("→ Chạy script 1_data_preparation.py trước!")
        sys.exit(1)
    
    df = pd.read_csv(data_path)
    print(f"\n✓ Đã load {len(df)} records từ CSV")
    
    # Load price model
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'price_model.pkl')
    if not os.path.exists(model_path):
        print(f"\n✗ Không tìm thấy price model: {model_path}")
        print("→ Chạy script 2_train_price_model.py trước!")
        sys.exit(1)
    
    price_model_data = joblib.load(model_path)
    price_model = price_model_data['model']
    feature_columns = price_model_data['feature_columns']
    
    print(f"✓ Đã load price model")
    print(f"  Test MAE: {price_model_data['metrics']['test_mae']:,.0f} VNĐ")
    print(f"  Test R²: {price_model_data['metrics']['test_r2']:.4f}")
    
    return df, price_model, feature_columns

def create_anomaly_features(df, price_model, feature_columns):
    """Tạo features cho anomaly detection"""
    print("\n[Creating Anomaly Features]")
    
    # Recreate engineered features
    amenity_cols = [
        'has_wifi', 'has_parking', 'has_air_conditioner', 'has_water_heater',
        'has_kitchen', 'has_fridge', 'has_washing_machine', 'has_tv',
        'has_bed', 'has_wardrobe'
    ]
    df['total_amenities'] = df[amenity_cols].sum(axis=1)
    df['amenity_score'] = df['total_amenities'] / len(amenity_cols)
    df['area_rooms'] = df['area'] * df['bedrooms']
    df['area_amenities'] = df['area'] * df['amenity_score']
    
    # Predict prices
    X = df[feature_columns]
    df['predicted_price'] = price_model.predict(X)
    
    # Price differences
    df['price_diff'] = df['price'] - df['predicted_price']
    df['price_diff_percent'] = (df['price_diff'] / df['predicted_price']) * 100
    
    # Price per sqm
    df['price_per_sqm'] = df['price'] / df['area']
    df['predicted_price_per_sqm'] = df['predicted_price'] / df['area']
    
    # Z-score
    df['price_diff_zscore'] = (df['price_diff'] - df['price_diff'].mean()) / df['price_diff'].std()
    
    print(f"✓ Đã tạo anomaly features")
    print(f"\nPrice Prediction Statistics:")
    print(f"  Mean difference: {df['price_diff'].mean():,.0f} VNĐ")
    print(f"  Std difference: {df['price_diff'].std():,.0f} VNĐ")
    print(f"  Mean difference %: {df['price_diff_percent'].mean():.2f}%")
    print(f"\nProperties với giá lệch:")
    print(f"  > 50%: {len(df[abs(df['price_diff_percent']) > 50])} properties")
    print(f"  > 100%: {len(df[abs(df['price_diff_percent']) > 100])} properties")
    
    return df

def prepare_features(df):
    """Chuẩn bị features cho Isolation Forest"""
    anomaly_features = [
        # Price-related
        'price',
        'predicted_price',
        'price_diff',
        'price_diff_percent',
        'price_per_sqm',
        'predicted_price_per_sqm',
        'price_diff_zscore',
        # Property features
        'area',
        'bedrooms',
        'bathrooms',
        # Location
        'province_encoded',
        'district_encoded',
        # Amenities
        'total_amenities',
        'amenity_score'
    ]
    
    X_anomaly = df[anomaly_features]
    
    # Standardize
    scaler = StandardScaler()
    X_anomaly_scaled = scaler.fit_transform(X_anomaly)
    
    print(f"\n✓ Features cho anomaly detection: {len(anomaly_features)}")
    print(f"✓ Shape: {X_anomaly_scaled.shape}")
    
    return X_anomaly_scaled, scaler, anomaly_features

def train_isolation_forest(X_anomaly_scaled):
    """Train Isolation Forest"""
    print("\n[Training Isolation Forest]")
    
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.1,  # 10% outliers
        max_samples='auto',
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    
    iso_forest.fit(X_anomaly_scaled)
    
    print("✓ Training hoàn tất!")
    return iso_forest

def evaluate_model(iso_forest, X_anomaly_scaled, df):
    """Đánh giá model"""
    print("\n" + "=" * 80)
    print("MODEL EVALUATION")
    print("=" * 80)
    
    # Predict
    df['anomaly_label'] = iso_forest.predict(X_anomaly_scaled)
    df['anomaly_score'] = iso_forest.score_samples(X_anomaly_scaled)
    
    # Statistics
    n_anomalies = len(df[df['anomaly_label'] == -1])
    n_normal = len(df[df['anomaly_label'] == 1])
    
    print(f"\n[Results]")
    print(f"  Normal: {n_normal} ({n_normal/len(df)*100:.1f}%)")
    print(f"  Anomalies: {n_anomalies} ({n_anomalies/len(df)*100:.1f}%)")
    print(f"\n[Anomaly Scores]")
    print(f"  Range: [{df['anomaly_score'].min():.4f}, {df['anomaly_score'].max():.4f}]")
    print(f"  Mean (normal): {df[df['anomaly_label'] == 1]['anomaly_score'].mean():.4f}")
    print(f"  Mean (anomaly): {df[df['anomaly_label'] == -1]['anomaly_score'].mean():.4f}")
    
    return df, n_anomalies, n_normal

def analyze_thresholds(df):
    """Phân tích thresholds"""
    print("\n[Threshold Analysis]")
    
    quantiles = [0.01, 0.05, 0.1, 0.15, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
    score_quantiles = df['anomaly_score'].quantile(quantiles)
    
    print("\nAnomaly Score Quantiles:")
    for q, score in score_quantiles.items():
        count = len(df[df['anomaly_score'] <= score])
        print(f"  {q*100:>5.1f}% quantile: {score:>8.4f} ({count:>4} properties)")
    
    thresholds = {
        'strict': float(score_quantiles[0.05]),
        'moderate': float(score_quantiles[0.1]),
        'lenient': float(score_quantiles[0.15])
    }
    
    print("\n[Recommended Thresholds]")
    print(f"\n  Strict (top 5% most anomalous):")
    print(f"    threshold = {thresholds['strict']:.4f}")
    print(f"    → {len(df[df['anomaly_score'] <= thresholds['strict']])} properties rejected")
    
    print(f"\n  Moderate (top 10% most anomalous):")
    print(f"    threshold = {thresholds['moderate']:.4f}")
    print(f"    → {len(df[df['anomaly_score'] <= thresholds['moderate']])} properties rejected")
    
    print(f"\n  Lenient (top 15% most anomalous):")
    print(f"    threshold = {thresholds['lenient']:.4f}")
    print(f"    → {len(df[df['anomaly_score'] <= thresholds['lenient']])} properties rejected")
    
    return thresholds

def plot_results(df):
    """Visualize kết quả"""
    print("\n[Generating Visualizations]")
    
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'outputs')
    os.makedirs(output_dir, exist_ok=True)
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # 1. Histogram of anomaly scores
    axes[0, 0].hist(df[df['anomaly_label'] == 1]['anomaly_score'], 
                    bins=30, alpha=0.7, label='Normal', color='blue')
    axes[0, 0].hist(df[df['anomaly_label'] == -1]['anomaly_score'], 
                    bins=30, alpha=0.7, label='Anomaly', color='red')
    axes[0, 0].set_xlabel('Anomaly Score')
    axes[0, 0].set_ylabel('Count')
    axes[0, 0].set_title('Distribution of Anomaly Scores')
    axes[0, 0].legend()
    
    # 2. Anomaly score vs price difference
    axes[0, 1].scatter(df[df['anomaly_label'] == 1]['anomaly_score'],
                       df[df['anomaly_label'] == 1]['price_diff_percent'],
                       alpha=0.5, label='Normal', s=20)
    axes[0, 1].scatter(df[df['anomaly_label'] == -1]['anomaly_score'],
                       df[df['anomaly_label'] == -1]['price_diff_percent'],
                       alpha=0.7, label='Anomaly', s=50, color='red')
    axes[0, 1].set_xlabel('Anomaly Score')
    axes[0, 1].set_ylabel('Price Difference (%)')
    axes[0, 1].set_title('Anomaly Score vs Price Difference')
    axes[0, 1].legend()
    
    # 3. Price distribution
    axes[1, 0].boxplot([df[df['anomaly_label'] == 1]['price'],
                         df[df['anomaly_label'] == -1]['price']],
                        labels=['Normal', 'Anomaly'])
    axes[1, 0].set_ylabel('Price (VNĐ)')
    axes[1, 0].set_title('Price Distribution by Label')
    
    # 4. Price diff % distribution
    axes[1, 1].boxplot([df[df['anomaly_label'] == 1]['price_diff_percent'],
                         df[df['anomaly_label'] == -1]['price_diff_percent']],
                        labels=['Normal', 'Anomaly'])
    axes[1, 1].set_ylabel('Price Difference (%)')
    axes[1, 1].set_title('Price Difference by Label')
    
    plt.tight_layout()
    plot_path = os.path.join(output_dir, 'anomaly_detection.png')
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"✓ Saved: {plot_path}")
    plt.close()

def analyze_anomalies(df):
    """Phân tích các anomalies"""
    print("\n[Top 10 Most Anomalous Properties]")
    
    anomalies = df[df['anomaly_label'] == -1].sort_values('anomaly_score')
    
    for i, (idx, row) in enumerate(anomalies.head(10).iterrows(), 1):
        print(f"\n{i}. Property #{idx}:")
        print(f"   Actual price: {row['price']:,.0f} VNĐ")
        print(f"   Predicted price: {row['predicted_price']:,.0f} VNĐ")
        print(f"   Difference: {row['price_diff_percent']:+.1f}%")
        print(f"   Anomaly score: {row['anomaly_score']:.4f}")
        print(f"   Area: {row['area']} m², Bedrooms: {int(row['bedrooms'])}")
        print(f"   Price/m²: {row['price_per_sqm']:,.0f} VNĐ")

def save_model(iso_forest, scaler, anomaly_features, thresholds, n_anomalies, df):
    """Lưu model"""
    print("\n[Saving Model]")
    
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Save model
    anomaly_model_data = {
        'model': iso_forest,
        'scaler': scaler,
        'anomaly_features': anomaly_features,
        'thresholds': thresholds,
        'statistics': {
            'n_anomalies': int(n_anomalies),
            'contamination': 0.1,
            'score_range': [float(df['anomaly_score'].min()), 
                            float(df['anomaly_score'].max())]
        },
        'created_at': datetime.now().isoformat()
    }
    
    model_path = os.path.join(models_dir, 'anomaly_model.pkl')
    joblib.dump(anomaly_model_data, model_path)
    print(f"✓ Model saved: {model_path}")
    
    # Save metadata
    metadata = {
        'model_type': 'Isolation Forest',
        'n_features': len(anomaly_features),
        'features': anomaly_features,
        'thresholds': thresholds,
        'statistics': anomaly_model_data['statistics'],
        'created_at': datetime.now().isoformat()
    }
    
    metadata_path = os.path.join(models_dir, 'anomaly_model_metadata.json')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"✓ Metadata saved: {metadata_path}")
    
    return model_path

def test_samples(iso_forest, scaler, anomaly_features, price_model, price_feature_columns, thresholds):
    """Test với các trường hợp mẫu"""
    print("\n" + "=" * 80)
    print("TESTING WITH SAMPLE PROPERTIES")
    print("=" * 80)
    
    def test_property(name, area, bedrooms, bathrooms, amenities_count, price):
        # Create features
        total_amenities = amenities_count
        amenity_score = amenities_count / 10.0
        
        price_features = {
            'province_encoded': 1,
            'district_encoded': 5,
            'area': area,
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'floor': 2,
            'has_wifi': 1 if amenities_count >= 1 else 0,
            'has_parking': 1 if amenities_count >= 2 else 0,
            'has_air_conditioner': 1 if amenities_count >= 3 else 0,
            'has_water_heater': 1 if amenities_count >= 4 else 0,
            'has_kitchen': 1 if amenities_count >= 5 else 0,
            'has_fridge': 1 if amenities_count >= 6 else 0,
            'has_washing_machine': 1 if amenities_count >= 7 else 0,
            'has_tv': 1 if amenities_count >= 8 else 0,
            'has_bed': 1 if amenities_count >= 9 else 0,
            'has_wardrobe': 1 if amenities_count >= 10 else 0,
            'total_amenities': total_amenities,
            'amenity_score': amenity_score,
            'area_rooms': area * bedrooms,
            'area_amenities': area * amenity_score
        }
        
        # Predict price
        X_price = pd.DataFrame([price_features])
        predicted_price = price_model.predict(X_price)[0]
        
        # Create anomaly features
        price_diff = price - predicted_price
        price_diff_percent = (price_diff / predicted_price) * 100
        
        anomaly_data = {
            'price': price,
            'predicted_price': predicted_price,
            'price_diff': price_diff,
            'price_diff_percent': price_diff_percent,
            'price_per_sqm': price / area,
            'predicted_price_per_sqm': predicted_price / area,
            'price_diff_zscore': 0,  # Simplified
            'area': area,
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'province_encoded': 1,
            'district_encoded': 5,
            'total_amenities': total_amenities,
            'amenity_score': amenity_score
        }
        
        # Predict anomaly
        X_anomaly = pd.DataFrame([anomaly_data])[anomaly_features]
        X_anomaly_scaled = scaler.transform(X_anomaly)
        anomaly_score = iso_forest.score_samples(X_anomaly_scaled)[0]
        
        is_anomaly = anomaly_score < thresholds['moderate']
        
        print(f"\n{name}:")
        print(f"  Area: {area} m², {bedrooms} bedrooms, {amenities_count}/10 amenities")
        print(f"  Actual price: {price:,.0f} VNĐ")
        print(f"  Predicted price: {predicted_price:,.0f} VNĐ")
        print(f"  Difference: {price_diff_percent:+.1f}%")
        print(f"  Anomaly score: {anomaly_score:.4f}")
        
        if is_anomaly:
            print(f"  ⚠️  CẢNH BÁO: Giá bất thường - cần review!")
        else:
            print(f"  ✓ OK: Giá hợp lý")
    
    # Test cases
    test_property("Normal Property", 25, 1, 1, 8, 3000000)
    test_property("Overpriced (giá quá cao)", 20, 1, 1, 3, 8000000)
    test_property("Underpriced (giá quá thấp)", 50, 2, 2, 10, 1500000)
    test_property("Luxury Property", 80, 3, 2, 10, 15000000)

def main():
    print("\n[1/8] Load dữ liệu và price model...")
    df, price_model, price_feature_columns = load_data_and_model()
    
    print("\n[2/8] Tạo anomaly features...")
    df = create_anomaly_features(df, price_model, price_feature_columns)
    
    print("\n[3/8] Chuẩn bị features cho Isolation Forest...")
    X_anomaly_scaled, scaler, anomaly_features = prepare_features(df)
    
    print("\n[4/8] Train Isolation Forest...")
    iso_forest = train_isolation_forest(X_anomaly_scaled)
    
    print("\n[5/8] Evaluate model...")
    df, n_anomalies, n_normal = evaluate_model(iso_forest, X_anomaly_scaled, df)
    
    print("\n[6/8] Analyze thresholds...")
    thresholds = analyze_thresholds(df)
    
    print("\n[7/8] Visualize và analyze...")
    plot_results(df)
    analyze_anomalies(df)
    
    print("\n[8/8] Save model...")
    model_path = save_model(iso_forest, scaler, anomaly_features, thresholds, n_anomalies, df)
    
    # Test
    test_samples(iso_forest, scaler, anomaly_features, price_model, price_feature_columns, thresholds)
    
    # Summary
    print("\n" + "=" * 80)
    print("✓ HOÀN TẤT!")
    print("=" * 80)
    print(f"\nModel đã được lưu tại:")
    print(f"  {model_path}")
    print(f"\nThresholds:")
    print(f"  Strict: {thresholds['strict']:.4f}")
    print(f"  Moderate: {thresholds['moderate']:.4f}")
    print(f"  Lenient: {thresholds['lenient']:.4f}")
    print("\n→ Bước tiếp theo: Upload 2 models vào ml-moderation/models/")
    print("→ Sau đó chạy Flask API server")
    print("=" * 80)

if __name__ == "__main__":
    main()
