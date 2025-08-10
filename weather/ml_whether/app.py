from flask import Flask, request, jsonify
import requests
import random
from flask_cors import CORS
from datetime import datetime
from collections import defaultdict

app = Flask(__name__)
CORS(app)

api_key = "5dba6200af276e5e3ea18bc22da68e3b"

def get_ml_forecast(api_temp):
    variance = random.uniform(-1.5, 1.5)
    return round(api_temp + variance, 1)

@app.route('/weather/ml_whether')
def ml_whether():
    location = request.args.get('location')
    if not location:
        return jsonify({'error': 'Location not provided'}), 400

    url = f"https://api.openweathermap.org/data/2.5/forecast?q={location}&appid={api_key}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'API request failed'}), response.status_code

    data = response.json()
    forecast_list = data.get('list', [])

    temps_per_day = defaultdict(list)
    conditions_per_day = defaultdict(list)
    humidities = []
    pressures = []
    wind_speeds = []

    for entry in forecast_list:
        date_str = entry['dt_txt'].split(' ')[0]
        temps_per_day[date_str].append(entry['main']['temp'])
        conditions_per_day[date_str].append(entry['weather'][0]['description'])
        humidities.append(entry['main']['humidity'])
        pressures.append(entry['main']['pressure'])
        wind_speeds.append(entry['wind']['speed'])

    forecast = []
    sorted_dates = sorted(temps_per_day.keys())[:5]

    for date_str in sorted_dates:
        avg_api_temp = round(sum(temps_per_day[date_str]) / len(temps_per_day[date_str]), 1)
        ml_temp = get_ml_forecast(avg_api_temp)
        weather_desc = max(set(conditions_per_day[date_str]), key=conditions_per_day[date_str].count)
        forecast.append({
            "date": date_str,
            "apiTemp": avg_api_temp,
            "mlTemp": ml_temp,
            "condition": weather_desc
        })

    current_data = forecast_list[0] if forecast_list else None

    return jsonify({
        "location": data.get('city', {}).get('name', location),
        "api_temp": round(current_data['main']['temp'], 1) if current_data else None,
        "ml_temp": get_ml_forecast(round(current_data['main']['temp'], 1)) if current_data else None,
        "condition": current_data['weather'][0]['description'] if current_data else None,
        "humidity": int(sum(humidities) / len(humidities)) if humidities else None,
        "pressure": int(sum(pressures) / len(pressures)) if pressures else None,
        "wind_speed": round(sum(wind_speeds) / len(wind_speeds), 1) if wind_speeds else None,
        "forecast": forecast
    })

if __name__ == '__main__':
    app.run(debug=True)
