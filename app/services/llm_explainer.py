import os
from openai import AsyncOpenAI
import logfire
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()

# Initialize the client. It will automatically use the OPENAI_API_KEY from the environment.
client = AsyncOpenAI()

async def generate_audit_report(target_username: str, features: dict, prediction: dict) -> str:
    """
    Passes the XGBoost results to an LLM to generate a clear, human-readable security report.
    """
    bot_percentage = round(prediction["bot_probability"] * 100, 2)
    confidence = prediction["confidence_score"]
    verdict = prediction["verdict"]

    prompt = f"""
    You are an AI cybersecurity analyst. Our primary Machine Learning model analyzed the Instagram account '@{target_username}'.
    
    Model Verdict: {verdict}
    Model Confidence: {confidence}%
    Estimated Bot Risk: {bot_percentage}%
    
    Account Data:
    - Followers: {features['follower_count']:,}
    - Following: {features['following_count']:,}
    - Biography Length: {features['bio_length']} characters
    - Has Profile Picture: {'Yes' if features['has_profile_pic'] == 1 else 'No'}
    - Username includes digits: {'Yes' if features['username_num_ratio'] > 0.2 else 'No'}
    
    Write a concise 2-sentence security audit summary explaining WHY the model arrived at this verdict.
    - If it is authentic, explain why the low bot risk makes sense.
    - If it is fake/spam, highlight the red flags.
    Be professional, direct, and do not mention that you are an AI.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logfire.error("LLM Generation failed: {error}", error=str(e))
        return "Automated audit report unavailable at this time."