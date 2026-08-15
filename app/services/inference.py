import os
import pickle
import numpy as np
import logfire

MODEL_PATH = os.path.join(os.path.dirname(__file__), "spam_model.pkl")

class SpamPredictor:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model = self._load_model(model_path)

    def _load_model(self, path: str):
        if not os.path.exists(path):
            logfire.error("Model file not found at path: {path}", path=path)
            raise FileNotFoundError(f"Model file not found at {path}")
        try:
            with open(path, "rb") as f:
                model = pickle.load(f)
            logfire.info("XGBoost model loaded successfully from {path}", path=path)
            return model
        except Exception as e:
            logfire.error("Failed to deserialize model: {error}", error=str(e))
            raise RuntimeError(f"Failed to load ML model: {e}")

    def predict(self, feature_vector: list) -> dict:
        """
        Receives a numerical feature vector and returns JSON-safe Python types.
        """
        if self.model is None:
            raise RuntimeError("Model is not initialized.")

        # Ensure correct input shape: (1, n_features)
        input_array = np.array([feature_vector], dtype=np.float32)

        # Run inference
        raw_prediction = self.model.predict(input_array)[0]
        raw_probabilities = self.model.predict_proba(input_array)[0]

        # Explicitly cast from numpy types to native Python types
        prediction = int(raw_prediction)
        is_bot = bool(prediction == 1)
        
        bot_prob = float(raw_probabilities[1])
        max_prob = float(np.max(raw_probabilities))

        return {
            "is_bot": is_bot,
            "verdict": "Fake / Spam Account" if is_bot else "Authentic / Real Account",
            "bot_probability": float(round(bot_prob, 4)),
            "confidence_score": float(round(max_prob * 100, 2))
        }

predictor = SpamPredictor()