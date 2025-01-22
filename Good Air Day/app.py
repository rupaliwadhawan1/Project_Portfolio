from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
from aqi_forecast_google import fetch_air_quality_data, process_data, train_model, forecast_aqi

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

@app.route('/forecast-aqi', methods=['POST'])
def forecast_aqi_endpoint():
    try:
        data = request.json
        lat = data.get("latitude")
        lon = data.get("longitude")
        features = data.get("features")  # Optional custom features for prediction

        if not lat or not lon:
            return jsonify({"error": "Latitude and longitude are required."}), 400

        # Fetch historical data
        end_date = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        start_date = (datetime.datetime.utcnow() - datetime.timedelta(days=30)).strftime('%Y-%m-%dT%H:%M:%SZ')
        historical_data = fetch_air_quality_data(lat, lon, start_date, end_date)

        if not historical_data:
            return jsonify({"error": "No data available for the specified location and time range."}), 400

        df = process_data(historical_data)
        model = train_model(df)

        # If custom features are provided, use them for prediction
        if features:
            predicted_naqi = forecast_aqi(model, features)
        else:
            # Use average feature values for demo prediction
            features = df[['pm2_5', 'pm10', 'no2', 'o3', 'co']].mean().tolist()
            predicted_naqi = forecast_aqi(model, features)

        return jsonify({
            "predicted_naqi": predicted_naqi,
            "category": get_naqi_category(predicted_naqi)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_naqi_category(naqi):
    if naqi <= 50:
        return 'Good'
    elif naqi <= 100:
        return 'Satisfactory'
    elif naqi <= 200:
        return 'Moderate'
    elif naqi <= 300:
        return 'Poor'
    elif naqi <= 400:
        return 'Very Poor'
    else:
        return 'Severe'

if __name__ == '__main__':
    app.run(debug=True)
