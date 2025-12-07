"""
Price Prediction Model Training Script
Train XGBoost model để dự đoán giá thuê
"""

import os
import sys
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import joblib

# Cấu hình
plt.style.use('ggplot')
sns.set_palette('husl')

print("=" * 80)
print("PRICE PREDICTION MODEL TRAINING (XGBoost)")
print("=" * 80)

def load_data():
    """Load training data"""
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'training_data.csv')
    
    if not os.path.exists(data_path):
        print(f"\n✗ Không tìm thấy file: {data_path}")
        print("→ Chạy script 1_data_preparation.py trước!")
        sys.exit(1)
    
    df = pd.read_csv(data_path)
    print(f"\n✓ Đã load {len(df)} records từ {data_path}")
    return df

def feature_engineering(df):
    """Tạo thêm features"""
    print("\n[Feature Engineering]")
    
    # Price per sqm
    df['price_per_sqm'] = df['price'] / df['area']
    
    # Total amenities
    amenity_cols = [
        'has_wifi', 'has_parking', 'has_air_conditioner', 'has_water_heater',
        'has_kitchen', 'has_fridge', 'has_washing_machine', 'has_tv',
        'has_bed', 'has_wardrobe'
    ]
    df['total_amenities'] = df[amenity_cols].sum(axis=1)
    df['amenity_score'] = df['total_amenities'] / len(amenity_cols)
    
    # Interaction features
    df['area_rooms'] = df['area'] * df['bedrooms']
    df['area_amenities'] = df['area'] * df['amenity_score']
    
    print(f"✓ Đã tạo thêm 5 features mới")
    return df

def prepare_train_test(df):
    """Chuẩn bị train/test sets"""
    feature_columns = [
        # Location
        'province_encoded', 'district_encoded',
        # Property
        'area', 'bedrooms', 'bathrooms', 'floor',
        # Amenities
        'has_wifi', 'has_parking', 'has_air_conditioner', 'has_water_heater',
        'has_kitchen', 'has_fridge', 'has_washing_machine', 'has_tv',
        'has_bed', 'has_wardrobe',
        # Engineered features
        'total_amenities', 'amenity_score', 'area_rooms', 'area_amenities'
    ]
    
    X = df[feature_columns]
    y = df['price']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"\n✓ Training set: {len(X_train)} samples")
    print(f"✓ Test set: {len(X_test)} samples")
    print(f"✓ Features: {len(feature_columns)}")
    
    return X_train, X_test, y_train, y_test, feature_columns

def train_baseline_model(X_train, y_train, X_test, y_test):
    """Train baseline model"""
    print("\n[Training Baseline Model]")
    
    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    print("✓ Baseline Performance:")
    print(f"  Train MAE: {mean_absolute_error(y_train, y_pred_train):,.0f} VNĐ")
    print(f"  Test MAE: {mean_absolute_error(y_test, y_pred_test):,.0f} VNĐ")
    print(f"  Test RMSE: {np.sqrt(mean_squared_error(y_test, y_pred_test)):,.0f} VNĐ")
    print(f"  Test R²: {r2_score(y_test, y_pred_test):.4f}")
    
    return model

def tune_hyperparameters(X_train, y_train):
    """Hyperparameter tuning"""
    print("\n[Hyperparameter Tuning]")
    print("Đang tìm kiếm hyperparameters tốt nhất...")
    print("(Có thể mất vài phút)")
    
    param_grid = {
        'n_estimators': [100, 200, 300],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [3, 5, 7],
        'min_child_weight': [1, 3, 5],
        'subsample': [0.8, 0.9, 1.0],
        'colsample_bytree': [0.8, 0.9, 1.0]
    }
    
    xgb_model = xgb.XGBRegressor(random_state=42, n_jobs=-1)
    
    grid_search = GridSearchCV(
        estimator=xgb_model,
        param_grid=param_grid,
        cv=5,
        scoring='neg_mean_absolute_error',
        verbose=1,
        n_jobs=-1
    )
    
    grid_search.fit(X_train, y_train)
    
    print("\n✓ Best Hyperparameters:")
    for param, value in grid_search.best_params_.items():
        print(f"  {param}: {value}")
    
    return grid_search.best_estimator_

def evaluate_model(model, X_train, y_train, X_test, y_test):
    """Đánh giá model chi tiết"""
    print("\n" + "=" * 80)
    print("MODEL EVALUATION")
    print("=" * 80)
    
    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Training set metrics
    print("\n[Training Set]")
    train_mae = mean_absolute_error(y_train, y_pred_train)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    train_r2 = r2_score(y_train, y_pred_train)
    train_mape = np.mean(np.abs((y_train - y_pred_train) / y_train)) * 100
    
    print(f"  MAE: {train_mae:,.0f} VNĐ")
    print(f"  RMSE: {train_rmse:,.0f} VNĐ")
    print(f"  R²: {train_r2:.4f}")
    print(f"  MAPE: {train_mape:.2f}%")
    
    # Test set metrics
    print("\n[Test Set]")
    test_mae = mean_absolute_error(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    test_r2 = r2_score(y_test, y_pred_test)
    test_mape = np.mean(np.abs((y_test - y_pred_test) / y_test)) * 100
    
    print(f"  MAE: {test_mae:,.0f} VNĐ")
    print(f"  RMSE: {test_rmse:,.0f} VNĐ")
    print(f"  R²: {test_r2:.4f}")
    print(f"  MAPE: {test_mape:.2f}%")
    
    # Cross-validation
    print("\n[Cross-Validation (5-fold)]")
    cv_scores = cross_val_score(model, X_train, y_train, 
                                 cv=5, scoring='neg_mean_absolute_error')
    print(f"  CV MAE: {-cv_scores.mean():,.0f} ± {cv_scores.std():,.0f} VNĐ")
    
    return {
        'test_mae': test_mae,
        'test_rmse': test_rmse,
        'test_r2': test_r2,
        'test_mape': test_mape
    }

def plot_results(model, X_test, y_test, feature_columns):
    """Visualize kết quả"""
    print("\n[Generating Visualizations]")
    
    y_pred_test = model.predict(X_test)
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'outputs')
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Actual vs Predicted
    fig, axes = plt.subplots(1, 2, figsize=(15, 5))
    
    axes[0].scatter(y_test, y_pred_test, alpha=0.5)
    axes[0].plot([y_test.min(), y_test.max()], 
                 [y_test.min(), y_test.max()], 
                 'r--', lw=2)
    axes[0].set_xlabel('Giá thực tế (VNĐ)')
    axes[0].set_ylabel('Giá dự đoán (VNĐ)')
    axes[0].set_title('Actual vs Predicted Price')
    
    # 2. Residuals
    residuals = y_test - y_pred_test
    axes[1].scatter(y_pred_test, residuals, alpha=0.5)
    axes[1].axhline(y=0, color='r', linestyle='--', lw=2)
    axes[1].set_xlabel('Giá dự đoán (VNĐ)')
    axes[1].set_ylabel('Residuals (VNĐ)')
    axes[1].set_title('Residual Plot')
    
    plt.tight_layout()
    plot_path = os.path.join(output_dir, 'price_prediction.png')
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"✓ Saved: {plot_path}")
    plt.close()
    
    # 3. Feature Importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    plt.figure(figsize=(10, 8))
    plt.barh(feature_importance['feature'][:15], 
             feature_importance['importance'][:15])
    plt.xlabel('Importance')
    plt.title('Top 15 Most Important Features')
    plt.gca().invert_yaxis()
    plt.tight_layout()
    
    importance_path = os.path.join(output_dir, 'feature_importance.png')
    plt.savefig(importance_path, dpi=300, bbox_inches='tight')
    print(f"✓ Saved: {importance_path}")
    plt.close()
    
    return feature_importance

def save_model(model, feature_columns, metrics, feature_importance):
    """Lưu model và metadata"""
    print("\n[Saving Model]")
    
    # Create models directory
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Save model
    model_data = {
        'model': model,
        'feature_columns': feature_columns,
        'metrics': metrics,
        'feature_importance': feature_importance.to_dict('records'),
        'created_at': datetime.now().isoformat()
    }
    
    model_path = os.path.join(models_dir, 'price_model.pkl')
    joblib.dump(model_data, model_path)
    print(f"✓ Model saved: {model_path}")
    
    # Save metadata
    metadata = {
        'model_type': 'XGBoost Regressor',
        'n_features': len(feature_columns),
        'features': feature_columns,
        'metrics': metrics,
        'top_features': feature_importance.head(10).to_dict('records'),
        'created_at': datetime.now().isoformat()
    }
    
    metadata_path = os.path.join(models_dir, 'price_model_metadata.json')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"✓ Metadata saved: {metadata_path}")
    
    return model_path

def test_sample(model, feature_columns):
    """Test với property mẫu"""
    print("\n" + "=" * 80)
    print("TESTING WITH SAMPLE PROPERTY")
    print("=" * 80)
    
    sample = {
        'province_encoded': 1,  # Hồ Chí Minh
        'district_encoded': 5,
        'area': 25,
        'bedrooms': 1,
        'bathrooms': 1,
        'floor': 2,
        'has_wifi': 1,
        'has_parking': 1,
        'has_air_conditioner': 1,
        'has_water_heater': 1,
        'has_kitchen': 1,
        'has_fridge': 1,
        'has_washing_machine': 0,
        'has_tv': 1,
        'has_bed': 1,
        'has_wardrobe': 1,
        'total_amenities': 9,
        'amenity_score': 0.9,
        'area_rooms': 25,
        'area_amenities': 22.5
    }
    
    sample_df = pd.DataFrame([sample])
    predicted_price = model.predict(sample_df)[0]
    
    print("\nThông tin property:")
    print(f"  - Địa điểm: Hồ Chí Minh")
    print(f"  - Diện tích: {sample['area']} m²")
    print(f"  - Phòng ngủ: {sample['bedrooms']}")
    print(f"  - Phòng tắm: {sample['bathrooms']}")
    print(f"  - Tiện nghi: {sample['total_amenities']}/10")
    print(f"\n✓ Giá dự đoán: {predicted_price:,.0f} VNĐ/tháng")

def main():
    print("\n[1/7] Load dữ liệu...")
    df = load_data()
    
    print("\n[2/7] Feature engineering...")
    df = feature_engineering(df)
    
    print("\n[3/7] Chuẩn bị train/test sets...")
    X_train, X_test, y_train, y_test, feature_columns = prepare_train_test(df)
    
    print("\n[4/7] Train baseline model...")
    baseline_model = train_baseline_model(X_train, y_train, X_test, y_test)
    
    print("\n[5/7] Hyperparameter tuning...")
    best_model = tune_hyperparameters(X_train, y_train)
    
    print("\n[6/7] Evaluate final model...")
    metrics = evaluate_model(best_model, X_train, y_train, X_test, y_test)
    
    print("\n[7/7] Save model và visualizations...")
    feature_importance = plot_results(best_model, X_test, y_test, feature_columns)
    model_path = save_model(best_model, feature_columns, metrics, feature_importance)
    
    # Test
    test_sample(best_model, feature_columns)
    
    # Summary
    print("\n" + "=" * 80)
    print("✓ HOÀN TẤT!")
    print("=" * 80)
    print(f"\nModel đã được lưu tại:")
    print(f"  {model_path}")
    print(f"\nPerformance:")
    print(f"  Test MAE: {metrics['test_mae']:,.0f} VNĐ")
    print(f"  Test RMSE: {metrics['test_rmse']:,.0f} VNĐ")
    print(f"  Test R²: {metrics['test_r2']:.4f}")
    print(f"  Test MAPE: {metrics['test_mape']:.2f}%")
    print("\n→ Bước tiếp theo: Chạy script 3_train_anomaly_model.py")
    print("=" * 80)

if __name__ == "__main__":
    main()
