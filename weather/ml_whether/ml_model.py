import random

class MLWeatherModel:
    def __init__(self):
        self.accuracy = 87.0
        self.mae = 1.2
        self.rmse = 1.8
        self.r2 = 92.0
        self.training_count = 0
    
    def train(self):
        """Simulate training the model to improve performance"""
        # Improve metrics slightly with each training
        self.accuracy = min(95.0, self.accuracy + random.uniform(0.5, 2.0))
        self.mae = max(0.8, self.mae - random.uniform(0.05, 0.2))
        self.r2 = min(97.0, self.r2 + random.uniform(0.5, 1.5))
        self.training_count += 1
        
        return {
            'accuracy': round(self.accuracy, 1),
            'mae': round(self.mae, 1),
            'rmse': round(self.rmse, 1),
            'r2': round(self.r2, 1)
        }
    
    def predict(self, api_forecast):
        """Predict temperatures based on API forecast with some variance"""
        predictions = []
        for temp in api_forecast:
            # Add variance based on model accuracy
            variance = (random.random() - 0.5) * (100 - self.accuracy) / 10
            predictions.append(temp + variance)
        return predictions