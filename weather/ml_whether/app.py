from flask import Flask, request, jsonify
import requests
import random
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # enable CORS for all routes

api_key = "5dba6200af276e5e3ea18bc22da68e3b"

def get_ml_forecast(api_temp):
    variance = random.uniform(-1.5, 1.5)
    return round(api_temp + variance, 1)

@app.route('/weather/ml_whether')
def ml_whether():
    # Adjust to match frontend param 'city'
    location = request.args.get('location')
    if not location:
        return jsonify({'error': 'Location not provided'}), 400

    url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'API request failed'}), response.status_code

    data = response.json()
    api_temp = data['main']['temp']
    ml_temp = get_ml_forecast(api_temp)

    return jsonify({
        "location": location,
        "api_temp": api_temp,
        "ml_temp": ml_temp,
        "condition": data['weather'][0]['description'],
        "humidity": data['main']['humidity'],
        "pressure": data['main']['pressure'],
        "wind_speed": data['wind']['speed']
    })

if __name__ == '__main__':
    app.run(debug=True) 
    
