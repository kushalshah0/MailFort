# Backend Summary

## Overview

MailFort backend is a FastAPI-based phishing detection service using deep learning models (BERT, LSTM, GRU) with SHAP explainability.

## Tech Stack

- **Framework**: FastAPI 0.109.0 + Uvicorn
- **ML Models**: PyTorch 2.1.2 (LSTM, GRU)
- **Explainability**: SHAP (KernelExplainer)
- **Data Validation**: Pydantic 2.5.3 + pydantic-settings
- **HTML Parsing**: BeautifulSoup4 + lxml
- **Deployment**: Ready for Vercel, Render

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── README.md                  # Documentation
├── summary.md                 # This file
├── .env                       # Environment variables
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── models_data/               # Trained model files
│   ├── lstm_model.pt         # PyTorch LSTM model (~10MB)
│   ├── gru_model.pt          # PyTorch GRU model (~10MB)
│   └── rnn_tokenizer.pkl     # Tokenizer for RNNs (~6MB)
├── app/                      # Application modules
│   ├── __init__.py
│   ├── api.py               # API routes (/predict, /analyze-email, /health)
│   ├── models.py            # Pydantic schemas
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py        # Settings (pydantic-settings)
│   └── services/
│       ├── __init__.py
│       ├── model_manager.py  # Multi-model loading & prediction
│       ├── preprocessor.py  # Text cleaning & tokenization
│       └── shap_explainer.py # SHAP token attribution
└── venv/                    # Virtual environment
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Analyze email with LSTM or GRU (includes SHAP tokens) |
| POST | `/analyze-email` | Analyze email with BERT |
| GET | `/health` | Health check endpoint |
| GET | `/` | Service information |

## Supported Models

| Model | Endpoint | SHAP Explainability |
|-------|----------|-------------------|
| `lstm` | `/predict` | Yes - token-level attribution |
| `gru` | `/predict` | Yes - token-level attribution |
| `bert` | `/analyze-email` | No |

## API Usage

### POST /predict

Request:
```json
{
  "text": "Your account has been compromised. Click here to reset your password immediately.",
  "model": "lstm"
}
```

Response:
```json
{
  "model": "lstm",
  "prediction": "phishing",
  "confidence": 0.94,
  "top_tokens": [
    {"token": "click", "shap_score": 0.15},
    {"token": "compromised", "shap_score": 0.12},
    {"token": "immediately", "shap_score": 0.08}
  ]
}
```

### POST /analyze-email

Request:
```json
{
  "message_id": "12345",
  "subject": "Urgent: Verify your account",
  "from_": "noreply@suspicious.com",
  "body": "Click here to verify your account immediately!"
}
```

Response:
```json
{
  "label": "phishing",
  "confidence": 0.95,
  "severity": "high",
  "phishing_type": null
}
```

## Severity Levels (for /analyze-email)

| Confidence | Severity |
|------------|----------|
| ≥ 90% | high |
| ≥ 70% | medium |
| < 70% | low |

## Configuration (.env)

```
HOST=0.0.0.0
PORT=8000
MODEL_PATH=./models/bert-phishing-detector
MODEL_PATH_LSTM=./models_data/lstm_model.pt
MODEL_PATH_GRU=./models_data/gru_model.pt
TOKENIZER_PATH_RNN=./models_data/rnn_tokenizer.pkl
```

## Running the Server

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## CORS

- Allowed origin: `http://localhost:3000` (for Next.js frontend)

## Notes

- Models are loaded once at startup via FastAPI lifespan
- SHAP explainability available for LSTM and GRU models
- CUDA support if available, otherwise CPU
- Device info logged at startup
