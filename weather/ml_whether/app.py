from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from collections import defaultdict
import joblib
import numpy as np
import os
import pandas as pd
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)

api_key = "5dba6200af276e5e3ea18bc22da68e3b"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")

# Load model artifacts
try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("Model and scaler loaded successfully.")
except Exception as e:
    model = None
    scaler = None
    print(f"Error loading model artifacts: {e}")

def safe_float(val):
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0

def prepare_features(dt_string, humidity, pressure, wind_speed):
    """Prepare input features with all required columns"""
    try:
        dt = datetime.strptime(dt_string, "%Y-%m-%d %H:%M:%S")
        day = dt.day
        month = dt.month
        hour = dt.hour
        
        # Use DataFrame with columns matching training features to avoid warnings
        features = pd.DataFrame(
            [[day, month, hour, humidity, pressure, wind_speed]],
            columns=["day", "month", "hour", "humidity", "pressure", "wind_speed"]
        )
        return features
    except Exception as e:
        print(f"Feature preparation error: {e}")
        return None

def get_ml_forecast(dt_string, humidity, pressure, wind_speed):
    if model and scaler:
        try:
            features = prepare_features(dt_string, humidity, pressure, wind_speed)
            if features is None:
                return None
                
            scaled = scaler.transform(features)
            prediction = model.predict(scaled)[0]
            return round(float(prediction), 1)
        except Exception as e:
            print(f"Prediction error: {e}")
            return None
    return None

@app.route('/')
def home():
    return jsonify({"message": "Weather ML Forecast API is running"})

@app.route('/weather/ml_whether')
def ml_whether():
    location = request.args.get('location')
    if not location:
        return jsonify({'error': 'Location not provided'}), 400

    # Call forecast API for 5-day forecast data
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?q={location}&appid={api_key}&units=metric"
    forecast_resp = requests.get(forecast_url)
    if forecast_resp.status_code != 200:
        return jsonify({'error': 'Forecast API request failed'}), forecast_resp.status_code
    forecast_data = forecast_resp.json()
    forecast_list = forecast_data.get('list', [])

    if not forecast_list:
        return jsonify({'error': 'No forecast data available'}), 404

    # Call current weather API for real current conditions
    current_url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric"
    current_resp = requests.get(current_url)
    if current_resp.status_code != 200:
        return jsonify({'error': 'Current weather API request failed'}), current_resp.status_code
    current_data = current_resp.json()

    # Use timezone-aware datetime fromtimestamp instead of deprecated utcfromtimestamp
    timestamp = current_data.get('dt')
    if timestamp:
        current_dt = datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    else:
        current_dt = ""

    current_temp = current_data.get('main', {}).get('temp')
    current_humidity = current_data.get('main', {}).get('humidity')
    current_pressure = current_data.get('main', {}).get('pressure')
    current_wind_speed = current_data.get('wind', {}).get('speed')
    current_condition = current_data.get('weather', [{}])[0].get('description', '')

    # Process forecast data for 5-day summary
    temps_per_day = defaultdict(list)
    conditions_per_day = defaultdict(list)
    day_first_entry = {}
    day_first_dt = {}
    daily_humidity = defaultdict(list)
    daily_pressure = defaultdict(list)
    daily_wind_speed = defaultdict(list)

    for entry in forecast_list:
        date_str = entry['dt_txt'].split(' ')[0]
        dt_string = entry['dt_txt']

        temps_per_day[date_str].append(entry['main']['temp'])
        conditions_per_day[date_str].append(entry['weather'][0]['description'])
        daily_humidity[date_str].append(entry['main']['humidity'])
        daily_pressure[date_str].append(entry['main']['pressure'])
        daily_wind_speed[date_str].append(entry['wind']['speed'])

        if date_str not in day_first_entry:
            day_first_entry[date_str] = round(entry['main']['temp'], 1)
            day_first_dt[date_str] = dt_string

    forecast = []
    sorted_dates = sorted(temps_per_day.keys())[:5]

    for date_str in sorted_dates:
        avg_hum = int(sum(daily_humidity[date_str]) / len(daily_humidity[date_str]))
        avg_pres = int(sum(daily_pressure[date_str]) / len(daily_pressure[date_str]))
        avg_wind = round(sum(daily_wind_speed[date_str]) / len(daily_wind_speed[date_str]), 1)

        api_temp_real = day_first_entry.get(date_str)
        dt_string = day_first_dt.get(date_str)
        weather_desc = max(set(conditions_per_day[date_str]), key=conditions_per_day[date_str].count)
        ml_temp = get_ml_forecast(dt_string, avg_hum, avg_pres, avg_wind) if dt_string else None

        forecast.append({
            "date": date_str,
            "apiTemp": api_temp_real,
            "mlTemp": ml_temp,
            "condition": weather_desc,
            "humidity": avg_hum,
            "pressure": avg_pres,
            "windSpeed": avg_wind
        })

    return jsonify({
        "location": forecast_data.get('city', {}).get('name', location),
        "current": {
            "apiTemp": round(current_temp, 1) if current_temp is not None else None,
            "mlTemp": get_ml_forecast(
                current_dt,
                safe_float(current_humidity),
                safe_float(current_pressure),
                safe_float(current_wind_speed)
            ),
            "condition": current_condition,
            "humidity": current_humidity,
            "pressure": current_pressure,
            "windSpeed": current_wind_speed,
            "timestamp": current_dt
        },
        "forecast": forecast
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
