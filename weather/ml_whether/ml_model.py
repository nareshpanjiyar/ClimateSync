import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Constants for feature names and target
FEATURE_NAMES = ["day", "month", "hour", "humidity", "pressure", "wind_speed"]
TARGET = "temp"

def create_sample_data(csv_path):
    """Create sample weather data if file doesn't exist"""
    print("[WARNING] No CSV found - generating sample data...")
    np.random.seed(42)
    
    # Create 500 daily timestamps with fixed hour (e.g. 12:00) for simplicity
    dates = pd.date_range("2025-01-01 12:00:00", periods=500, freq="D")
    sample_data = {
        "datetime": dates,
        "humidity": np.random.uniform(40, 90, 500).round(1),
        "pressure": np.random.uniform(1000, 1025, 500).round(1),
        "wind_speed": np.random.uniform(0, 15, 500).round(1),
        "temp": np.random.uniform(25, 30, 500).round(1)
    }
    df = pd.DataFrame(sample_data)
    df.to_csv(csv_path, index=False)
    return df

def load_or_create_data():
    """Load CSV or create sample data if missing"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "historical_weather.csv")
    
    try:
        df = pd.read_csv(csv_path, parse_dates=["datetime"])
        print(f"[SUCCESS] Loaded {len(df)} records from {csv_path}")
        return df
    except FileNotFoundError:
        return create_sample_data(csv_path)
    except Exception as e:
        print(f"[ERROR] Loading {csv_path}: {e}")
        exit(1)

def process_data(df):
    """Clean and prepare features with robust datetime handling"""
    try:
        if "datetime" not in df.columns:
            if "date" in df.columns and "time" in df.columns:
                df["datetime"] = pd.to_datetime(df["date"] + " " + df["time"])
            else:
                raise ValueError("Missing datetime or date/time columns")
        
        df["datetime"] = pd.to_datetime(df["datetime"])
        
        df["day"] = df["datetime"].dt.day
        df["month"] = df["datetime"].dt.month
        df["hour"] = df["datetime"].dt.hour

        missing_features = [f for f in FEATURE_NAMES if f not in df.columns]
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")
            
        if TARGET not in df.columns:
            raise ValueError(f"Missing target column: {TARGET}")

        return df
    except Exception as e:
        print(f"[ERROR] Data processing: {e}")
        exit(1)

def train_and_save_model(df):
    """Train model and save artifacts with feature validation"""
    try:
        X = df[FEATURE_NAMES]
        y = df[TARGET]

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )

        model = RandomForestRegressor(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        print("\nModel Performance:")
        print(f"- MAE: {mean_absolute_error(y_test, y_pred):.2f}°C")
        print(f"- R²: {r2_score(y_test, y_pred):.2f}")

        script_dir = os.path.dirname(os.path.abspath(__file__))
        joblib.dump(model, os.path.join(script_dir, "model.pkl"))
        joblib.dump(scaler, os.path.join(script_dir, "scaler.pkl"))
        
        print("\n[SUCCESS] Saved model artifacts:")
        print(f" - model.pkl\n - scaler.pkl")
        print(f"Features used: {FEATURE_NAMES}")

    except Exception as e:
        print(f"[ERROR] Training: {e}")
        exit(1)

if __name__ == "__main__":
    print("=== Weather Model Training ===")
    df = load_or_create_data()
    processed_df = process_data(df)
    print("\nSample data:")
    print(processed_df[["datetime", "temp"]].head())
    train_and_save_model(processed_df)
