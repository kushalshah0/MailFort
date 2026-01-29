# MailFort Backend - BERT Phishing Detection API

FastAPI service for email phishing detection using BERT.

## Setup

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### POST /analyze-email
Analyze an email for phishing detection.

**Request:**
```json
{
  "message_id": "string",
  "subject": "string",
  "from": "string",
  "body": "string"
}
```

**Response:**
```json
{
  "label": "phishing | legitimate",
  "confidence": 0.95,
  "severity": "high | medium | low",
  "phishing_type": null
}
```

### GET /health
Health check endpoint.

### GET /
Service information.
