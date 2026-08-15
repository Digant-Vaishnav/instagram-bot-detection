import os
import json
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from .llm_explainer import generate_audit_report
import logfire

from .feature_extractor import extract_features_from_json
from .inference import predictor

load_dotenv()

app = FastAPI(title="Spam Account Detection API")

from fastapi.middleware.cors import CORSMiddleware

# Add right after creating app = FastAPI(...)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logfire.configure()
logfire.instrument_fastapi(app)

HIKER_TOKEN = os.getenv("HIKERAPI_TOKEN")
HIKER_BASE_URL = "https://api.hikerapi.com/v1"
DATA_DIR = "raw_data"
os.makedirs(DATA_DIR, exist_ok=True)


class TargetRequest(BaseModel):
    target_username: str


@app.post("/api/v1/analyze")
async def analyze_target(request: TargetRequest):
    if not HIKER_TOKEN:
        raise HTTPException(status_code=500, detail="Server missing HikerAPI token.")

    headers = {"accept": "application/json", "x-access-key": HIKER_TOKEN}
    target = request.target_username

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 1. Fetch user metadata
            with logfire.span("Fetch User Metadata", target=target):
                info_res = await client.get(
                    f"{HIKER_BASE_URL}/user/by/username", 
                    params={"username": target},
                    headers=headers
                )
                info_res.raise_for_status()
                user_data = info_res.json()
                user_id = user_data.get("pk")

            # 2. Fetch follower network
            with logfire.span("Fetch Follower Network", target=target) as net_span:
                f_res = await client.get(
                    f"{HIKER_BASE_URL}/user/followers/chunk", 
                    params={"user_id": user_id, "amount": 100},
                    headers=headers
                )
                f_res.raise_for_status()
                followers_raw = f_res.json()
                
                follower_objects = followers_raw[0] if isinstance(followers_raw, list) and len(followers_raw) > 0 else []
                followers_list = [f.get("username") for f in follower_objects if "username" in f]
                net_span.set_attribute("followers_extracted", len(followers_list))

            # 3. Save raw JSON payload
            full_payload = {
                "user_metadata": user_data,
                "sampled_followers": followers_list
            }
            file_path = os.path.join(DATA_DIR, f"{target}.json")
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(full_payload, f, indent=4)

            # 4. Feature Extraction
            with logfire.span("Feature Extraction", target=target):
                ml_feature_vector = extract_features_from_json(user_data, target)

            # 5. Model Inference via inference.py
            with logfire.span("Model Inference", target=target):
                prediction_result = predictor.predict(ml_feature_vector)

            # 6. LLM Explainability Engine
            with logfire.span("LLM Security Audit", target=target):
                # Map the raw vector list back to a dictionary for the LLM prompt
                feature_dict = {
                    "has_profile_pic": ml_feature_vector[0],
                    "username_num_ratio": ml_feature_vector[1],
                    "bio_length": ml_feature_vector[5],
                    "follower_count": ml_feature_vector[9],
                    "following_count": ml_feature_vector[10]
                }
                
                audit_report = await generate_audit_report(
                    target_username=target, 
                    features=feature_dict, 
                    prediction=prediction_result
                )

            return {
                "status": "success",
                "target": target,
                "profile_pic_url": user_data.get("profile_pic_url", ""),
                "prediction": prediction_result,
                "audit_report": audit_report, # <-- LLM text is now in your API!
                "features": feature_dict,
                "network": {
                    "sampled_followers": followers_list
                }
            }
        except httpx.HTTPStatusError as e:
            logfire.error("HikerAPI HTTP Error: {error}", error=str(e))
            raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch data from API")
        except Exception as e:
            logfire.error("Execution failed: {error}", error=str(e))
            raise HTTPException(status_code=500, detail=str(e))