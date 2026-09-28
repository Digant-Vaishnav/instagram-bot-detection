<div align="center">
  
  <h1>🛡️ BotLens</h1>
  <p><b>AI-Powered Social Network Forensics & Bot Detection</b></p>

  [![Live Demo](https://img.shields.io/badge/Live_Demo-View_App-blue?style=for-the-badge)](https://instagram-bot-detection-hm8r.vercel.app/)
  
  [![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)]()
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)]()
  [![XGBoost](https://img.shields.io/badge/XGBoost-F37626?style=flat&logo=xgboost&logoColor=white)]()
  [![OpenAI](https://img.shields.io/badge/OpenAI_XAI-412991?style=flat&logo=openai&logoColor=white)]()
  [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)]()

</div>

---

> **Live Application:** [instagram-bot-detection-hm8r.vercel.app](https://instagram-bot-detection-hm8r.vercel.app/)

## 📖 Overview
**BotLens** is an end-to-end Machine Learning web application designed to mitigate social engineering risks by identifying automated and inauthentic Instagram accounts in real time. 

Built with a focus on **MLOps and Explainable AI (XAI)**, this system handles the complete data lifecycle: live data extraction, feature engineering, model inference, LLM-based audit generation, and dynamic frontend visualization. It is designed to evaluate account metadata, network topologies, and behavioral patterns to generate high-confidence risk assessments.

## 🚀 Core Architecture

1. **Data Extraction (ETL):** Connects to third-party endpoints (HikerAPI) to scrape live user metadata and follower networks asynchronously.
2. **Feature Engineering:** Transforms raw, unstructured JSON payloads into optimized numerical vectors, handling missing data, categorically encoding variables, and computing behavioral ratios (e.g., username-to-digit ratios, bio lengths).
3. **Model Inference:** A pre-trained XGBoost classification model evaluates the 1D feature vector to predict bot probability and calculate a confidence score.
4. **Explainable AI (XAI):** Passes the mathematical feature vector and inference results to an LLM (GPT-3.5) to generate a zero-shot, human-readable security audit report.
5. **Client Presentation:** A React.js dashboard visualizes the telemetry, displaying threat assessments, confidence metrics, and interactive network graphs.

## 🛠️ Technology Stack

**Machine Learning & Data Engineering**
* **XGBoost:** Core classification algorithm for bot detection.
* **Scikit-Learn:** Model evaluation and data preprocessing.
* **Pandas / NumPy:** Vector manipulation and feature scaling.

**Backend & APIs**
* **Python / FastAPI:** High-performance, asynchronous REST API.
* **Pydantic:** Strict type enforcement and data validation.
* **HTTPX:** Asynchronous third-party data fetching.
* **OpenAI API:** Generative AI for plain-text security audits.

**Frontend & Observability**
* **React.js:** Dynamic, state-driven user interface.
* **Logfire:** Distributed tracing for monitoring inference latency and API bottlenecks.

## 📂 Project Structure

```text
├── backend/
│   ├── api.py                   # FastAPI router and orchestration
│   ├── feature_extractor.py     # Data transformation and feature engineering
│   ├── inference.py             # Singleton ML class and model loading
│   ├── llm_explainer.py         # OpenAI prompt engineering for XAI
│   └── spam_model.pkl           # Serialized XGBoost model
├── frontend/
│   ├── src/
│   ├── App.jsx              # Main React UI and state management
│   ├── NetworkGraph.jsx     # Visual node graph for follower topology
│   └── index.css            # Styling and layout
└── README.md